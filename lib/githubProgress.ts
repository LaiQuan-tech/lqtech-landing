// 每案 GitHub 開發進度的 snapshot 型別與消毒函式。
//
// 這個檔案「不」呼叫 GitHub API（那是 lib/github.ts 的事），也不碰 DB，
// 因此可以同時被 server component 與 "use client" 面板 import 型別。
// 抓取與寫入請走 lib/github.ts / lib/githubSync.ts（兩者皆為 server-only）。

/** snapshot 的取得結果。ok 以外皆代表「沒有可用進度」，UI 依此顯示不同空狀態。 */
export type GithubProgressStatus =
  | "ok" // 成功（可能只有 commit 活動，看 source）
  | "no_repo" // 案件沒填 repo 連結 → 完全不打 API
  | "invalid_url" // repo 連結無法解析成 owner/repo
  | "not_found" // /repos 回 404（不存在、已刪除、或 token 無權限而看不到）
  | "no_access" // 401/403
  | "empty_repo" // repo 存在但沒有任何 commit
  | "no_token" // 未設定 GITHUB_TOKEN → 完全不打 API
  | "error"; // 連線／解析失敗

/** 進度數字的來源，UI 必須顯示它，否則看到百分比不知道從哪來。 */
export type GithubProgressSource =
  | "progress_md" // repo 根目錄的 PROGRESS.md（優先）
  | "docs_plan" // docs/plans/ 裡挑出來的進度檔
  | "commits" // 沒有可解析的進度檔，只有 commit 活動
  | "none";

export type GithubProgressItem = { label: string; done: boolean; group: string };
export type GithubProgressGroup = { name: string; done: number; total: number };
export type GithubCommit = { sha: string; message: string; date: string; author: string };

export type GithubProgress = {
  v: 1;
  status: GithubProgressStatus;
  owner: string;
  repo: string;
  branch: string;
  private: boolean;
  source: GithubProgressSource;
  /** 實際採用的進度檔（source 為 commits/none 時是 null）。 */
  file: { path: string; sha: string; url: string } | null;
  /** 進度檔 metadata：> stage: / > updated:，缺則空字串。 */
  stage: string;
  updatedNote: string;
  done: number;
  total: number;
  /** total=0 時為 0。 */
  pct: number;
  groups: GithubProgressGroup[];
  items: GithubProgressItem[];
  commits: GithubCommit[];
  lastCommitAt: string | null;
  /** 距最後一次 commit 幾天；無 commit 時為 null。 */
  idleDays: number | null;
  fetchedAt: string;
};

// snapshot 存進 client_cases.github_progress（jsonb），列表頁每列都會 select，
// 因此所有陣列與字串都有硬上限，避免單列膨脹拖慢後台。
export const MAX_ITEMS = 300;
export const MAX_GROUPS = 20;
export const MAX_COMMITS = 10;
const MAX_LABEL = 200;

const STATUSES: GithubProgressStatus[] = [
  "ok",
  "no_repo",
  "invalid_url",
  "not_found",
  "no_access",
  "empty_repo",
  "no_token",
  "error",
];
const SOURCES: GithubProgressSource[] = ["progress_md", "docs_plan", "commits", "none"];

function str(v: unknown, max: number): string {
  return (typeof v === "string" ? v : "").trim().slice(0, max);
}

function nonNegInt(v: unknown): number {
  const n = Math.floor(Number(v));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * 把 DB 讀回來的任意 jsonb 正規化成 GithubProgress；形狀不對回 null（UI 當作「尚未同步」）。
 * 比照 coerceCaseLinks（lib/adminCases.ts）：只留已知欄位、字串 trim+slice、陣列截斷、絕不 throw。
 */
export function coerceGithubProgress(raw: unknown): GithubProgress | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (Number(o.v) !== 1) return null; // 版本不符 → 當作沒有，下次同步會覆寫

  const status = STATUSES.includes(o.status as GithubProgressStatus)
    ? (o.status as GithubProgressStatus)
    : "error";
  const source = SOURCES.includes(o.source as GithubProgressSource)
    ? (o.source as GithubProgressSource)
    : "none";

  const items: GithubProgressItem[] = Array.isArray(o.items)
    ? o.items.slice(0, MAX_ITEMS).map((it) => {
        const i = (it ?? {}) as Record<string, unknown>;
        return { label: str(i.label, MAX_LABEL), done: i.done === true, group: str(i.group, MAX_LABEL) };
      })
    : [];

  const groups: GithubProgressGroup[] = Array.isArray(o.groups)
    ? o.groups.slice(0, MAX_GROUPS).map((g) => {
        const x = (g ?? {}) as Record<string, unknown>;
        return { name: str(x.name, MAX_LABEL), done: nonNegInt(x.done), total: nonNegInt(x.total) };
      })
    : [];

  const commits: GithubCommit[] = Array.isArray(o.commits)
    ? o.commits.slice(0, MAX_COMMITS).map((c) => {
        const x = (c ?? {}) as Record<string, unknown>;
        return {
          sha: str(x.sha, 64),
          message: str(x.message, MAX_LABEL),
          date: str(x.date, 40),
          author: str(x.author, 100),
        };
      })
    : [];

  const total = nonNegInt(o.total);
  const done = Math.min(nonNegInt(o.done), total);
  const pct = total > 0 ? Math.min(100, Math.max(0, nonNegInt(o.pct))) : 0;
  const idle = Math.floor(Number(o.idleDays));

  return {
    v: 1,
    status,
    owner: str(o.owner, 100),
    repo: str(o.repo, 100),
    branch: str(o.branch, 100),
    private: o.private === true,
    source,
    file:
      o.file && typeof o.file === "object"
        ? {
            path: str((o.file as Record<string, unknown>).path, 300),
            sha: str((o.file as Record<string, unknown>).sha, 64),
            url: str((o.file as Record<string, unknown>).url, 500),
          }
        : null,
    stage: str(o.stage, MAX_LABEL),
    updatedNote: str(o.updatedNote, MAX_LABEL),
    done,
    total,
    pct,
    groups,
    items,
    commits,
    lastCommitAt: typeof o.lastCommitAt === "string" ? str(o.lastCommitAt, 40) || null : null,
    idleDays: Number.isFinite(idle) && idle >= 0 ? idle : null,
    fetchedAt: str(o.fetchedAt, 40),
  };
}

/** 進度來源的中文說明，卡片上必須顯示（否則看到數字不知道從哪來）。 */
export function progressSourceLabel(p: GithubProgress): string {
  if (p.source === "progress_md") return "PROGRESS.md";
  if (p.source === "docs_plan") return p.file?.path ?? "docs/plans";
  if (p.source === "commits") return "僅 commit 活動";
  return "無";
}

/** status 對應的繁中說明（UI 空狀態用）。 */
export const STATUS_MESSAGES: Record<GithubProgressStatus, string> = {
  ok: "",
  no_repo: "本案尚未填 GitHub Repo 連結，到上方「基礎設施連結」填入即可。",
  invalid_url: "Repo 連結格式無法辨識，請填成 https://github.com/擁有者/專案名。",
  not_found: "找不到這個 repo —— 可能已刪除、更名，或 token 沒有它的權限（跨 org 的 repo 讀不到）。",
  no_access: "沒有權限讀取這個 repo，請確認 GITHUB_TOKEN 的授權範圍。",
  empty_repo: "這個 repo 還沒有任何 commit。",
  no_token: "尚未設定 GITHUB_TOKEN，無法讀取 GitHub 進度。",
  error: "讀取 GitHub 時發生問題，稍後會自動重試。",
};
