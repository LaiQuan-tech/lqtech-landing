import { steps } from "@/content/data";
import CurrentLine from "./CurrentLine";

export default function Process() {
  return (
    <section id="process" className="lc-sec-pad" style={{ background: "#FFFBEC", padding: "90px 32px 80px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div className="lc-reveal" style={{ textAlign: "center", maxWidth: 680, margin: "0 auto 60px" }}>
          <div style={{ display: "inline-block", background: "#FFE680", color: "#9a7a00", fontWeight: 700, fontSize: 14, padding: "7px 16px", borderRadius: 999, marginBottom: 18 }}>開發流程</div>
          <h2 className="lc-h2" style={{ fontFamily: "var(--font-baloo), var(--font-noto), sans-serif", fontWeight: 800, fontSize: 46, color: "#1A1A1A", margin: "0 0 14px" }}>透明的五步驟，全程不斷電</h2>
          <p style={{ fontSize: 18, color: "#777", lineHeight: 1.7, margin: 0 }}>你永遠知道專案進行到哪、下一步是什麼，沒有黑箱。</p>
        </div>
        <div className="lc-grid-5" style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 16, position: "relative" }}>
          {/* 電路電流線：亮光由 01 流到 05（扣題「接成一條完整的電路 / 全程不斷電」），桌機才顯示 */}
          <CurrentLine
            className="lc-circuit"
            height={3}
            baseColor="rgba(26,26,26,.12)"
            glow="rgba(255,206,0,.95)"
            duration={2.8}
            style={{ position: "absolute", top: 52, left: "10%", right: "10%", zIndex: 0 }}
          />
          {steps.map((st) => (
            <div key={st.n} className="lc-step lc-reveal" style={{ position: "relative", zIndex: 1, background: "#fff", border: "2px solid #f0e6c0", borderRadius: 20, padding: "26px 20px", textAlign: "center" }}>
              <div className="lc-step-num" style={{ width: 54, height: 54, margin: "0 auto 16px", borderRadius: 16, background: "#FFCE00", color: "#1A1A1A", fontFamily: "var(--font-baloo), sans-serif", fontWeight: 800, fontSize: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>{st.n}</div>
              <h3 style={{ fontFamily: "var(--font-baloo), var(--font-noto), sans-serif", fontWeight: 700, fontSize: 19, color: "#1A1A1A", margin: "0 0 8px" }}>{st.title}</h3>
              <p style={{ fontSize: 14, color: "#888", lineHeight: 1.6, margin: 0 }}>{st.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
