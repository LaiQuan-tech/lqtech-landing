import { createAdminSupabase } from "@/lib/supabase";
import { coerceGithubProgress, type GithubProgress } from "@/lib/githubProgress";

/** 案件狀態（app 端 allowlist；DB 存 text）。 */
export const CASE_STATUSES = ["洽談中", "報價中", "進行中", "已完成", "已結案", "擱置"] as const;
export type CaseStatus = (typeof CASE_STATUSES)[number];

/** 案件來源。API 的白名單（route.ts 的 SOURCE_SET）由此衍生，加來源改這裡即可。 */
export const CASE_SOURCES = ["line", "ai_chat", "referral", "offline", "manual"] as const;
export type CaseSource = (typeof CASE_SOURCES)[number];

export const SOURCE_LABELS: Record<string, string> = {
  line: "LINE",
  ai_chat: "AI 客服",
  referral: "轉介紹",
  offline: "線下接洽",
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
  // GitHub 開發進度快照（由 cron／手動同步寫入；後台只讀，render 期間不打 GitHub）
  github_progress: GithubProgress | null;
  github_synced_at: string | null;
  github_sync_error: string | null;
  created_at: string;
  updated_at: string;
};

/** 看板卡片：案件 ＋ 內部待辦完成度聚合（taskDone／taskTotal）。 */
export type BoardCase = ClientCase & { taskDone: number; taskTotal: number };

const BASE_COLS =
  "id, title, client_name, contact_email, contact_phone, contact_line, source, status, budget, currency, notes, session_id, quote_id, contract_id, deposit_paid_at, final_paid_at, closed_at, auto_opened, links, created_at, updated_at";
const GITHUB_COLS = "github_progress, github_synced_at, github_sync_error";
const SELECT_COLS = `${BASE_COLS}, ${GITHUB_COLS}`;

/**
 * GitHub 欄位是否已存在於 DB。
 *
 * 這三欄由 supabase/schema.sql 的 alter table 加上，但程式部署與 migration 不保證同時發生
 * （本專案沒有 staging，DDL 由人在 Supabase 主控台執行）。若欄位還沒建，帶著它們的 select
 * 會整個查詢失敗 → 後台案件頁會變成空的。因此第一次遇到「欄位不存在」就記住並降級，
 * 之後只查 BASE_COLS，github_* 一律回 null（UI 顯示「尚未同步」）。
 * 一旦 migration 跑完、下一次冷啟動就會恢復完整查詢。
 */
let githubColsMissing = false;

/** PostgREST 的 undefined_column 是 42703。 */
function isMissingColumn(err: { code?: string; message?: string } | null): boolean {
  if (!err) return false;
  return err.code === "42703" || /column .* does not exist/i.test(err.message ?? "");
}

function selectCols(): string {
  return githubColsMissing ? BASE_COLS : SELECT_COLS;
}

/**
 * DB 讀回的原始列 → ClientCase：jsonb 欄位一律過 coerce，防止任意形狀污染型別。
 * 降級查詢（github_* 欄位還沒建）時這三欄會是 undefined，一律補成 null 讓型別成立。
 */
function normalizeCase(row: ClientCase): ClientCase {
  const raw = row as unknown as Record<string, unknown>;
  return {
    ...row,
    links: coerceCaseLinks(raw.links),
    github_progress: coerceGithubProgress(raw.github_progress),
    github_synced_at: typeof raw.github_synced_at === "string" ? raw.github_synced_at : null,
    github_sync_error: typeof raw.github_sync_error === "string" ? raw.github_sync_error : null,
  };
}

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
    const run = (cols: string) =>
      supabase.from("client_cases").select(cols).order("updated_at", { ascending: false });
    let { data, error } = await run(selectCols());
    if (isMissingColumn(error)) {
      githubColsMissing = true;
      console.warn("[adminCases] github_* 欄位尚未建立，降級查詢（請執行 supabase/schema.sql 的 alter table）");
      ({ data, error } = await run(BASE_COLS));
    }
    if (error || !data) return [];
    return (data as unknown as ClientCase[]).map(normalizeCase);
  } catch {
    return [];
  }
}

/** 單一案件；找不到回 null。 */
export async function getCase(id: string): Promise<ClientCase | null> {
  const supabase = createAdminSupabase();
  if (!supabase) return null;
  try {
    const run = (cols: string) => supabase.from("client_cases").select(cols).eq("id", id).maybeSingle();
    let { data, error } = await run(selectCols());
    if (isMissingColumn(error)) {
      githubColsMissing = true;
      ({ data, error } = await run(BASE_COLS));
    }
    if (error || !data) return null;
    return normalizeCase(data as unknown as ClientCase);
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
    const run = (cols: string) =>
      supabase.from("client_cases").select(cols).order("updated_at", { ascending: false });
    let { data: cases, error } = await run(selectCols());
    if (isMissingColumn(error)) {
      githubColsMissing = true;
      ({ data: cases, error } = await run(BASE_COLS));
    }
    if (error || !cases) return [];

    const { data: tasks } = await supabase.from("case_tasks").select("case_id, done");
    const agg = new Map<string, { done: number; total: number }>();
    for (const t of (tasks ?? []) as { case_id: string; done: boolean }[]) {
      const cur = agg.get(t.case_id) ?? { done: 0, total: 0 };
      cur.total += 1;
      if (t.done) cur.done += 1;
      agg.set(t.case_id, cur);
    }

    return (cases as unknown as ClientCase[]).map((c) => {
      const a = agg.get(c.id) ?? { done: 0, total: 0 };
      return { ...normalizeCase(c), taskDone: a.done, taskTotal: a.total };
    });
  } catch {
    return [];
  }
}
