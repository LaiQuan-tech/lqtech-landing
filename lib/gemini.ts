import { createAdminSupabase } from "@/lib/supabase";

const MODEL = "gemini-flash-lite-latest";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

// 每 IP 每日上限 + 全站每日上限（保護免費配額 / 防濫用）
const PER_IP_DAILY = 40;
const GLOBAL_DAILY = 2000;

export type GeminiOpts = {
  system?: string;
  maxTokens?: number;
  temperature?: number;
};

/** 取用戶端 IP（Vercel 會帶 x-forwarded-for）。 */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "0.0.0.0";
}

/** 速率限制：先檢查全站每日，再檢查該 IP 每日。回 true = 允許。 */
export async function rateLimit(ip: string): Promise<boolean> {
  const supabase = createAdminSupabase();
  if (!supabase) return true; // 未設定 DB 時不擋（開發用）
  try {
    const g = await supabase.rpc("ai_rate_check", { p_ip: "__global__", p_limit: GLOBAL_DAILY });
    if (g.error || g.data === false) return false;
    const u = await supabase.rpc("ai_rate_check", { p_ip: ip, p_limit: PER_IP_DAILY });
    if (u.error) return true; // RPC 出錯不因此擋掉正常用戶
    return u.data !== false;
  } catch {
    return true;
  }
}

export class RateLimitError extends Error {}
export class GeminiError extends Error {}

// 關閉 thinking：thinking token 與回覆共用 maxOutputTokens，思考太多會把預算吃光、
// 回傳空字串（我們會丟 GeminiError("empty") → 前端顯示「AI 忙線中」）。
// 實測（2026-08，長 system prompt + 客人一次問多個服務）：
//   thinkingLevel "low" → thinking 644 tokens（已超過 chat 的 600 上限 → 空回覆）
//   thinkingLevel "minimal" → thinking 0 tokens，回覆完整
// ⚠️ 這個參數的形狀 Google 改過：gemini-3.5 起不再接受舊的 { thinkingBudget: 0 }
// （2026-08 起一律回 400 INVALID_ARGUMENT，曾導致整個 AI 客服掛掉）。
// 因此 postGemini() 對 400 會自動移除 thinkingConfig 重試一次，日後再變也不會全掛。
const THINKING = { thinkingLevel: "minimal" } as const;

/**
 * 送出請求，含兩種自癒：
 * 1. 400 且帶 thinkingConfig → 移除該設定重試（Google 改過此參數形狀，見上方註解）。
 * 2. 429 / 5xx → 短暫等待後重試一次（Gemini 偶發 overloaded / RPM 尖峰，
 *    單次失敗就放棄會讓使用者看到「AI 忙線中」，實際上重試多半就成功）。
 */
async function postGemini(key: string, body: Record<string, unknown>): Promise<Response> {
  const send = (b: Record<string, unknown>) =>
    fetch(`${ENDPOINT}?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(b),
    });

  let payload = body;
  let res = await send(payload);

  // 400：疑似 thinkingConfig 不被接受 → 拿掉重送（後續重試沿用去掉的版本）
  if (res.status === 400) {
    const gc = payload.generationConfig as Record<string, unknown> | undefined;
    if (gc && "thinkingConfig" in gc) {
      const { thinkingConfig: _dropped, ...gcWithoutThinking } = gc;
      console.warn("[gemini] thinkingConfig 被拒（400），移除後重試");
      payload = { ...payload, generationConfig: gcWithoutThinking };
      res = await send(payload);
    }
  }

  // 429 / 5xx：暫時性錯誤，等一下再試一次
  if (res.status === 429 || res.status >= 500) {
    const first = res.status;
    await new Promise((r) => setTimeout(r, 800));
    res = await send(payload);
    console.warn(`[gemini] ${first} → 重試後 ${res.status}`);
  }

  return res;
}

/** 呼叫 Gemini（壓低 thinking 以免吃掉輸出預算）。回傳純文字。 */
export async function callGemini(prompt: string, opts: GeminiOpts = {}): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new GeminiError("gemini_not_configured");

  const body: Record<string, unknown> = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: opts.temperature ?? 0.7,
      maxOutputTokens: opts.maxTokens ?? 800,
      thinkingConfig: THINKING,
    },
  };
  if (opts.system) {
    body.systemInstruction = { parts: [{ text: opts.system }] };
  }

  const res = await postGemini(key, body);

  if (res.status === 429) throw new RateLimitError("quota");
  if (!res.ok) throw new GeminiError(`http_${res.status}`);

  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("").trim();
  if (!text) throw new GeminiError("empty");
  return text;
}

export type ChatTurn = { role: "user" | "model"; text: string };

/** 多輪對話版：turns 為 user/model 交錯的訊息。 */
export async function callGeminiChat(turns: ChatTurn[], opts: GeminiOpts = {}): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new GeminiError("gemini_not_configured");

  const body: Record<string, unknown> = {
    contents: turns.slice(-12).map((t) => ({ role: t.role, parts: [{ text: t.text }] })),
    generationConfig: {
      temperature: opts.temperature ?? 0.6,
      maxOutputTokens: opts.maxTokens ?? 600,
      thinkingConfig: THINKING,
    },
  };
  if (opts.system) body.systemInstruction = { parts: [{ text: opts.system }] };

  const res = await postGemini(key, body);
  if (res.status === 429) throw new RateLimitError("quota");
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error(`[gemini] chat HTTP ${res.status}:`, detail.slice(0, 300));
    throw new GeminiError(`http_${res.status}`);
  }
  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> }; finishReason?: string }>;
    usageMetadata?: { thoughtsTokenCount?: number; candidatesTokenCount?: number };
  };
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("").trim();
  if (!text) {
    // 最常見成因：thinking + 回覆吃光 maxOutputTokens（finishReason=MAX_TOKENS）。
    console.error(
      "[gemini] chat 回應為空 finishReason=",
      data.candidates?.[0]?.finishReason,
      "usage=",
      JSON.stringify(data.usageMetadata ?? {})
    );
    throw new GeminiError("empty");
  }
  return text;
}

/** 呼叫 Gemini 並要求回傳符合 schema 的 JSON（結構化萃取用）。任何錯誤回 null，不 throw。 */
export async function callGeminiJSON<T = unknown>(
  prompt: string,
  opts: { system?: string; schema: Record<string, unknown>; maxTokens?: number }
): Promise<T | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;

  const body: Record<string, unknown> = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: opts.maxTokens ?? 400,
      thinkingConfig: THINKING,
      responseMimeType: "application/json",
      responseSchema: opts.schema,
    },
  };
  if (opts.system) body.systemInstruction = { parts: [{ text: opts.system }] };

  try {
    const res = await postGemini(key, body);
    if (!res.ok) return null;
    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("").trim();
    if (!text) return null;
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

/** 統一的 API route 錯誤回應（友善訊息 + 導 LINE）。 */
export function aiErrorResponse(err: unknown): { status: number; body: Record<string, unknown> } {
  if (err instanceof RateLimitError) {
    return {
      status: 429,
      body: { ok: false, error: "rate_limited", message: "今天的 AI 試用次數用得差不多了，歡迎在官網下方填聯絡表單，我們會盡快與您聯繫。" },
    };
  }
  return {
    status: 502,
    body: { ok: false, error: "ai_error", message: "AI 暫時忙線中，請稍後再試，或在官網下方填聯絡表單與我們聯繫。" },
  };
}
