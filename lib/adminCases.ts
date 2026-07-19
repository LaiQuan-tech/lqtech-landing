import { createAdminSupabase } from "@/lib/supabase";

/** 案件狀態（app 端 allowlist；DB 存 text）。 */
export const CASE_STATUSES = ["洽談中", "報價中", "進行中", "已完成", "已結案", "擱置"] as const;
export type CaseStatus = (typeof CASE_STATUSES)[number];

/** 案件來源。 */
export const CASE_SOURCES = ["line", "ai_chat", "referral", "manual"] as const;
export type CaseSource = (typeof CASE_SOURCES)[number];

export const SOURCE_LABELS: Record<string, string> = {
  line: "LINE",
  ai_chat: "AI 客服",
  referral: "轉介紹",
  manual: "手動新增",
};

/** 各狀態的 chip 顏色（前景/底色）。 */
export const STATUS_COLORS: Record<string, { fg: string; bg: string }> = {
  洽談中: { fg: "#8a6d00", bg: "#fff4d1" },
  報價中: { fg: "#b45309", bg: "#fdecdb" },
  進行中: { fg: "#0f56a6", bg: "#e2effb" },
  已完成: { fg: "#1f7a44", bg: "#dcf3e5" },
  已結案: { fg: "#3f7a52", bg: "#e8f2ea" },
  擱置: { fg: "#6e6e73", bg: "#ececee" },
};

/** 每案基礎設施連結：單一服務的 URL ＋ 備註。 */
export type InfraLink = { url: string; note: string };
/** 6 個固定服務的連結集合（admin-only，不外洩至客戶 portal）。 */
export type CaseLinks = {
  repo?: InfraLink;
  vercel?: InfraLink;
  supabase?: InfraLink;
  railway?: InfraLink;
  ga4?: InfraLink;
  search_console?: InfraLink;
};
/** 後台編輯基礎設施連結時的服務清單（key ＋ 顯示名；UI 依此列出全部 6 服務）。 */
export const INFRA_SERVICES: { key: keyof CaseLinks; label: string }[] = [
  { key: "repo", label: "GitHub Repo" },
  { key: "vercel", label: "Vercel" },
  { key: "supabase", label: "Supabase" },
  { key: "railway", label: "Railway" },
  { key: "ga4", label: "GA4" },
  { key: "search_console", label: "Search Console" },
];

export type ClientCase = {
  id: string;
  title: string;
  client_name: string;
  contact_email: string | null;
  contact_phone: string | null;
  contact_line: string | null;
  source: string;
  status: string;
  budget: number | null;
  currency: string | null;
  notes: string | null;
  session_id: string | null;
  // ── 錢的閉環擴欄（quote → contract → payments 金流鏈）──
  quote_id: string | null;
  contract_id: string | null;
  deposit_paid_at: string | null;
  final_paid_at: string | null;
  closed_at: string | null;
  auto_opened: boolean;
  // 後台專案管理擴充（admin-only，不進客戶 portal）：基礎設施連結
  links: CaseLinks;
  created_at: string;
  updated_at: string;
};

/** 看板卡片：案件 ＋ 內部待辦完成度聚合（taskDone／taskTotal）。 */
export type BoardCase = ClientCase & { taskDone: number; taskTotal: number };

const SELECT_COLS =
  "id, title, client_name, contact_email, contact_phone, contact_line, source, status, budget, currency, notes, session_id, quote_id, contract_id, deposit_paid_at, final_paid_at, closed_at, auto_opened, links, created_at, updated_at";

/**
 * 把任意 jsonb 的 links 正規化成 CaseLinks：只留 6 個已知服務、各自 {url,note} 皆 string、
 * 各 trim 後 slice ≤500；兩者皆空的服務略過（等同缺）。防止任意 jsonb 污染型別。
 */
export function coerceCaseLinks(raw: unknown): CaseLinks {
  const out: CaseLinks = {};
  if (!raw || typeof raw !== "object") return out;
  const obj = raw as Record<string, unknown>;
  for (const { key } of INFRA_SERVICES) {
    const v = obj[key];
    if (!v || typeof v !== "object") continue;
    const link = v as Record<string, unknown>;
    const url = (typeof link.url === "string" ? link.url : "").trim().slice(0, 500);
    const note = (typeof link.note === "string" ? link.note : "").trim().slice(0, 500);
    if (!url && !note) continue; // 兩者皆空 → 略過
    out[key] = { url, note };
  }
  return out;
}

/** 所有案件（後台用，service_role），依 updated_at 新到舊。出錯回 []。 */
export async function getCases(): Promise<ClientCase[]> {
  const supabase = createAdminSupabase();
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from("client_cases")
      .select(SELECT_COLS)
      .order("updated_at", { ascending: false });
    if (error || !data) return [];
    return (data as ClientCase[]).map((c) => ({
      ...c,
      links: coerceCaseLinks((c as { links?: unknown }).links),
    }));
  } catch {
    return [];
  }
}

/** 單一案件；找不到回 null。 */
export async function getCase(id: string): Promise<ClientCase | null> {
  const supabase = createAdminSupabase();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("client_cases")
      .select(SELECT_COLS)
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return null;
    const row = data as ClientCase;
    return { ...row, links: coerceCaseLinks((row as { links?: unknown }).links) };
  } catch {
    return null;
  }
}

/**
 * 看板用：一次抓所有案件（updated_at 新→舊）＋ 一次抓 case_tasks 的 {case_id,done}，
 * JS 端聚合每案 {taskDone,taskTotal}。出錯回 []。
 */
export async function getCasesForBoard(): Promise<BoardCase[]> {
  const supabase = createAdminSupabase();
  if (!supabase) return [];
  try {
    const { data: cases, error } = await supabase
      .from("client_cases")
      .select(SELECT_COLS)
      .order("updated_at", { ascending: false });
    if (error || !cases) return [];

    const { data: tasks } = await supabase.from("case_tasks").select("case_id, done");
    const agg = new Map<string, { done: number; total: number }>();
    for (const t of (tasks ?? []) as { case_id: string; done: boolean }[]) {
      const cur = agg.get(t.case_id) ?? { done: 0, total: 0 };
      cur.total += 1;
      if (t.done) cur.done += 1;
      agg.set(t.case_id, cur);
    }

    return (cases as ClientCase[]).map((c) => {
      const a = agg.get(c.id) ?? { done: 0, total: 0 };
      return {
        ...c,
        links: coerceCaseLinks((c as { links?: unknown }).links),
        taskDone: a.done,
        taskTotal: a.total,
      };
    });
  } catch {
    return [];
  }
}
