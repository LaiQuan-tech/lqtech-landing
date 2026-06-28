import { services } from "@/content/data";

export default function Services() {
  return (
    <section id="services" className="lc-sec-pad" style={{ background: "#FFFBEC", padding: "90px 32px 80px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div className="lc-reveal" style={{ textAlign: "center", maxWidth: 680, margin: "0 auto 56px" }}>
          <div style={{ display: "inline-block", background: "#FFE680", color: "#9a7a00", fontWeight: 700, fontSize: 14, padding: "7px 16px", borderRadius: 999, marginBottom: 18 }}>我們的服務</div>
          <h2 className="lc-h2" style={{ fontFamily: "var(--font-baloo), var(--font-noto), sans-serif", fontWeight: 800, fontSize: 46, color: "#1A1A1A", margin: "0 0 14px" }}>一站搞定，從想法到上線</h2>
          <p style={{ fontSize: 18, color: "#777", lineHeight: 1.7, margin: 0 }}>不用東拼西湊找不同團隊，萊乾資訊把設計、開發、維運接成一條完整的電路。</p>
        </div>
        <div className="lc-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 26 }}>
          {services.map((s) => (
            <div key={s.title} className="lc-card lc-reveal" style={{ background: "#fff", border: "2px solid #f0e6c0", borderRadius: 24, padding: "38px 32px", boxShadow: "0 4px 0 #f0e6c0" }}>
              <div style={{ width: 64, height: 64, borderRadius: 18, background: "#FFCE00", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, marginBottom: 22 }}>{s.icon}</div>
              <h3 style={{ fontFamily: "var(--font-baloo), var(--font-noto), sans-serif", fontWeight: 700, fontSize: 24, color: "#1A1A1A", margin: "0 0 12px" }}>{s.title}</h3>
              <p style={{ fontSize: 16, color: "#777", lineHeight: 1.7, margin: "0 0 18px" }}>{s.desc}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {s.points.map((p) => (
                  <div key={p} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 15, color: "#444", fontWeight: 500 }}>
                    <span style={{ color: "#1A1A1A", fontWeight: 800 }}>⚡</span>
                    {p}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
