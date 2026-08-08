import { createAdminSupabase } from "@/lib/supabase";
import { coerceCaseLinks } from "@/lib/adminCases";
import { fetchRepoProgress, githubConfigured, rateLimitRemaining } from "@/lib/github";
import { STATUS_MESSAGES, type GithubProgress } from "@/lib/githubProgress";

// 把每案 repo 的開發進度抓下來寫進 client_cases.github_progress。
// 後台頁一律只讀這個 snapshot，render 期間不打 GitHub。
//
// ⚠️ 伺服器端限定（會用到 service_role 與 GITHUB_TOKEN）。
if (typeof window !== "undefined") {
  throw new Error("[githubSync] lib/githubSync.ts 只能在伺服器端使用");
}

/** 抵達這些狀態才算「這一輪處理完了」，可以寫時間戳；其餘（error）留待下次重試。 */
const TERMINAL: GithubProgress["status"][] = ["ok", "not_found", "no_access", "empty_repo", "invalid_url", "no_repo"];

/** 批次同步時，剩餘配額低於此值就中止本輪（留餘裕給其他用途）。 */
const RATE_FLOOR = 100;
/** 批次同步的時間上限，避免吃掉整個 function 預算；沒跑完的下一輪會接上。 */
const BATCH_BUDGET_MS = 25_000;

type SyncOutcome = { ok: boolean; status: GithubProgress["status"]; wrote: boolean };

/**
 * 同步單一案件。
 * 只有抵達終局狀態才寫 github_synced_at（比照 cron 的「只有真的成功才寫時間戳」）；
 * 暫時性失敗保留舊 snapshot 與舊時間戳，只更新 github_sync_error，下一輪會重試。
 */
export async function syncCaseGithub(caseId: string): Promise<SyncOutcome> {
  const supabase = createAdminSupabase();
  if (!supabase) return { ok: false, status: "error", wrote: false };

  const { data, error } = await supabase.from("client_cases").select("id, links").eq("id", caseId).maybeSingle();
  if (error || !data) return { ok: false, status: "error", wrote: false };

  const links = coerceCaseLinks((data as { links?: unknown }).links);
  const repoUrl = links.repo?.url ?? "";

  const progress = await fetchRepoProgress(repoUrl);
  const terminal = TERMINAL.includes(progress.status);
  const now = new Date().toISOString();

  // 暫時性失敗（error / rate_limited / no_token）：不覆寫既有 snapshot，只記錯誤，
  // 保留舊時間戳讓 UI 顯示「資料已過期」，下一輪 cron 會重試。
  const patch: Record<string, unknown> = terminal
    ? {
        github_progress: progress,
        github_synced_at: now,
        github_sync_error: null,
      }
    : { github_sync_error: STATUS_MESSAGES[progress.status] || "讀取 GitHub 失敗，稍後會自動重試" };

  // 刻意不動 updated_at：同步是背景動作，不該讓案件跳到列表最上面。
  const { error: upErr } = await supabase.from("client_cases").update(patch).eq("id", caseId);
  if (upErr) {
    console.error("[githubSync] 寫入失敗:", caseId, upErr.message.slice(0, 300));
    return { ok: false, status: progress.status, wrote: false };
  }
  return { ok: terminal, status: progress.status, wrote: terminal };
}

/**
 * 批次同步：挑「有填 repo 連結」且「從未同步或已過期」的案件。
 * 序列執行（不用 Promise.all）避免觸發 GitHub 的 secondary rate limit。
 */
export async function syncAllCasesGithub(opts?: {
  limit?: number;
  cutoffHours?: number;
  /** true = 忽略 cutoff，全部重抓（後台「全部同步」按鈕用）。 */
  force?: boolean;
}): Promise<{ synced: number; skipped: number; failed: number; stopped: string | null }> {
  const out = { synced: 0, skipped: 0, failed: 0, stopped: null as string | null };
  const supabase = createAdminSupabase();
  if (!supabase) return { ...out, stopped: "supabase_not_configured" };
  if (!githubConfigured()) return { ...out, stopped: "no_token" };

  const limit = opts?.limit ?? 25;
  const rawHours = Number(process.env.GITHUB_SYNC_HOURS);
  const cutoffHours = opts?.cutoffHours ?? (Number.isFinite(rawHours) && rawHours >= 0 ? rawHours : 20);
  const cutoff = new Date(Date.now() - cutoffHours * 3600_000).toISOString();

  // repo 連結存在（jsonb 路徑查詢）；未同步過或已過期。
  let query = supabase.from("client_cases").select("id").not("links->repo->>url", "is", null).limit(limit);
  if (!opts?.force) query = query.or(`github_synced_at.is.null,github_synced_at.lt.${cutoff}`);

  const { data: rows, error } = await query;
  if (error || !rows) return { ...out, stopped: "query_failed" };
  if (rows.length === 0) return out;

  // 配額不足就整輪不跑，免得抓到一半每個案子都寫入殘缺 snapshot。
  const quota = await githubQuotaRemaining();
  if (quota !== null && quota < RATE_FLOOR) {
    console.error("[githubSync] GitHub 配額不足，本輪中止:", quota);
    return { ...out, stopped: "rate_limited" };
  }

  const startedAt = Date.now();
  for (const row of rows as Array<{ id: string }>) {
    if (Date.now() - startedAt > BATCH_BUDGET_MS) {
      out.stopped = "time_budget"; // 沒跑完的下一輪會接上（cutoff 天然接續）
      break;
    }
    const r = await syncCaseGithub(row.id);
    if (r.wrote) out.synced += 1;
    else if (r.ok) out.skipped += 1;
    else out.failed += 1;
  }
  return out;
}

/**
 * 剩餘 API 配額。讀不到回 null（視為可繼續——寧可跑也不要因為讀不到配額就停擺）。
 * /rate_limit 本身不計入配額。
 */
export async function githubQuotaRemaining(): Promise<number | null> {
  try {
    const res = await fetch("https://api.github.com/rate_limit", {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "lqtech-landing",
        ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
      },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    return rateLimitRemaining(res);
  } catch {
    return null;
  }
}
