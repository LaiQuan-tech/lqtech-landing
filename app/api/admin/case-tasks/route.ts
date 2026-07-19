import { NextResponse } from "next/server";
import { createCaseTask, updateCaseTask, deleteCaseTask } from "@/lib/caseTasks";
import { getCase } from "@/lib/adminCases";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 由 middleware（/api/admin/:path*）保護，這裡不再重覆驗證。

// ── 新增待辦 ──
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const caseId = body.case_id ? String(body.case_id) : null;
  const title = String(body.title ?? "").trim();
  if (!caseId || !title) {
    return NextResponse.json(
      { ok: false, error: "missing_fields", message: "請填案件與待辦標題。" },
      { status: 422 }
    );
  }

  // case_tasks 無 FK 至 client_cases → 先確認案件存在，避免產生孤兒待辦。
  const caseRow = await getCase(caseId);
  if (!caseRow) {
    return NextResponse.json({ ok: false, error: "case_not_found" }, { status: 404 });
  }

  const task = await createCaseTask(caseId, title);
  if (!task) {
    return NextResponse.json({ ok: false, error: "create_failed" }, { status: 503 });
  }
  return NextResponse.json({ ok: true, task }, { status: 201 });
}

// ── 更新待辦（勾選完成／改標題／排序）──
export async function PATCH(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const id = body.id ? String(body.id) : null;
  if (!id) return NextResponse.json({ ok: false, error: "missing_id" }, { status: 422 });

  const patch: Parameters<typeof updateCaseTask>[1] = {};
  if (body.done !== undefined) patch.done = !!body.done;
  if (body.title !== undefined) {
    const t = String(body.title ?? "").trim();
    if (!t) {
      return NextResponse.json(
        { ok: false, error: "empty_title", message: "待辦標題不可為空。" },
        { status: 422 }
      );
    }
    patch.title = t;
  }
  if (body.sort_order !== undefined) patch.sort_order = Number(body.sort_order) || 0;
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ ok: false, error: "empty_patch" }, { status: 422 });
  }

  const task = await updateCaseTask(id, patch);
  if (!task) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  return NextResponse.json({ ok: true, task });
}

// ── 刪除待辦 ──
export async function DELETE(req: Request) {
  let id: string | null = null;
  try {
    const body = await req.json();
    id = body?.id ? String(body.id) : null;
  } catch {
    // 沒有 body → 改讀 query param
  }
  if (!id) id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false, error: "missing_id" }, { status: 422 });

  const ok = await deleteCaseTask(id);
  if (!ok) return NextResponse.json({ ok: false, error: "delete_failed" }, { status: 503 });
  return NextResponse.json({ ok: true });
}
