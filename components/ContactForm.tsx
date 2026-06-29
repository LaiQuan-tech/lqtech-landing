"use client";

import { useState } from "react";
import { submitLead } from "@/app/actions/submit-lead";
import { needTypes } from "@/content/data";

const fieldStyle: React.CSSProperties = {
  width: "100%",
  padding: "13px 15px",
  border: "2px solid #eadfb8",
  borderRadius: 12,
  fontSize: 15,
  fontFamily: "inherit",
  background: "#FFFEF8",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 14,
  fontWeight: 600,
  color: "#444",
  marginBottom: 7,
};

export default function ContactForm() {
  const [fName, setFName] = useState("");
  const [fCompany, setFCompany] = useState("");
  const [fEmail, setFEmail] = useState("");
  const [fPhone, setFPhone] = useState("");
  const [fMsg, setFMsg] = useState("");
  const [need, setNeed] = useState("");

  const [sent, setSent] = useState(false);
  const [sentName, setSentName] = useState("");
  const [showError, setShowError] = useState(false);
  const [errorMsg, setErrorMsg] = useState("請填寫姓名、Email 與專案簡述。");
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setSent(false);
    setShowError(false);
    setNeed("");
    setFName("");
    setFCompany("");
    setFEmail("");
    setFPhone("");
    setFMsg("");
  };

  const submit = async () => {
    if (!fName.trim() || !fEmail.trim() || !fMsg.trim() || !/.+@.+\..+/.test(fEmail)) {
      setErrorMsg("請填寫姓名、Email 與專案簡述。");
      setShowError(true);
      return;
    }
    setShowError(false);
    setLoading(true);
    const res = await submitLead({
      name: fName,
      company: fCompany,
      email: fEmail,
      phone: fPhone,
      needType: need,
      message: fMsg,
    });
    setLoading(false);
    if (res.ok) {
      setSentName(fName.trim());
      setSent(true);
    } else {
      setErrorMsg(res.error);
      setShowError(true);
    }
  };

  return (
    <div className="lc-reveal lc-form-card lc-elec-border" style={{ background: "#fff", borderRadius: 28, padding: "38px 36px", boxShadow: "0 20px 60px rgba(0,0,0,.4)" }}>
      {sent ? (
        <div style={{ textAlign: "center", padding: "40px 10px" }}>
          <div style={{ width: 88, height: 88, margin: "0 auto 24px", borderRadius: "50%", background: "#FFCE00", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44, boxShadow: "0 0 34px rgba(255,206,0,.75)", animation: "lc-pulse 1.6s ease-in-out infinite" }}>⚡</div>
          <h3 style={{ fontFamily: "var(--font-baloo), var(--font-noto), sans-serif", fontWeight: 800, fontSize: 28, color: "#1A1A1A", margin: "0 0 12px" }}>收到囉！</h3>
          <p style={{ fontSize: 16, color: "#777", lineHeight: 1.7, margin: "0 0 26px" }}>
            謝謝你 {sentName}！需求已經送達 ⚡<br />我們會在一個工作天內回信給你，先去忙別的吧。
          </p>
          <button onClick={reset} style={{ background: "#1A1A1A", color: "#FFCE00", fontWeight: 700, fontSize: 15, padding: "12px 26px", borderRadius: 999, border: "none", cursor: "pointer" }}>再填一筆</button>
        </div>
      ) : (
        <div>
          <h3 style={{ fontFamily: "var(--font-baloo), var(--font-noto), sans-serif", fontWeight: 700, fontSize: 24, color: "#1A1A1A", margin: "0 0 22px" }}>告訴我們你的專案 ⚡</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <label style={labelStyle}>姓名 *</label>
                <input className="lc-field" value={fName} onChange={(e) => setFName(e.target.value)} placeholder="王小明" style={fieldStyle} />
              </div>
              <div>
                <label style={labelStyle}>公司／品牌</label>
                <input className="lc-field" value={fCompany} onChange={(e) => setFCompany(e.target.value)} placeholder="選填" style={fieldStyle} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <label style={labelStyle}>Email *</label>
                <input className="lc-field" type="email" value={fEmail} onChange={(e) => setFEmail(e.target.value)} placeholder="you@email.com" style={fieldStyle} />
              </div>
              <div>
                <label style={labelStyle}>電話</label>
                <input className="lc-field" value={fPhone} onChange={(e) => setFPhone(e.target.value)} placeholder="選填" style={fieldStyle} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>需求類型</label>
              <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
                {needTypes.map((label) => {
                  const active = need === label;
                  return (
                    <button
                      key={label}
                      type="button"
                      className="lc-chip"
                      onClick={() => setNeed(active ? "" : label)}
                      style={{ background: active ? "#FFCE00" : "#fff", color: "#1A1A1A", border: `2px solid ${active ? "#FFCE00" : "#eadfb8"}`, fontWeight: 600, fontSize: 14, padding: "8px 16px", borderRadius: 999, cursor: "pointer", fontFamily: "inherit" }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label style={labelStyle}>專案簡述 *</label>
              <textarea className="lc-field" value={fMsg} onChange={(e) => setFMsg(e.target.value)} placeholder="簡單描述你想做的東西、預算範圍或期望時程⋯⋯" rows={4} style={{ ...fieldStyle, resize: "vertical" }} />
            </div>
            {showError && (
              <div style={{ background: "#FFF0F0", color: "#C0392B", fontSize: 14, fontWeight: 600, padding: "11px 16px", borderRadius: 10 }}>⚠️ {errorMsg}</div>
            )}
            <button
              type="button"
              onClick={submit}
              disabled={loading}
              className="lc-zap-charge"
              style={{ background: "#FFCE00", color: "#1A1A1A", fontWeight: 800, fontSize: 18, padding: 16, borderRadius: 14, border: "none", cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", marginTop: 4, boxShadow: "0 6px 0 #cca600", opacity: loading ? 0.7 : 1 }}
            >
              {loading ? "送出中⋯" : "送出諮詢 ⚡"}
            </button>
            <p style={{ fontSize: 12, color: "#aaa", textAlign: "center", margin: "2px 0 0" }}>送出即表示同意萊乾資訊與你聯繫，我們不會外流你的資料。</p>
          </div>
        </div>
      )}
    </div>
  );
}
