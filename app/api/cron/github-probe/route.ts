import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { fetchFileProgress, fetchRepoProgress, parseRepoUrl } from "@/lib/github";

// GitHub 進度解析的唯讀驗證端點（不寫 DB、不註冊進 vercel.json，因此不佔 cron 名額）。
//
// 存在理由：後台受密碼保護，驗證者無法登入，這是唯一能客觀驗證解析結果的載具。
// 放在 /api/cron/ 之下是為了沿用 CRON_SECRET 的 fail-closed 授權（middleware 不涵蓋此路徑）。
//
// 用法：GET /api/cron/github-probe?repo=owner/name
//       Authorization: Bearer <CRON_SECRET>
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // ── 授權：必須帶 Bearer <CRON_SECRET>。未設 secret 或不符 → 401（fail-closed）。
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const repo = req.nextUrl.searchParams.get("repo");
  if (!repo) {
    return NextResponse.json({ ok: false, error: "missing_repo" }, { status: 400 });
  }
  // 先驗形狀，讓「URL 格式錯」與「repo 不存在」在回應上分得開
  const parsed = parseRepoUrl(repo);
  // anon=1：未設 GITHUB_TOKEN 也照打（僅公開 repo 可用）。讓解析器能在沒有 token 的環境被客觀驗證。
  const allowAnonymous = req.nextUrl.searchParams.get("anon") === "1";
  // path=：指定檔案直接解析，跳過挑檔邏輯（驗證解析器對已知檔案的結果是否符合 grep 計數）
  const path = req.nextUrl.searchParams.get("path");

  try {
    if (path) {
      const r = await fetchFileProgress(repo, path, { allowAnonymous });
      if (!r) return NextResponse.json({ ok: false, error: "file_not_readable" }, { status: 404 });
      const { items, ...rest } = r;
      return NextResponse.json({ ok: true, mode: "file", itemCount: items.length, itemsPreview: items.slice(0, 5), ...rest });
    }

    const progress = await fetchRepoProgress(repo, { allowAnonymous });
    // items 可能到 300 筆，probe 回應只給計數與前 5 筆，避免輸出難讀
    const { items, ...rest } = progress;
    return NextResponse.json({
      ok: true,
      parsedRepo: parsed,
      itemCount: items.length,
      itemsPreview: items.slice(0, 5),
      ...rest,
    });
  } catch (err) {
    console.error("[github-probe] 失敗:", err);
    return NextResponse.json({ ok: false, error: "probe_failed" }, { status: 500 });
  }
}
