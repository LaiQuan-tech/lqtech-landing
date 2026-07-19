"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { INFRA_SERVICES, type CaseLinks } from "@/lib/adminCases";

const BRAND_BLUE = "#1668c2";

type Props = {
  caseId: string;
  links: CaseLinks;
};

const fieldStyle: React.CSSProperties = {
  border: "1px solid rgba(0,0,0,.14)",
  borderRadius: 12,
  padding: "8px 11px",
  fontSize: 14,
  outline: "none",
  background: "#fff",
  color: "#1d1d1f",
};
const primaryBtn: React.CSSProperties = {
  border: "none",
  background: BRAND_BLUE,
  color: "#fff",
  borderRadius: 980,
  padding: "9px 22px",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  whiteSpace: "nowrap",
};
const chipStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  background: "#e2effb",
  color: BRAND_BLUE,
  border: "1px solid #cfe3f7",
  borderRadius: 980,
  padding: "4px 10px",
  fontSize: 12.5,
  fontWeight: 600,
  textDecoration: "none",
  whiteSpace: "nowrap",
};
const plainLabel: React.CSSProperties = {
  fontSize: 13.5,
  fontWeight: 600,
  color: "#1d1d1f",
  whiteSpace: "nowrap",
};

// 各服務欄位提示（key 對應 INFRA_SERVICES）。
const PLACEHOLDERS: Record<string, { url: string; note: string }> = {
  repo: { url: "https://github.com/org/repo", note: "分支 / 部署帳號" },
  vercel: { url: "https://vercel.com/team/project", note: "專案 / team" },
  supabase: { url: "https://supabase.com/dashboard/project/xxxx", note: "專案 ref" },
  railway: { url: "https://railway.app/project/xxxx", note: "服務名稱" },
  ga4: { url: "https://analytics.google.com/", note: "追蹤碼 G-XXXXXXX" },
  search_console: { url: "https://search.google.com/search-console", note: "資源 / 網域" },
};
const DEFAULT_PH = { url: "https://…", note: "專案 ref / 追蹤碼" };

/** 後台專案管理：集中維護本案 6 個服務的後台入口連結（admin-only，不進客戶 portal）。 */
export default function InfraLinksPanel({ caseId, links }: Props) {
  const router = useRouter();
  const [draft, setDraft] = useState<CaseLinks>(links ?? {});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function setField(key: keyof CaseLinks, field: "url" | "note", value: string) {
    setDraft((prev) => {
      const cur = prev[key] ?? { url: "", note: "" };
      const nextEntry =
        field === "url" ? { url: value, note: cur.note } : { url: cur.url, note: value };
      return { ...prev, [key]: nextEntry } as CaseLinks;
    });
  }

  async function save() {
    if (busy) return;
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      // 只送有填內容的服務（url 或 note 任一非空）；兩者皆空＝移除該服務。
      const clean: CaseLinks = {};
      for (const { key } of INFRA_SERVICES) {
        const v = draft[key];
        if (!v) continue;
        const url = (v.url ?? "").trim();
        const note = (v.note ?? "").trim();
        if (url || note) clean[key] = { url, note };
      }
      const res = await fetch("/api/admin/cases", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: caseId, links: clean }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.ok === false) {
        setError(data?.message || data?.error || "儲存失敗，請稍後再試");
        return;
      }
      setDraft(clean);
      setNotice("已儲存基礎設施連結 ✅");
      router.refresh();
    } catch {
      setError("連線出了點問題，請稍後再試");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="gt-admin-card">
      <h2 style={{ fontSize: 17, fontWeight: 700, color: "#1d1d1f", margin: "0 0 4px" }}>基礎設施連結</h2>
      <p style={{ margin: "0 0 14px", fontSize: 12.5, color: "#86868b" }}>
        集中管理本案各服務後台入口（僅後台可見，不會顯示在客戶進度頁）。
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {INFRA_SERVICES.map(({ key, label }) => {
          const cur = draft[key] ?? { url: "", note: "" };
          const url = (cur.url ?? "").trim();
          const ph = PLACEHOLDERS[key] ?? DEFAULT_PH;
          return (
            <div
              key={key}
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
                alignItems: "center",
                border: "1px solid rgba(0,0,0,.08)",
                borderRadius: 12,
                padding: "10px 12px",
              }}
            >
              <div style={{ width: 116, flexShrink: 0 }}>
                {url ? (
                  <a href={url} target="_blank" rel="noreferrer" style={chipStyle}>
                    {label} ↗
                  </a>
                ) : (
                  <span style={plainLabel}>{label}</span>
                )}
              </div>
              <input
                type="url"
                value={cur.url ?? ""}
                onChange={(e) => setField(key, "url", e.target.value)}
                placeholder={ph.url}
                aria-label={`${label} 網址`}
                style={{ ...fieldStyle, flex: "2 1 240px", minWidth: 180 }}
              />
              <input
                type="text"
                value={cur.note ?? ""}
                onChange={(e) => setField(key, "note", e.target.value)}
                placeholder={ph.note}
                aria-label={`${label} 備註`}
                style={{ ...fieldStyle, flex: "1 1 150px", minWidth: 130 }}
              />
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", marginTop: 14 }}>
        <button
          type="button"
          onClick={save}
          disabled={busy}
          style={{ ...primaryBtn, marginLeft: "auto", opacity: busy ? 0.6 : 1 }}
        >
          {busy ? "儲存中…" : "儲存連結"}
        </button>
      </div>

      {error && (
        <div
          style={{
            marginTop: 12,
            fontSize: 13.5,
            color: "#b3261e",
            background: "#fdecea",
            border: "1px solid #f6c9c4",
            borderRadius: 12,
            padding: "10px 13px",
          }}
        >
          {error}
        </div>
      )}
      {notice && !error && (
        <div
          style={{
            marginTop: 12,
            fontSize: 13.5,
            color: "#1f7a44",
            background: "#dcf3e5",
            border: "1px solid #bfe6cd",
            borderRadius: 12,
            padding: "10px 13px",
          }}
        >
          {notice}
        </div>
      )}
    </div>
  );
}
