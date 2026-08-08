// GitHub 唯讀整合：從案件的 repo 讀出開發進度（勾選清單 ＋ commit 活動）。
// 零新套件，一律用 fetch（比照 lib/pchomepay.ts）。
// env：GITHUB_TOKEN（fine-grained PAT，Contents + Metadata 唯讀，server-only）
//
// ⚠️ 這個模組只能在伺服器端跑。後台頁面一律讀 client_cases.github_progress 這個 snapshot，
//    絕不在 render 期間打 GitHub（會被 Next 的 data cache 汙染，且拖慢每一次開頁）。
//    專案沒裝 server-only 套件（維持零依賴），改用下面這道 runtime guard。

import {
  MAX_COMMITS,
  MAX_GROUPS,
  MAX_ITEMS,
  type GithubCommit,
  type GithubProgress,
  type GithubProgressGroup,
  type GithubProgressItem,
  type GithubProgressStatus,
} from "@/lib/githubProgress";

if (typeof window !== "undefined") {
  throw new Error("[github] lib/github.ts 只能在伺服器端使用（請改讀 client_cases.github_progress）");
}

const API = "https://api.github.com";
// 全專案第一個 fetch timeout：掛住的單一請求會吃掉整個 cron 預算，這裡是刻意引入的例外。
const TIMEOUT_MS = 8000;
/** 檔案超過這個大小不解析（Contents API >1MB 會回空 content）。 */
const MAX_FILE_BYTES = 200_000;

/** GITHUB_TOKEN 是否已設定。 */
export function githubConfigured(): boolean {
  return !!process.env.GITHUB_TOKEN;
}

// ── 低階 fetch ──────────────────────────────────────────────

export type GhResult = { res: Response; text: string } | null;

/**
 * 打 GitHub API。429/5xx 重試一次（無指數退避，比照 lib/gemini.ts）。
 * 連線失敗一律回 null 並 console.error，不 throw。
 * 4xx（404/403 等）視為「有效回應」照原樣回傳，由呼叫端判讀。
 */
async function ghFetch(path: string, etag?: string): Promise<GhResult> {
  const token = process.env.GITHUB_TOKEN;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const headers: Record<string, string> = {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "lqtech-landing",
      };
      if (token) headers.Authorization = `Bearer ${token}`;
      if (etag) headers["If-None-Match"] = etag;

      const res = await fetch(`${API}${path}`, {
        headers,
        cache: "no-store",
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      // 304：內容沒變，呼叫端可重用舊 snapshot（body 為空）
      if (res.status === 304) return { res, text: "" };
      const text = await res.text();
      if ((res.status === 429 || res.status >= 500) && attempt === 0) continue;
      return { res, text };
    } catch (err) {
      if (attempt === 0) continue;
      console.error("[github] API 連線失敗:", path, err);
      return null;
    }
  }
  return null;
}

function parseJson<T>(text: string, path: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    console.error("[github] 回應不是合法 JSON:", path, text.slice(0, 300));
    return null;
  }
}

