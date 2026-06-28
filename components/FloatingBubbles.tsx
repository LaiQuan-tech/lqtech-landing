"use client";

import { useRef, useState } from "react";
import { bubbles } from "@/content/data";

// 可點擊的上升泡泡：點一下會「啵」一聲破掉，稍後從底部重新升起。
// （不再連到 LINE；右下角浮動鈕與聯絡區的 LINE 仍可用。）
export default function FloatingBubbles() {
  const [cycle, setCycle] = useState<number[]>(() => bubbles.map(() => 0));
  const [frozen, setFrozen] = useState<({ top: number; left: number } | null)[]>(
    () => bubbles.map(() => null)
  );
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const pop = (i: number) => {
    if (frozen[i]) return;
    const el = refs.current[i];
    if (!el) return;
    const r = el.getBoundingClientRect();
    setFrozen((f) => {
      const n = [...f];
      n[i] = { top: r.top, left: r.left };
      return n;
    });
  };

  const respawn = (i: number) => {
    setFrozen((f) => {
      const n = [...f];
      n[i] = null;
      return n;
    });
    setCycle((c) => {
      const n = [...c];
      n[i] += 1;
      return n;
    });
  };

  return (
    <div
      className="lc-bubbles"
      style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 60 }}
      aria-hidden
    >
      {bubbles.map((b, i) => {
        const common: React.CSSProperties = {
          width: b.size,
          height: b.size,
          borderRadius: "50%",
          background: b.bg,
          border: b.border,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
        };
        const f = frozen[i];

        if (f) {
          // 破裂中：固定在被點當下的位置原地爆開
          return (
            <button
              key={`pop-${i}-${cycle[i]}`}
              onAnimationEnd={() => respawn(i)}
              style={{
                ...common,
                border: "none",
                position: "fixed",
                pointerEvents: "none",
                top: f.top,
                left: f.left,
                animation: "lc-pop .42s ease-out forwards",
              }}
            >
              <span style={{ fontSize: b.fontSize, lineHeight: 1 }}>{b.icon}</span>
            </button>
          );
        }

        // 上升中：可點擊，戳破它
        return (
          <button
            key={`float-${i}-${cycle[i]}`}
            ref={(el) => {
              refs.current[i] = el;
            }}
            onClick={() => pop(i)}
            title="戳破我 ⚡"
            style={{
              ...common,
              position: "fixed",
              pointerEvents: "auto",
              bottom: "-90px",
              left: b.left,
              cursor: "pointer",
              animation: `lc-bubrise ${b.dur} linear ${cycle[i] === 0 ? b.delay : "0s"} infinite`,
            }}
          >
            <span style={{ fontSize: b.fontSize, lineHeight: 1 }}>{b.icon}</span>
          </button>
        );
      })}
    </div>
  );
}
