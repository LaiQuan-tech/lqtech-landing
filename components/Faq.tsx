"use client";

import { useState } from "react";
import { faqs } from "@/content/data";

export default function Faq() {
  const [open, setOpen] = useState(-1);

  return (
    <section id="faq" className="lc-sec-pad" style={{ background: "#FFFBEC", padding: "90px 32px 80px" }}>
      <div style={{ maxWidth: 820, margin: "0 auto" }}>
        <div className="lc-reveal" style={{ textAlign: "center", margin: "0 auto 48px" }}>
          <div style={{ display: "inline-block", background: "#FFE680", color: "#9a7a00", fontWeight: 700, fontSize: 14, padding: "7px 16px", borderRadius: 999, marginBottom: 18 }}>常見問題</div>
          <h2 className="lc-h2" style={{ fontFamily: "var(--font-baloo), var(--font-noto), sans-serif", fontWeight: 800, fontSize: 46, color: "#1A1A1A", margin: 0 }}>你可能想問</h2>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {faqs.map((f, idx) => {
            const isOpen = open === idx;
            return (
              <div key={f.q} className="lc-reveal" style={{ background: "#fff", border: "2px solid #f0e6c0", borderRadius: 18, overflow: "hidden" }}>
                <button
                  className="lc-faq-q"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? -1 : idx)}
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "22px 26px", cursor: "pointer", background: "transparent", border: "none", textAlign: "left", font: "inherit" }}
                >
                  <span style={{ fontWeight: 700, fontSize: 18, color: "#1A1A1A" }}>{f.q}</span>
                  <span style={{ flexShrink: 0, width: 32, height: 32, borderRadius: "50%", background: "#FFCE00", color: "#1A1A1A", fontWeight: 800, fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center", transform: `rotate(${isOpen ? "45deg" : "0deg"})`, transition: "transform .3s ease" }}>+</span>
                </button>
                <div style={{ maxHeight: isOpen ? 240 : 0, overflow: "hidden", transition: "max-height .3s ease" }}>
                  <p style={{ fontSize: 16, color: "#777", lineHeight: 1.75, margin: 0, padding: "0 26px 24px" }}>{f.a}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