/** 剩餘配額；讀不到回 null。低於門檻時批次同步應中止。 */
export function rateLimitRemaining(res: Response): number | null {
  const v = res.headers.get("x-ratelimit-remaining");
  if (v === null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

// ── repo URL 解析 ───────────────────────────────────────────

/**
 * 把使用者填在「基礎設施連結」的 repo 欄位解析成 {owner, repo}。
 * 吃 5 種形狀：https://github.com/o/r、…/o/r.git、…/o/r/tree/main、git@github.com:o/r.git、裸 o/r。
 * 非 GitHub 或形狀不對回 null（呼叫端記成 invalid_url，不打 API）。
 *
 * 註：這裡刻意不收緊 coerceCaseLinks —— 那會擋掉既有已存的資料列。
 */
export function parseRepoUrl(raw: string | null | undefined): { owner: string; repo: string } | null {
  if (!raw) return null;
  let s = raw.trim();
  if (!s) return null;

  // git@github.com:owner/repo.git → github.com/owner/repo
  s = s.replace(/^git@github\.com:/i, "https://github.com/");
  // 去掉 query / hash
  s = s.split("#")[0].split("?")[0].trim();

  let pathPart: string;
  if (/^https?:\/\//i.test(s)) {
    let u: URL;
    try {
      u = new URL(s);
    } catch {
      return null;
    }
    if (!/(^|\.)github\.com$/i.test(u.hostname)) return null;
    pathPart = u.pathname;
  } else {
    // 裸 owner/repo（不接受其他 host 的裸路徑）
    if (/^[a-z0-9-]+\.[a-z]{2,}/i.test(s)) return null;
    pathPart = s;
  }

  const seg = pathPart.split("/").filter(Boolean);
  if (seg.length < 2) return null;
  const owner = seg[0];
  const repo = seg[1].replace(/\.git$/i, "");
  if (!owner || !repo) return null;
  // GitHub 允許的字元；擋掉 /tree/、/blob/ 之類被誤當成 repo 的情況
  if (!/^[\w.-]+$/.test(owner) || !/^[\w.-]+$/.test(repo)) return null;
  return { owner, repo };
}

// ── markdown 勾選清單解析 ───────────────────────────────────

const ITEM_RE = /^([ \t]*)([-*+]) \[([ xX])\][ \t]+(.+)$/;
const FENCE_RE = /^[ \t]*(```|~~~)/;
const H2_RE = /^##[ \t]+(.+?)[ \t]*$/;
const META_RE = /^>[ \t]*(\w+)[ \t]*:[ \t]*(.+?)[ \t]*$/;

export type ParsedProgress = {
  items: GithubProgressItem[];
  groups: GithubProgressGroup[];
  done: number;
  total: number;
  stage: string;
  updatedNote: string;
};

/**
 * 解析 markdown 的勾選清單。契約（每條都對應一項驗證）：
 *  - 項目行＝ /^([ \t]*)([-*+]) \[([ xX])\][ \t]+(.+)$/；[x]/[X] 為完成。
 *    括號內其他字元（[~]、[-]）整行忽略、不計入分母。
 *  - 分母只算「該檔最小縮排層級」的項目；巢狀子項解析但不計數（避免細項稀釋百分比）。
 *  - 圍欄程式碼區塊（``` / ~~~）內全部跳過，擋掉文件裡的範例勾選框。
 *    不套用「4 空白＝程式碼」規則，那會跟巢狀清單衝突。
 *  - 分組＝最近一個前置的「## 」標題；第一個 ## 之前歸 group ""。
 *  - metadata 只認 H1 之後的 > stage: / > updated: / > note:。
 */
export function parseProgressMarkdown(md: string): ParsedProgress {
  const lines = md.split(/\r?\n/);

  // 第一遍：收集項目（含縮排寬度），順便抓 metadata 與分組
  type Raw = { indent: number; done: boolean; label: string; group: string };
  const raws: Raw[] = [];
  let group = "";
  let stage = "";
  let updatedNote = "";
  let inFence = false;
  let seenBody = false; // 已經出現過非 metadata 的內容 → 之後的 > 不再當 metadata

  for (const line of lines) {
    if (FENCE_RE.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const h2 = line.match(H2_RE);
    if (h2) {
      group = h2[1].trim().slice(0, 200);
      seenBody = true;
      continue;
    }

    const item = line.match(ITEM_RE);
    if (item) {
      const indent = item[1].replace(/\t/g, "    ").length;
      raws.push({
        indent,
        done: item[3].toLowerCase() === "x",
        label: item[4].trim().slice(0, 200),
        group,
      });
      seenBody = true;
      continue;
    }

    if (!seenBody) {
      const meta = line.match(META_RE);
      if (meta) {
        const key = meta[1].toLowerCase();
        if (key === "stage") stage = meta[2].slice(0, 200);
        else if (key === "updated" || key === "note") updatedNote = meta[2].slice(0, 200);
        continue;
      }
      if (line.trim() && !line.startsWith("#") && !line.startsWith("<!--")) seenBody = true;
    }
  }

  if (raws.length === 0) {
    return { items: [], groups: [], done: 0, total: 0, stage, updatedNote };
  }

  // 第二遍：只有最小縮排層級的項目計入分母
  const minIndent = Math.min(...raws.map((r) => r.indent));
  const items: GithubProgressItem[] = [];
  const groupMap = new Map<string, { done: number; total: number }>();
  let done = 0;
  let total = 0;

  for (const r of raws) {
    if (items.length < MAX_ITEMS) items.push({ label: r.label, done: r.done, group: r.group });
    if (r.indent !== minIndent) continue; // 巢狀子項不計數
    total += 1;
    if (r.done) done += 1;
    const g = groupMap.get(r.group) ?? { done: 0, total: 0 };
    g.total += 1;
    if (r.done) g.done += 1;
    groupMap.set(r.group, g);
  }

  // Array.from（不用展開運算子）：tsconfig target 是 es5，Map iterator 不能直接展開。
  const groups: GithubProgressGroup[] = Array.from(groupMap)
    .filter(([name]) => name !== "") // 無標題分組不畫小條
    .slice(0, MAX_GROUPS)
    .map(([name, v]) => ({ name, done: v.done, total: v.total }));

  return { items, groups, done, total, stage, updatedNote };
}

// ── docs/plans 挑檔 ─────────────────────────────────────────

type ContentEntry = { name: string; path: string; size: number; sha: string; type: string };

/**
 * 從 docs/plans 的檔案清單挑出最可能是「進度檔」的候選（分數高到低，最多 3 個）。
 * 評分：progress +100、checklist +40、implementation +20、plan +10、design −50、gap/spec −50。
 * Tie-break：分數 → 檔名尾端數字大者（P4 > P1）→ 字典序大者（ISO 日期自動取最新）→ size 大者。
 *
 * ⚠️ 分數高不代表解析得出東西：實測 aster 的 apollo-100-parity-checklist.md 檔名分數高但全檔 0 個勾選框。
 *    所以呼叫端一定要「抓下來解析、0 項目就換下一個」。
 */
export function pickPlanFiles(entries: ContentEntry[]): ContentEntry[] {
  const scored = entries
    .filter((e) => e.type === "file" && /\.md$/i.test(e.name) && e.size > 0 && e.size <= MAX_FILE_BYTES)
    .map((e) => {
      const base = e.name.toLowerCase().replace(/\.md$/, "");
      let score = 0;
      if (base.includes("progress")) score += 100;
      if (base.includes("checklist")) score += 40;
      if (base.includes("implementation")) score += 20;
      if (base.includes("plan")) score += 10;
      if (base.includes("design")) score -= 50;
      if (base.includes("gap") || base.includes("spec")) score -= 50;
      const tailNum = Number(base.match(/(\d+)$/)?.[1] ?? -1);
      return { entry: e, score, tailNum, base };
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.tailNum - a.tailNum ||
        b.base.localeCompare(a.base) ||
        b.entry.size - a.entry.size,
    );
  return scored.slice(0, 3).map((s) => s.entry);
}

// ── 主流程 ──────────────────────────────────────────────────

function emptyProgress(status: GithubProgressStatus, owner = "", repo = ""): GithubProgress {
  return {
    v: 1,
    status,
    owner,
    repo,
    branch: "",
    private: false,
    source: "none",
    file: null,
    stage: "",
    updatedNote: "",
    done: 0,
    total: 0,
    pct: 0,
    groups: [],
    items: [],
    commits: [],
    lastCommitAt: null,
    idleDays: null,
    fetchedAt: new Date().toISOString(),
  };
}

/** Contents API 的 base64 內容 → 文字；過大或壞掉回 null。 */
function decodeContent(payload: { content?: string; encoding?: string; size?: number }): string | null {
  if (!payload.content || payload.encoding !== "base64") return null;
  if ((payload.size ?? 0) > MAX_FILE_BYTES) return null;
  try {
    return Buffer.from(payload.content, "base64").toString("utf8");
  } catch {
    return null;
  }
}

async function getFile(
  owner: string,
  repo: string,
  path: string,
  branch: string,
): Promise<{ text: string; sha: string; url: string } | null> {
  const r = await ghFetch(`/repos/${owner}/${repo}/contents/${path}?ref=${encodeURIComponent(branch)}`);
  if (!r || !r.res.ok) return null;
  const payload = parseJson<{ content?: string; encoding?: string; size?: number; sha?: string; html_url?: string }>(
    r.text,
    path,
  );
  if (!payload) return null;
  const text = decodeContent(payload);
  if (text === null) return null;
  return { text, sha: payload.sha ?? "", url: payload.html_url ?? "" };
}

/**
 * 抓指定路徑的單一檔案並解析（跳過 L1/L2 的挑檔邏輯）。
 * 給 /api/cron/github-probe 用：要驗證解析器對「某個已知檔案」的結果是否符合 grep 計數，
 * 必須能指定檔案，否則挑檔器會自己選一個，測不到特定邊界（巢狀、程式碼圍欄）。
 */
export async function fetchFileProgress(
  repoUrl: string,
  path: string,
  opts?: { allowAnonymous?: boolean },
): Promise<(ParsedProgress & { path: string; branch: string }) | null> {
  if (!githubConfigured() && !opts?.allowAnonymous) return null;
  const parsed = parseRepoUrl(repoUrl);
  if (!parsed) return null;
  const metaRes = await ghFetch(`/repos/${parsed.owner}/${parsed.repo}`);
  if (!metaRes || !metaRes.res.ok) return null;
  const meta = parseJson<{ default_branch?: string }>(metaRes.text, "repo");
  const branch = meta?.default_branch || "main";
  const f = await getFile(parsed.owner, parsed.repo, path, branch);
  if (!f) return null;
  return { ...parseProgressMarkdown(f.text), path, branch };
}

/**
 * 抓一個 repo 的開發進度。降級順序：
 *   L1 根目錄 PROGRESS.md → L2 docs/plans 挑檔（最多試 3 個）→ L3 只有 commit 活動。
 * 任何一層失敗都往下降，最後至少會有 commit 活動；完全失敗回對應的 status。
 *
 * opts.allowAnonymous：未設 GITHUB_TOKEN 時仍照打（GitHub 對公開 repo 允許未認證讀取，60 req/hr）。
 * 僅供 /api/cron/github-probe 驗證用——正式同步不開，否則私有 repo 會靜默變成 not_found，
 * 且共用 IP 的 60/hr 配額很容易被打爆。
 */
export async function fetchRepoProgress(
  repoUrl: string | null | undefined,
  opts?: { allowAnonymous?: boolean },
): Promise<GithubProgress> {
  if (!repoUrl || !repoUrl.trim()) return emptyProgress("no_repo");
  if (!githubConfigured() && !opts?.allowAnonymous) return emptyProgress("no_token");

  const parsed = parseRepoUrl(repoUrl);
  if (!parsed) return emptyProgress("invalid_url");
  const { owner, repo } = parsed;

  // ── repo meta（同時偵測 404 / 403 / 空 repo）──
  const metaRes = await ghFetch(`/repos/${owner}/${repo}`);
  if (!metaRes) return emptyProgress("error", owner, repo);
  if (metaRes.res.status === 404) return emptyProgress("not_found", owner, repo);
  if (metaRes.res.status === 401 || metaRes.res.status === 403) return emptyProgress("no_access", owner, repo);
  if (!metaRes.res.ok) {
    console.error("[github] repo meta 失敗:", owner, repo, metaRes.res.status, metaRes.text.slice(0, 300));
    return emptyProgress("error", owner, repo);
  }
  const meta = parseJson<{ default_branch?: string; private?: boolean; size?: number }>(metaRes.text, "repo");
  if (!meta) return emptyProgress("error", owner, repo);

  const branch = meta.default_branch || "main";
  const out = emptyProgress("ok", owner, repo);
  out.branch = branch;
  out.private = meta.private === true;

  // size 0 → 空 repo（實測 wendy：/repos 回 200 size:0、/commits 回 409、/contents 回 404）
  if ((meta.size ?? 0) === 0) {
    return { ...out, status: "empty_repo" };
  }

  // ── L1：根目錄 PROGRESS.md ──
  let picked: { text: string; sha: string; url: string; path: string } | null = null;
  const l1 = await getFile(owner, repo, "PROGRESS.md", branch);
  if (l1 && parseProgressMarkdown(l1.text).total > 0) picked = { ...l1, path: "PROGRESS.md" };
  if (picked) out.source = "progress_md";

  // ── L2：docs/plans（檔名不統一，評分後逐一驗證，0 項目就換下一個）──
  if (!picked) {
    for (const dir of ["docs/plans", "docs"]) {
      const listRes = await ghFetch(`/repos/${owner}/${repo}/contents/${dir}?ref=${encodeURIComponent(branch)}`);
      if (!listRes || !listRes.res.ok) continue;
      const entries = parseJson<ContentEntry[]>(listRes.text, dir);
      if (!Array.isArray(entries)) continue;
      // docs/ 底下檔案雜，只收檔名明確含 progress/checklist 者
      const pool =
        dir === "docs" ? entries.filter((e) => /progress|checklist/i.test(e.name)) : entries;
      for (const cand of pickPlanFiles(pool)) {
        const f = await getFile(owner, repo, cand.path, branch);
        if (f && parseProgressMarkdown(f.text).total > 0) {
          picked = { ...f, path: cand.path };
          break;
        }
      }
      if (picked) break;
    }
    if (picked) out.source = "docs_plan";
  }

  if (picked) {
    const p = parseProgressMarkdown(picked.text);
    out.file = { path: picked.path, sha: picked.sha, url: picked.url };
    out.items = p.items;
    out.groups = p.groups;
    out.done = p.done;
    out.total = p.total;
    out.pct = p.total > 0 ? Math.round((p.done / p.total) * 100) : 0;
    out.stage = p.stage;
    out.updatedNote = p.updatedNote;
  } else {
    out.source = "commits";
  }

  // ── commit 活動（永遠抓，百分比旁要並列 idleDays 才不會誤讀「卡住」）──
  const cRes = await ghFetch(
    `/repos/${owner}/${repo}/commits?sha=${encodeURIComponent(branch)}&per_page=${MAX_COMMITS}`,
  );
  if (cRes && cRes.res.status === 409) {
    return { ...out, status: "empty_repo", source: "none" };
  }
  if (cRes && cRes.res.ok) {
    const raw = parseJson<
      { sha?: string; commit?: { message?: string; author?: { date?: string } }; author?: { login?: string } }[]
    >(cRes.text, "commits");
    if (Array.isArray(raw)) {
      const commits: GithubCommit[] = raw.slice(0, MAX_COMMITS).map((c) => ({
        sha: (c.sha ?? "").slice(0, 7),
        message: (c.commit?.message ?? "").split("\n")[0].slice(0, 200),
        date: c.commit?.author?.date ?? "",
        author: c.author?.login ?? "",
      }));
      out.commits = commits;
      out.lastCommitAt = commits[0]?.date || null;
      if (out.lastCommitAt) {
        const diff = Date.now() - new Date(out.lastCommitAt).getTime();
        out.idleDays = Number.isFinite(diff) ? Math.max(0, Math.floor(diff / 86_400_000)) : null;
      }
    }
  }

  return out;
}
