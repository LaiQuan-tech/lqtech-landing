// 輕量寄信工具：直接打 Resend REST API（不裝額外套件）。
// 僅伺服器端使用；RESEND_API_KEY 為 server-only secret。

type SendArgs = {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
};

export async function sendEmail({ to, subject, html, text, replyTo }: SendArgs): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // 未設定金鑰時不報錯，讓表單流程照常成功（fail-safe）。
    console.warn("[email] RESEND_API_KEY 未設定，略過寄信。");
    return { ok: false, error: "no_api_key" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.LEAD_NOTIFY_FROM || "萊乾資訊官網 <onboarding@resend.dev>",
        to: [to],
        subject,
        html,
        text,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("[email] Resend 寄信失敗:", res.status, detail);
      return { ok: false, error: `resend_${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    console.error("[email] Resend 例外:", e);
    return { ok: false, error: "exception" };
  }
}
