import { NextResponse } from "next/server";
import { getCase } from "@/lib/adminCases";
import { githubConfigured } from "@/lib/github";
import { syncAllCasesGithub, syncCaseGithub } from "@/lib/githubSync";
import { STATUS_MESSAGES } from "@/lib/githubProgress";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// 批次同步是序列打 GitHub，給足時間（比照 generate-drafts 的做法）。
export const maxDuration = 60;

// 由 middleware（/api/admin/:path*）保護，這裡不再重覆驗證。
//
// POST { id }        → 同步單一案件
// POST { all: true } → 批次同步所有有 repo 連結的案件（force：忽略過期判斷全部重抓）

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  if (!githubConfigured()) {
    return NextResponse.json(
      { ok: false, error: "no_token", message: STATUS_MESSAGES.no_token },
      { status: 503 }
    );
  }

  // ── 批次 ──
  if (body.all === true) {
    const r = await syncAllCasesGithub({ limit: 50, force: body.force === true });
    return NextResponse.json({ ok: true, ...r });
  }

  // ── 單案 ──
  const id = body.id ? String(body.id) : "";
  if (!id) {
    return NextResponse.json({ ok: false, error: "missing_id" }, { status: 422 });
  }
  const caseRow = await getCase(id);
  if (!caseRow) {
    return NextResponse.json({ ok: false, error: "case_not_found" }, { status: 404 });
  }

  const r = await syncCaseGithub(id);
  if (!r.ok) {
    return NextResponse.json(
      { ok: false, error: "sync_failed", message: STATUS_MESSAGES.error },
      { status: 503 }
    );
  }
  return NextResponse.json({ ok: true, status: r.status, message: STATUS_MESSAGES[r.status] || "" });
}
