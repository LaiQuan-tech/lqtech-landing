// 電流流動線：底層暗線 + 一段沿線跑的亮光帶（lc-flow-x）。
// 純展示元件，用於 Nav 底部、Process 電路線等。
export default function CurrentLine({
  height = 2,
  baseColor = "rgba(26,26,26,.25)",
  glow = "rgba(255,255,255,.95)",
  duration = 3.2,
  className = "",
  style = {},
}: {
  height?: number;
  baseColor?: string;
  glow?: string;
  duration?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      aria-hidden
      className={className}
      style={{ position: "relative", height, background: baseColor, overflow: "hidden", ...style }}
    >
      <div
        className="lc-current"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `linear-gradient(90deg, transparent 0%, ${glow} 50%, transparent 100%)`,
          animationDuration: `${duration}s`,
        }}
      />
    </div>
  );
}
