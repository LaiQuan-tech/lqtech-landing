import { bubbles } from "@/content/data";
import { site } from "@/content/site";

// 可點擊的上升泡泡，點擊開啟 LINE。容器穿透，僅泡泡本身可點。
export default function FloatingBubbles() {
  return (
    <div className="lc-bubbles" style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 60 }} aria-hidden>
      {bubbles.map((b, i) => (
        <a
          key={i}
          href={site.lineUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="點我加 LINE 諮詢"
          style={{
            position: "fixed",
            pointerEvents: "auto",
            bottom: -90,
            left: b.left,
            width: b.size,
            height: b.size,
            borderRadius: "50%",
            background: b.bg,
            border: b.border,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textDecoration: "none",
            animation: `lc-bubrise ${b.dur} linear ${b.delay} infinite`,
          }}
        >
          <span style={{ fontSize: b.fontSize, lineHeight: 1 }}>{b.icon}</span>
        </a>
      ))}
    </div>
  );
}
