"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { caseTasksProgress, type CaseTask } from "@/lib/caseTasks";

const BRAND_BLUE = "#1668c2";

type Props = {
  caseId: string;
  tasks: CaseTask[];
};

const fieldStyle: React.CSSProperties = {
  border: "1px solid rgba(0,0,0,.14)",
  borderRadius: 12,
  padding: "8px 11px",
  fontSize: 14,
  outline: "none",
  background: "#fff",
  color: "#1d1d1f",
};
const outlineBtn: React.CSSProperties = {
  border: `1px solid ${BRAND_BLUE}`,
  background: "#fff",
  color: BRAND_BLUE,
  borderRadius: 980,
  padding: "6px 14px",
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
  whiteSpace: "nowrap",
};
const dangerBtn: React.CSSProperties = {
  border: "1px solid #f0c4c0",
  background: "#fff",
  color: "#c0392b",
  borderRadius: 980,
  padding: "6px 14px",
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

/** 後台內部待辦（case_tasks）：進度條＋勾選（樂觀）＋改標題＋刪除＋新增。admin-only，不進客戶 portal。 */
export default function TaskChecklistPanel({ caseId, tasks }: Props) {
  const router = useRouter();
  const [list, setList] = useState<CaseTask[]>(tasks);
  const [busy, setBusy] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  // 伺服器 router.refresh() 後把最新 tasks 同步進本地 state（force-dynamic 每次都是新陣列）。
  useEffect(() => {
    setList(tasks);
  }, [tasks]);

  const prog = caseTasksProgress(list);

  async function call(fn: () => Promise<void>) {
    if (busy) return;
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      await fn();
      router.refresh();
    } catch {
      setError("連線出了點問題，請稍後再試");
    } finally {
      setBusy(false);
    }
  }

  // 勾選／取消：樂觀更新本地 state，失敗還原（比照 StatusSelect）。
  async function toggle(t: CaseTask) {
    if (togglingId) return;
    const next = !t.done;
    const prev = list;
    setError(null);
    setNotice(null);
    setTogglingId(t.id);
    setList((cur) =>
      cur.map((x) =>
        x.id === t.id ? { ...x, done: next, done_at: next ? new Date().toISOString() : null } : x
      )
    );
    try {
      const res = await fetch("/api/admin/case-tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: t.id, done: next }),
      });
      if (!res.ok) throw new Error("patch failed");
      router.refresh();
    } catch {
      setList(prev); // 還原
      setError("更新失敗，請重試");
    } finally {
      setTogglingId(null);
    }
  }

  async function addTask() {
    const title = newTitle.trim();
    if (!title) {
      setError("請先填待辦標題");
      return;
    }
    await call(async () => {
      const res = await fetch("/api/admin/case-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ case_id: caseId, title }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.ok === false) {
        setError(data?.message || data?.error || "新增失敗，請稍後再試");
        return;
      }
      setNewTitle("");
      setNotice("已新增待辦 ✅");
    });
  }

  function startEdit(t: CaseTask) {
    setEditingId(t.id);
    setEditTitle(t.title);
  }

  async function saveTitle(t: CaseTask) {
    const v = editTitle.trim();
    if (!v) {
      setError("標題不可為空");
      return;
    }
    if (v === t.title) {
      setEditingId(null);
      return;
    }
    await call(async () => {
      const res = await fetch("/api/admin/case-tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: t.id, title: v }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.ok === false) {
        setError(data?.message || data?.error || "更新失敗，請稍後再試");
        return;
      }
      setNotice("已更新待辦標題 ✅");
    });
    setEditingId(null);
  }

  async function removeTask(t: CaseTask) {
    if (!confirm(`確定刪除待辦「${t.title}」？`)) return;
    await call(async () => {
      const res = await fetch("/api/admin/case-tasks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: t.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.ok === false) {
        setError(data?.message || data?.error || "刪除失敗，請稍後再試");
        return;
      }
      setNotice("已刪除待辦");
    });
  }

  return (
    <div className="gt-admin-card">
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: "#1d1d1f", margin: 0 }}>內部待辦</h2>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "#6e6e73",
            background: "#ececee",
            borderRadius: 6,
            padding: "2px 7px",
            letterSpacing: ".03em",
          }}
        >
          僅後台可見
        </span>
      </div>
      <p style={{ margin: "0 0 14px", fontSize: 12.5, color: "#86868b" }}>
        團隊自己追蹤的施工待辦，不會顯示在客戶進度頁（與客戶「里程碑」分開）。
      </p>

      {list.length === 0 ? (
        <p style={{ fontSize: 13.5, color: "#86868b", margin: "0 0 14px" }}>
          尚無待辦，新增一項開始追蹤進度。
        </p>
      ) : (
        <>
          {/* 進度條 */}
          <div style={{ marginBottom: 14 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: 6,
              }}
            >
              <span style={{ fontSize: 12.5, color: "#86868b" }}>
                {prog.done}／{prog.total} 完成
              </span>
              <span style={{ fontSize: 12.5, color: BRAND_BLUE, fontWeight: 600 }}>{prog.pct}%</span>
            </div>
            <div style={{ height: 6, borderRadius: 980, background: "#eceef1", overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  width: `${prog.pct}%`,
                  background: BRAND_BLUE,
                  borderRadius: 980,
                  transition: "width .25s ease",
                }}
              />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
            {list.map((t) => (
              <div
                key={t.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  flexWrap: "wrap",
                  border: "1px solid rgba(0,0,0,.08)",
                  borderRadius: 12,
                  padding: "10px 12px",
                }}
              >
                <input
                  type="checkbox"
                  checked={t.done}
                  disabled={togglingId === t.id}
                  onChange={() => toggle(t)}
                  aria-label={t.done ? "標記為未完成" : "標記為完成"}
                  style={{ width: 17, height: 17, accentColor: BRAND_BLUE, cursor: "pointer", flexShrink: 0 }}
                />
                {editingId === t.id ? (
                  <>
                    <input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      style={{ ...fieldStyle, flex: 1, minWidth: 160 }}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => saveTitle(t)}
                      disabled={busy}
                      style={{ ...outlineBtn, opacity: busy ? 0.6 : 1 }}
                    >
                      儲存
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      style={{ ...outlineBtn, border: "1px solid rgba(0,0,0,.14)", color: "#6e6e73" }}
                    >
                      取消
                    </button>
                  </>
                ) : (
                  <>
                    <span
                      onClick={() => startEdit(t)}
                      title="點擊編輯標題"
                      style={{
                        flex: 1,
                        minWidth: 160,
                        fontSize: 14.5,
                        cursor: "text",
                        color: t.done ? "#a1a1a6" : "#1d1d1f",
                        textDecoration: t.done ? "line-through" : "none",
                      }}
                    >
                      {t.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeTask(t)}
                      disabled={busy}
                      style={{ ...dangerBtn, opacity: busy ? 0.6 : 1 }}
                    >
                      刪除
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* 新增待辦 */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTask();
            }
          }}
          placeholder="新待辦（例：設定 DNS、接 GA4）"
          style={{ ...fieldStyle, flex: 1, minWidth: 200 }}
        />
        <button type="button" onClick={addTask} disabled={busy} style={{ ...outlineBtn, opacity: busy ? 0.6 : 1 }}>
          ＋ 新增待辦
        </button>
      </div>

      {error && (
        <div
          style={{
            marginTop: 12,
            fontSize: 13.5,
            color: "#b3261e",
            background: "#fdecea",
            border: "1px solid #f6c9c4",
            borderRadius: 12,
            padding: "10px 13px",
          }}
        >
          {error}
        </div>
      )}
      {notice && !error && (
        <div
          style={{
            marginTop: 12,
            fontSize: 13.5,
            color: "#1f7a44",
            background: "#dcf3e5",
            border: "1px solid #bfe6cd",
            borderRadius: 12,
            padding: "10px 13px",
          }}
        >
          {notice}
        </div>
      )}
    </div>
  );
}
