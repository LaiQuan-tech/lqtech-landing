"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  STATUS_MESSAGES,
  progressSourceLabel,
  type GithubProgress,
} from "@/lib/githubProgress";

const BRAND_BLUE = "#1668c2";
// GitHub 進度用綠色，與「內部待辦」的藍色進度條區隔——兩個數字並存，顏色是唯一的快速區分。
const GH_GREEN = "#1f7a44";
const AMBER = "#b45309";

type Props = {
  caseId: string;
  repoUrl: string;
  progress: GithubProgress | null;
  syncedAt: string | null;
  syncError: string | null;
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
const chipStyle: React.CSSProperties = {
  fontSize: 11.5,
  fontWeight: 600,
  borderRadius: 6,
  padding: "2px 7px",
  whiteSpace: "nowrap",
};

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

/** 同步時間的人話說明。>24h 視為過期（cron 每天跑一次，正常不該超過）。 */
function syncAge(syncedAt: string | null): { text: string; stale: boolean } {
  if (!syncedAt) return { text: "尚未同步", stale: true };
  const ms = Date.now() - new Date(syncedAt).getTime();
  if (!Number.isFinite(ms) || ms < 0) return { text: "尚未同步", stale: true };
  const hours = Math.floor(ms / 3600_000);
  if (hours < 1) return { text: "剛剛同步", stale: false };
  if (hours <= 24) return { text: `${hours} 小時前同步`, stale: false };
  return { text: `資料已過期（${Math.floor(hours / 24)} 天前同步）`, stale: true };
}

/**
 * 每案的 GitHub 開發進度（唯讀鏡像）。資料來自 client_cases.github_progress，
 * 由 cron／本卡片的「重新同步」寫入——這個元件不會自己打 GitHub。
 * 與「內部待辦」並存：那張卡是手動勾的，這張是從 repo 讀來的事實，兩者互不寫入。
 */
export default function GithubProgressPanel({ caseId, repoUrl, progress, syncedAt, syncError }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // router.refresh() 後把伺服器最新狀態帶進來（force-dynamic 每次都是新物件）
  useEffect(() => {
    setError(null);
    setNotice(null);
  }, [progress, syncedAt]);

  async function sync() {
    if (busy) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/github-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: caseId }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.message || "同步失敗，請稍後再試。");
      } else {
        setNotice(data.message || "已同步 ✅");
        router.refresh();
      }
    } catch {
      setError("連線出了點問題，請稍後再試");
    } finally {
      setBusy(false);
    }
  }

  const age = syncAge(syncedAt);
  const hasRepo = !!repoUrl.trim();
  const status = progress?.status ?? (hasRepo ? "ok" : "no_repo");
  const hasItems = !!progress && progress.total > 0;
  const idle = progress?.idleDays ?? null;

  // 「數字與現實脫節」的兩種樣態：做完了卻還在 commit、還沒做完卻很久沒動。
  const suspicious =
    hasItems && idle !== null && ((progress!.pct === 100 && idle < 3) || (progress!.pct < 100 && idle > 14));
  const barColor = suspicious ? AMBER : GH_GREEN;

  return (
    <div className="gt-admin-card">
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: "#1d1d1f", margin: 0 }}>開發進度</h2>
        <span style={{ ...chipStyle, color: "#fff", background: "#1d1d1f" }}>GitHub</span>
        {progress && progress.owner && (
          <a
            href={`https://github.com/${progress.owner}/${progress.repo}`}
            target="_blank"
            rel="noreferrer"
            style={{ fontSize: 12.5, color: BRAND_BLUE, textDecoration: "none" }}
          >
            {progress.owner}/{progress.repo} ↗
          </a>
        )}
        {progress?.private && <span style={{ ...chipStyle, color: "#6e6e73", background: "#ececee" }}>私有</span>}
        <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 12, color: age.stale ? AMBER : "#86868b" }}>{age.text}</span>
          <button onClick={sync} disabled={busy} style={{ ...outlineBtn, opacity: busy ? 0.6 : 1 }}>
            {busy ? "同步中…" : "重新同步"}
          </button>
        </span>
      </div>

      {/* 來源一定要標示，否則看到百分比不知道是從哪個檔案算出來的 */}
      <p style={{ margin: "0 0 14px", fontSize: 12.5, color: "#86868b" }}>
        {status === "ok" ? (
          <>
            來源：
            {progress?.file?.url ? (
              <a
                href={progress.file.url}
                target="_blank"
                rel="noreferrer"
                style={{ color: BRAND_BLUE, textDecoration: "none" }}
              >
                {progressSourceLabel(progress)} ↗
              </a>
            ) : (
              progressSourceLabel(progress!)
            )}
            {progress?.stage ? `｜階段：${progress.stage}` : ""}
          </>
        ) : (
          "從案件的 GitHub Repo 連結讀取，不會顯示在客戶進度頁。"
        )}
      </p>

      {/* ── 非 ok：空狀態說明 ── */}
      {status !== "ok" && (
        <div style={{ fontSize: 13.5, color: "#86868b", lineHeight: 1.7 }}>
          {STATUS_MESSAGES[status]}
          {hasRepo && status !== "no_repo" && (
            <div style={{ marginTop: 6, fontSize: 12.5, color: "#a1a1a6", wordBreak: "break-all" }}>
              目前填的連結：{repoUrl}
            </div>
          )}
        </div>
      )}

      {/* ── ok 但沒有進度檔：只有 commit 活動 ── */}
      {status === "ok" && !hasItems && (
        <p style={{ fontSize: 13.5, color: "#86868b", margin: "0 0 14px", lineHeight: 1.7 }}>
          這個 repo 沒有可解析的進度檔，目前只顯示 commit 活動。
          <br />
          想看百分比：在 repo 根目錄放一份 <code>PROGRESS.md</code>（格式見 docs/PROGRESS-format.md）。
        </p>
      )}

      {/* ── 進度條 ── */}
      {hasItems && progress && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
            <span style={{ fontSize: 12.5, color: "#86868b" }}>
              {progress.done}／{progress.total} 完成
              {idle !== null && (
                <span style={{ marginLeft: 8, color: suspicious ? AMBER : "#a1a1a6" }}>
                  {idle === 0 ? "今天還在 commit" : `${idle} 天沒動`}
                </span>
              )}
            </span>
            <span style={{ fontSize: 12.5, color: barColor, fontWeight: 600 }}>{progress.pct}%</span>
          </div>
          <div style={{ height: 6, borderRadius: 980, background: "#eceef1", overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${progress.pct}%`,
                background: barColor,
                borderRadius: 980,
                transition: "width .25s ease",
              }}
            />
          </div>
          {suspicious && (
            <p style={{ margin: "8px 0 0", fontSize: 12, color: AMBER }}>
              {progress.pct === 100
                ? "進度檔顯示已完成，但最近仍在 commit —— 進度檔可能沒更新。"
                : "還沒做完但超過兩週沒有 commit —— 這個案子可能卡住了。"}
            </p>
          )}
        </div>
      )}

      {/* ── 分組小條 ── */}
      {progress && progress.groups.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
          {progress.groups.map((g) => {
            const pct = g.total > 0 ? Math.round((g.done / g.total) * 100) : 0;
            return (
              <div key={g.name} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span
                  style={{
                    flex: "0 0 30%",
                    fontSize: 12.5,
                    color: "#1d1d1f",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {g.name}
                </span>
                <div style={{ flex: 1, height: 4, borderRadius: 980, background: "#eceef1", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: GH_GREEN, borderRadius: 980 }} />
                </div>
                <span style={{ flex: "0 0 52px", textAlign: "right", fontSize: 12, color: "#86868b" }}>
                  {g.done}／{g.total}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* ── 項目清單（唯讀鏡像，不能在後台勾——要改請改 repo 裡的進度檔）── */}
      {progress && progress.items.length > 0 && (
        <details style={{ marginBottom: 14 }}>
          <summary style={{ fontSize: 13, color: BRAND_BLUE, cursor: "pointer" }}>
            展開 {progress.items.length} 個項目
          </summary>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
            {progress.items.map((it, i) => (
              <div key={`${i}-${it.label}`} style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ fontSize: 12, color: it.done ? GH_GREEN : "#c7c7cc" }}>{it.done ? "✓" : "○"}</span>
                <span
                  style={{
                    fontSize: 13.5,
                    color: it.done ? "#86868b" : "#1d1d1f",
                    textDecoration: it.done ? "line-through" : "none",
                  }}
                >
                  {it.label}
                </span>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* ── 最近 commit ── */}
      {progress && progress.commits.length > 0 && (
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: "#6e6e73", marginBottom: 8 }}>最近動態</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {progress.commits.slice(0, 5).map((c) => (
              <div key={c.sha} style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
                <span style={{ flex: "0 0 74px", fontSize: 12, color: "#a1a1a6" }}>{fmtDate(c.date)}</span>
                <span style={{ fontSize: 13.5, color: "#1d1d1f", lineHeight: 1.5 }}>{c.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {syncError && !error && (
        <div
          style={{
            marginTop: 12,
            fontSize: 13.5,
            color: "#b45309",
            background: "#fdecdb",
            border: "1px solid #f3d6ae",
            borderRadius: 12,
            padding: "10px 13px",
          }}
        >
          上次同步沒成功：{syncError}
        </div>
      )}
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
