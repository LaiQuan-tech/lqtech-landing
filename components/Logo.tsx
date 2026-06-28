// CSS 繪製的 Logo：圓角方塊 + 閃電 clip-path。可調尺寸與配色反轉。
const BOLT = "polygon(58% 0,18% 52%,46% 52%,30% 100%,82% 40%,52% 40%)";

export default function Logo({
  size = 42,
  radius = 12,
  box = "#1A1A1A",
  bolt = "#FFCE00",
}: {
  size?: number;
  radius?: number;
  box?: string;
  bolt?: string;
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        background: box,
        borderRadius: radius,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <div
        className="lc-flicker"
        style={{
          width: size * 0.43,
          height: size * 0.57,
          background: bolt,
          clipPath: BOLT,
        }}
      />
    </div>
  );
}
