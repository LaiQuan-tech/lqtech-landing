import { techs } from "@/content/site";

export default function TrustStrip() {
  return (
    <section style={{ background: "#FFFBEC", padding: "30px 32px 10px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
        <span style={{ fontSize: 14, color: "#999", fontWeight: 500, marginRight: 8 }}>合作夥伴與技術夥伴</span>
        {techs.map((t) => (
          <span key={t} style={{ background: "#fff", border: "1.5px solid #f0e6c0", color: "#666", fontWeight: 600, fontSize: 14, padding: "8px 16px", borderRadius: 999 }}>
            {t}
          </span>
        ))}
      </div>
    </section>
  );
}
