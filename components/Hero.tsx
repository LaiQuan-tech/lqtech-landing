const BOLT = "polygon(58% 0,18% 52%,46% 52%,30% 100%,82% 40%,52% 40%)";

export default function Hero() {
  return (
    <section id="top" style={{ position: "relative", background: "#FFCE00", overflow: "hidden" }}>
      {/* 漂浮圓裝飾 — 小螢幕隱藏（手機改用下方大閃電） */}
      <div className="lc-hero-decor">
        <div style={{ position: "absolute", width: 240, height: 240, borderRadius: "50%", background: "rgba(255,255,255,.45)", top: -50, right: 160, animation: "lc-floaty 6s ease-in-out infinite" }} />
        <div style={{ position: "absolute", width: 130, height: 130, borderRadius: "50%", background: "rgba(255,255,255,.35)", bottom: 60, left: 60, animation: "lc-floaty2 5s ease-in-out infinite" }} />
        <div style={{ position: "absolute", width: 70, height: 70, borderRadius: "50%", border: "5px solid rgba(26,26,26,.12)", top: 330, right: 90, animation: "lc-floaty 7s ease-in-out infinite" }} />
      </div>

      {/* 大閃電 — 桌機與手機都顯示（手機版由 CSS 重新定位/縮放） */}
      <div className="lc-hero-bolts" aria-hidden>
        <div className="lc-bolt lc-bolt-dark" style={{ position: "absolute", right: 200, top: 150, width: 300, height: 430, background: "#1A1A1A", clipPath: BOLT, opacity: 0.92, animation: "lc-floaty 6.5s ease-in-out infinite" }} />
        <div className="lc-bolt lc-bolt-light" style={{ position: "absolute", right: 160, top: 130, width: 300, height: 430, background: "#fff", clipPath: BOLT, opacity: 0.45 }} />
      </div>

      <div className="lc-hero-pad" style={{ position: "relative", maxWidth: 1200, margin: "0 auto", padding: "120px 32px 130px" }}>
        <div style={{ maxWidth: 680 }}>
          <div style={{ display: "inline-block", background: "#1A1A1A", color: "#FFCE00", fontWeight: 700, fontSize: 14, padding: "8px 18px", borderRadius: 999, marginBottom: 26, letterSpacing: ".03em" }}>
            ⚡ 企業官網 · Web App · 品牌 UI/UX
          </div>
          <h1 className="lc-h1" style={{ fontFamily: "var(--font-baloo), var(--font-noto), sans-serif", fontWeight: 800, fontSize: 84, lineHeight: 1.06, color: "#1A1A1A", margin: "0 0 26px" }}>
            把好點子<br />通電上線
          </h1>
          <p className="lc-hero-sub" style={{ fontSize: 22, lineHeight: 1.7, color: "#3a3000", margin: "0 0 38px", fontWeight: 500 }}>
            萊乾資訊替中小企業到大型團隊，打造會發光的數位產品。<br />從設計到開發一條龍，讓你的生意閃電起步。
          </p>
          <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
            <a href="#contact" className="lc-btn-dark" style={{ background: "#1A1A1A", color: "#fff", fontWeight: 700, fontSize: 18, padding: "18px 36px", borderRadius: 999, textDecoration: "none" }}>
              立即諮詢
            </a>
            <a href="#works" className="lc-btn-light" style={{ background: "#fff", color: "#1A1A1A", fontWeight: 700, fontSize: 18, padding: "18px 32px", borderRadius: 999, border: "2px solid #1A1A1A", textDecoration: "none" }}>
              作品案例
            </a>
          </div>
          <div className="lc-stats" style={{ display: "flex", gap: 46, marginTop: 56, flexWrap: "wrap" }}>
            {[
              { n: "50+", l: "完成專案" },
              { n: "98%", l: "客戶回購率" },
              { n: "6 年", l: "開發經驗" },
            ].map((s) => (
              <div key={s.l}>
                <div className="lc-stat-num" style={{ fontFamily: "var(--font-baloo), sans-serif", fontWeight: 800, fontSize: 38, color: "#1A1A1A" }}>{s.n}</div>
                <div style={{ fontSize: 15, color: "#5a4a00", fontWeight: 500 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 60, background: "#FFFBEC", clipPath: "polygon(0 100%,100% 100%,100% 30%,0 95%)" }} />
    </section>
  );
}
