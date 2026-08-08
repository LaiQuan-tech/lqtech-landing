"use client";

import Link from "next/link";
import { INFRA_SERVICES, type BoardCase } from "@/lib/adminCases";
import StatusSelect from "./StatusSelect";

type Props = { cases: BoardCase[] };

/**
 * 手機滑動案件看板：橫向 scroll-snap 輪播，每案一張卡。
 * 卡內含客戶/標題、狀態快速改（重用 StatusSelect）、內部待辦進度條、
 * 基礎設施連結 chips（只顯示有值的），底部詳情連結。
 */
export default function CaseBoard({ cases }: Props) {
  if (cases.length === 0) {
    return (
      <div className="gt-board-empty">
        尚無案件。先到「案件管理」新增，或把一段諮詢對話轉成案件，就會出現在這裡。
      </div>
    );
  }

  return (
    <div className="gt-board-track">
      {cases.map((c) => {
        const total = c.taskTotal ?? 0;
        const done = c.taskDone ?? 0;
        const pct = total > 0 ? Math.max(0, Math.min(100, Math.round((done / total) * 100))) : 0;
        const gh = c.github_progress;
        const idleText =
          gh?.idleDays === null || gh?.idleDays === undefined
            ? ""
            : gh.idleDays === 0
              ? "今天"
              : `${gh.idleDays} 天前`;

        return (
          <article key={c.id} className="gt-board-card">
            {/* 客戶 + 案件標題 */}
            <div className="gt-board-client">{c.client_name}</div>
            <div className="gt-board-title">{c.title}</div>

            {/* 狀態：快速改（樂觀更新 + PATCH）*/}
            <div>
              <StatusSelect id={c.id} value={c.status} />
            </div>

            {/* 內部待辦進度（藍） */}
            <div className="gt-board-progress-head">
              <span>內部待辦</span>
              {total > 0 ? (
                <span className="gt-board-progress-nums">
                  {done}/{total}（{pct}%）
                </span>
              ) : (
                <span className="gt-board-progress-empty">尚無待辦</span>
              )}
            </div>
            {total > 0 && (
              <div
                className="gt-board-progress"
                role="progressbar"
                aria-label="內部待辦進度"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div className="gt-board-progress-fill" style={{ width: `${pct}%` }} />
              </div>
            )}

            {/* GitHub 開發進度（綠）：讀 snapshot，沒 repo／沒進度檔就不畫條 */}
            {gh && gh.status === "ok" && (
              <>
                <div className="gt-board-progress-head">
                  <span>GitHub</span>
                  {gh.total > 0 ? (
                    <span className="gt-board-progress-nums">
                      {gh.done}/{gh.total}（{gh.pct}%）{idleText && `・${idleText}`}
                    </span>
                  ) : (
                    <span className="gt-board-progress-empty">
                      {idleText ? `僅 commit・${idleText}` : "無進度檔"}
                    </span>
                  )}
                </div>
                {gh.total > 0 && (
                  <div
                    className="gt-board-progress"
                    role="progressbar"
                    aria-label="GitHub 開發進度"
                    aria-valuenow={gh.pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div className="gt-board-progress-fill gt-board-progress-fill-gh" style={{ width: `${gh.pct}%` }} />
                  </div>
                )}
              </>
            )}

            {/* 基礎設施連結 chips（僅顯示有 url 的服務）*/}
            <div className="gt-board-chips">
              {INFRA_SERVICES.map((s) => {
                const link = c.links?.[s.key];
                if (!link?.url) return null;
                return (
                  <a
                    key={s.key}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="gt-board-chip"
                    title={link.note || s.label}
                  >
                    {s.label}
                  </a>
                );
              })}
            </div>

            {/* 詳情 */}
            <Link href={`/admin/cases/${c.id}`} className="gt-board-detail">
              詳情 →
            </Link>
          </article>
        );
      })}
    </div>
  );
}
