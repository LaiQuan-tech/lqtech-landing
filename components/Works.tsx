import { works } from "@/content/data";

export default function Works() {
  return (
    <section id="works" className="lc-sec-pad" style={{ background: "#1A1A1A", padding: "90px 32px 90px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", width: 200, height: 200, borderRadius: "50%", border: "4px solid rgba(255,206,0,.18)", top: 60, left: -40, animation: "lc-floaty 7s ease-in-out infinite" }} />
      <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative" }}>
        <div className="lc-reveal" style={{ textAlign: "center", maxWidth: 680, margin: "0 auto 56px" }}>
          <div style={{ display: "inline-block", background: "#FFCE00", color: "#1A1A1A", fontWeight: 700, fontSize: 14, padding: "7px 16px", borderRadius: 999, marginBottom: 18 }}>作品案例</div>
          <h2 className="lc-h2" style={{ fontFamily: "var(--font-baloo), var(--font-noto), sans-serif", fontWeight: 800, fontSize: 46, color: "#fff", margin: "0 0 14px" }}>我們做過的好東西</h2>
          <p style={{ fontSize: 18, color: "#bbb", lineHeight: 1.7, margin: 0 }}>每個專案都是一次完整的合作。以下是部分代表作（圖片為示意佔位）。</p>
        </div>
        <div className="lc-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 26 }}>
          {works.map((w) => (
            <div key={w.title} className="lc-work lc-reveal" style={{ background: "#262626", borderRadius: 24, overflow: "hidden", boxShadow: "0 8px 0 rgba(0,0,0,.3)" }}>
              <div style={{ height: 200, overflow: "hidden", position: "relative" }}>
                <div className="lc-work-img" style={{ position: "absolute", inset: 0, background: w.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 64 }}>{w.emoji}</span>
                  <span style={{ position: "absolute", bottom: 10, right: 12, fontFamily: "monospace", fontSize: 11, color: "rgba(0,0,0,.35)" }}>作品截圖佔位</span>
                </div>
                <span style={{ position: "absolute", top: 14, left: 14, background: "#1A1A1A", color: "#FFCE00", fontWeight: 700, fontSize: 12, padding: "5px 12px", borderRadius: 999 }}>{w.tag}</span>
              </div>
              <div style={{ padding: "24px 24px 28px" }}>
                <h3 style={{ fontFamily: "var(--font-baloo), var(--font-noto), sans-serif", fontWeight: 700, fontSize: 21, color: "#fff", margin: "0 0 8px" }}>{w.title}</h3>
                <p style={{ fontSize: 15, color: "#aaa", lineHeight: 1.65, margin: "0 0 14px" }}>{w.desc}</p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {w.stack.map((st) => (
                    <span key={st} style={{ background: "rgba(255,206,0,.14)", color: "#FFCE00", fontSize: 12, fontWeight: 600, padding: "4px 11px", borderRadius: 999 }}>{st}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
