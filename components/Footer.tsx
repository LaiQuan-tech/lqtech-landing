import Logo from "./Logo";
import { site } from "@/content/site";

export default function Footer() {
  return (
    <footer style={{ background: "#111", padding: "46px 32px 38px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Logo size={38} radius={11} box="#FFCE00" bolt="#1A1A1A" />
          <span style={{ fontFamily: "var(--font-baloo), sans-serif", fontWeight: 800, fontSize: 21, color: "#fff" }}>{site.name}</span>
        </div>
        <p style={{ fontSize: 14, color: "#888", margin: 0 }}>{site.slogan}</p>
        <p style={{ fontSize: 13, color: "#666", margin: 0 }}>© 2026 {site.name} {site.nameEn}. All rights reserved.</p>
      </div>
    </footer>
  );
}
