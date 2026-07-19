import type { Lead } from "@/lib/adminLeads";

// YYYY.MM.DD HH:mm
function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** 一筆官網諮詢表單（leads；純呈現）。 */
export default function ContactSubmissionCard({ sub }: { sub: Lead }) {
  const contacts = [sub.email, sub.phone].filter(Boolean).join(" · ");
  return (
    <div className="gt-admin-card" style={{ marginBottom: 12 }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div style={{ fontSize: 15.5, fontWeight: 700, color: "#1d1d1f" }}>
          {sub.name}
          {sub.company && (
            <span style={{ fontWeight: 400, color: "#6e6e73", fontSize: 14 }}> · {sub.company}</span>
          )}
        </div>
        <div style={{ fontSize: 12.5, color: "#86868b", whiteSpace: "nowrap" }}>
          {formatDateTime(sub.created_at)}
        </div>
      </div>

      {/* 需求類型 + 來源 + 聯絡方式 */}
      <div
        style={{
          marginTop: 8,
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
          fontSize: 13,
          color: "#6e6e73",
        }}
      >
        {sub.need_type && (
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#1668c2",
              background: "#e2effb",
              borderRadius: 980,
              padding: "2px 10px",
              whiteSpace: "nowrap",
            }}
          >
            {sub.need_type}
          </span>
        )}
        <span
          style={{
            fontSize: 11.5,
            fontWeight: 600,
            color: "#6e6e73",
            background: "#ececee",
            borderRadius: 980,
            padding: "2px 9px",
            whiteSpace: "nowrap",
          }}
        >
          官網表單
        </span>
        {contacts && <span style={{ color: "#6e6e73" }}>{contacts}</span>}
      </div>

      <div
        style={{
          marginTop: 10,
          fontSize: 14.5,
          color: "#1d1d1f",
          whiteSpace: "pre-wrap",
          lineHeight: 1.65,
        }}
      >
        {sub.message}
      </div>
    </div>
  );
}
