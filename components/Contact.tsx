import ContactForm from "./ContactForm";
import { site } from "@/content/site";

const BOLT = "polygon(58% 0,18% 52%,46% 52%,30% 100%,82% 40%,52% 40%)";

export default function Contact() {
  return (
    <section id="contact" className="lc-sec-pad" style={{ background: "#1A1A1A", padding: "90px 32px 90px", position: "relative", overflow: "hidden" }}>
      <div className="lc-hero-decor" style={{ position: "absolute", right: 120, top: 60, width: 200, height: 280, background: "rgba(255,206,0,.1)", clipPath: BOLT, animation: "lc-floaty 6.5s ease-in-out infinite" }} />
      <div className="lc-contact-grid" style={{ maxWidth: 1080, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1.1fr", gap: 60, alignItems: "center", position: "relative" }}>
        <div className="lc-reveal">
          <div style={{ display: "inline-block", background: "#FFCE00", color: "#1A1A1A", fontWeight: 700, fontSize: 14, padding: "7px 16px", borderRadius: 999, marginBottom: 22 }}>免費諮詢</div>
          <h2 className="lc-contact-h2" style={{ fontFamily: "var(--font-baloo), var(--font-noto), sans-serif", fontWeight: 800, fontSize: 48, lineHeight: 1.12, color: "#fff", margin: "0 0 20px" }}>
            準備好讓生意<br />
            <span style={{ color: "#FFCE00" }}>通電</span>了嗎？
          </h2>
          <p style={{ fontSize: 18, color: "#bbb", lineHeight: 1.75, margin: "0 0 34px" }}>留下你的需求，我們會在一個工作天內回覆。想更快？直接點右下角或下方的 LINE 跟我們聊。</p>
          <a href={site.lineUrl} target="_blank" rel="noopener noreferrer" className="lc-btn-dark" style={{ display: "inline-flex", alignItems: "center", gap: 12, background: "#06C755", color: "#fff", fontWeight: 700, fontSize: 18, padding: "16px 28px", borderRadius: 999, textDecoration: "none", marginBottom: 30 }}>
            <span style={{ width: 30, height: 30, borderRadius: 8, background: "#fff", color: "#06C755", fontWeight: 800, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-baloo), sans-serif" }}>LINE</span>
            加 LINE 立即諮詢
          </a>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 6 }}>
            <a href={`mailto:${site.email}`} style={{ display: "flex", alignItems: "center", gap: 12, color: "#ddd", fontSize: 16, textDecoration: "none" }}><span style={{ fontSize: 20 }}>✉️</span> {site.email}</a>
            <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#ddd", fontSize: 16 }}><span style={{ fontSize: 20 }}>📍</span> {site.address}</div>
          </div>
        </div>

        <ContactForm />
      </div>
    </section>
  );
}
