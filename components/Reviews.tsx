import { reviews } from "@/content/data";

export default function Reviews() {
  return (
    <section id="reviews" className="lc-sec-pad" style={{ background: "#FFF6CF", padding: "90px 32px 90px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", width: 160, height: 160, borderRadius: "50%", background: "rgba(255,206,0,.4)", bottom: -30, right: 80, animation: "lc-floaty2 6s ease-in-out infinite" }} />
      <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative" }}>
        <div className="lc-reveal" style={{ textAlign: "center", maxWidth: 680, margin: "0 auto 56px" }}>
          <div style={{ display: "inline-block", background: "#1A1A1A", color: "#FFCE00", fontWeight: 700, fontSize: 14, padding: "7px 16px", borderRadius: 999, marginBottom: 18 }}>客戶評價</div>
          <h2 className="lc-h2" style={{ fontFamily: "var(--font-baloo), var(--font-noto), sans-serif", fontWeight: 800, fontSize: 46, color: "#1A1A1A", margin: "0 0 14px" }}>客戶怎麼說</h2>
        </div>
        <div className="lc-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 26 }}>
          {reviews.map((r) => (
            <div key={r.name} className="lc-card lc-reveal" style={{ background: "#fff", borderRadius: 24, padding: "34px 30px", boxShadow: "0 6px 0 rgba(255,206,0,.5)" }}>
              <div style={{ fontSize: 18, color: "#FFCE00", marginBottom: 16, letterSpacing: 2 }}>★★★★★</div>
              <p style={{ fontSize: 17, color: "#333", lineHeight: 1.75, margin: "0 0 24px", fontWeight: 500 }}>「{r.quote}」</p>
              <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: r.bg, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontFamily: "var(--font-baloo), sans-serif", color: "#1A1A1A", fontSize: 18 }}>{r.initial}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: "#1A1A1A" }}>{r.name}</div>
                  <div style={{ fontSize: 13, color: "#999" }}>{r.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
