import { site } from "@/content/site";

export default function LineFab() {
  return (
    <a
      href={site.lineUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="lc-line-fab"
      aria-label="加 LINE 諮詢"
      style={{ position: "fixed", right: 26, bottom: 26, zIndex: 80, display: "flex", flexDirection: "column", alignItems: "center", gap: 7, textDecoration: "none" }}
    >
      <div style={{ width: 66, height: 66, borderRadius: "50%", background: "#06C755", boxShadow: "0 10px 28px rgba(6,199,85,.5)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 15, fontFamily: "var(--font-baloo), sans-serif", animation: "lc-pulse 2.6s ease-in-out infinite" }}>LINE</div>
      <span style={{ background: "#1A1A1A", color: "#fff", fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 999, whiteSpace: "nowrap" }}>點我諮詢</span>
    </a>
  );
}
