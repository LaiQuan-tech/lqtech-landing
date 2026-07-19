import { createAdminSupabase } from "@/lib/supabase";

// 後台內部待辦（case_tasks）：admin-only，不進客戶 /portal（與客戶里程碑 milestones 分離）。
// 全部走 service_role（RLS 鎖死，無 public policy）。比照 lib/portal.ts 里程碑 CRUD 慣例。

export type CaseTask = {
  id: string;
  case_id: string;
  title: string;
  done: boolean;
  sort_order: number;
  done_at: string | null;
  created_at: string;
  updated_at: string;
};

const TASK_SELECT = "id, case_id, title, done, sort_order, done_at, created_at, updated_at";

/** 待辦標題長度上限（trim 後 slice）。 */
const TASK_TITLE_MAX = 200;

/** 案件的內部待辦（sort_order → created_at 排序）。出錯回 []。 */
export async function listCaseTasks(caseId: string): Promise<CaseTask[]> {
  const supabase = createAdminSupabase();
  if (!supabase || !caseId) return [];
  try {
    const { data, error } = await supabase
      .from("case_tasks")
      .select(TASK_SELECT)
      .eq("case_id", caseId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error || !data) return [];
    return data as CaseTask[];
  } catch {
    return [];
  }
}

/** 新增待辦。title trim 後為空或 case_id 缺 → null；sort_order 給現有最大 +1（無則 0）。 */
export async function createCaseTask(caseId: string, title: string): Promise<CaseTask | null> {
  const supabase = createAdminSupabase();
  if (!supabase || !caseId) return null;
  const t = String(title ?? "").trim().slice(0, TASK_TITLE_MAX);
  if (!t) return null;
  try {
    const { data: last } = await supabase
      .from("case_tasks")
      .select("sort_order")
      .eq("case_id", caseId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextSort = last ? (Number((last as { sort_order: number }).sort_order) || 0) + 1 : 0;

    const { data, error } = await supabase
      .from("case_tasks")
      .insert({ case_id: caseId, title: t, sort_order: nextSort })
      .select(TASK_SELECT)
      .single();
    if (error || !data) {
      if (error) console.error("[caseTasks] createCaseTask failed:", error.message);
      return null;
    }
    return data as CaseTask;
  } catch (err) {
    console.error("[caseTasks] createCaseTask failed:", err);
    return null;
  }
}

/**
 * 更新待辦。done→true：補 done_at=now（冪等，已有不覆寫）；done→false：清 done_at。
 * title trim 後 slice ≤200（不允許清空）；一律更新 updated_at。查無回 null。
 */
export async function updateCaseTask(
  id: string,
  patch: { done?: boolean; title?: string; sort_order?: number }
): Promise<CaseTask | null> {
  const supabase = createAdminSupabase();
  if (!supabase || !id) return null;
  try {
    const { data: before } = await supabase
      .from("case_tasks")
      .select(TASK_SELECT)
      .eq("id", id)
      .maybeSingle();
    if (!before) return null;
    const prev = before as CaseTask;

    const now = new Date().toISOString();
    const upd: Record<string, unknown> = { updated_at: now };
    if (patch.title !== undefined) {
      const t = String(patch.title ?? "").trim().slice(0, TASK_TITLE_MAX);
      if (!t) return null; // 不允許清空標題
      upd.title = t;
    }
    if (patch.sort_order !== undefined) upd.sort_order = Number(patch.sort_order) || 0;
    if (patch.done !== undefined) {
      const done = !!patch.done;
      upd.done = done;
      upd.done_at = done ? (prev.done_at ?? now) : null; // 冪等：已完成不覆寫既有 done_at
    }

    const { data, error } = await supabase
      .from("case_tasks")
      .update(upd)
      .eq("id", id)
      .select(TASK_SELECT)
      .maybeSingle();
    if (error || !data) {
      if (error) console.error("[caseTasks] updateCaseTask failed:", error.message);
      return null;
    }
    return data as CaseTask;
  } catch (err) {
    console.error("[caseTasks] updateCaseTask failed:", err);
    return null;
  }
}

/** 刪除待辦。成功回 true。 */
export async function deleteCaseTask(id: string): Promise<boolean> {
  const supabase = createAdminSupabase();
  if (!supabase || !id) return false;
  try {
    const { error } = await supabase.from("case_tasks").delete().eq("id", id);
    return !error;
  } catch {
    return false;
  }
}

/** 待辦進度（done／total／百分比；空清單 pct=0）。 */
export function caseTasksProgress(list: CaseTask[]): { done: number; total: number; pct: number } {
  const total = list?.length ?? 0;
  const done = (list ?? []).filter((t) => t.done).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return { done, total, pct };
}
