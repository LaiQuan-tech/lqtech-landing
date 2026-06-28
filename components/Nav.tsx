"use client";

import { useState } from "react";
import Logo from "./Logo";
import { navLinks, site } from "@/content/site";

export default function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 70,
        background: "rgba(255,206,0,.96)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        borderBottom: "3px solid #1A1A1A",
      }}
    >
      <div
        style={{
          position: "relative",
          maxWidth: 1200,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 32px",
        }}
      >
        <a href="#top" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
          <Logo size={42} />
          <span
            style={{
              fontFamily: "var(--font-baloo), sans-serif",
              fontWeight: 800,
              fontSize: 24,
              color: "#1A1A1A",
              letterSpacing: ".02em",
            }}
          >
            {site.name}
          </span>
        </a>

        <button
          aria-label="開啟選單"
          className="lc-nav-toggle"
          onClick={() => setOpen((v) => !v)}
          style={{
            alignItems: "center",
            justifyContent: "center",
            width: 42,
            height: 42,
            borderRadius: 12,
            border: "2px solid #1A1A1A",
            background: "transparent",
            color: "#1A1A1A",
            fontSize: 20,
            cursor: "pointer",
          }}
        >
          {open ? "✕" : "☰"}
        </button>

        <nav
          className={`lc-nav-links${open ? " lc-nav-open" : ""}`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 30,
            fontWeight: 500,
            fontSize: 16,
            color: "#1A1A1A",
          }}
        >
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="lc-link"
              onClick={() => setOpen(false)}
              style={{ color: "#1A1A1A", textDecoration: "none" }}
            >
              {l.label}
            </a>
          ))}
          <a
            href="#contact"
            className="lc-nav-cta"
            onClick={() => setOpen(false)}
            style={{
              background: "#1A1A1A",
              color: "#FFCE00",
              padding: "11px 22px",
              borderRadius: 999,
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            免費諮詢
          </a>
        </nav>
      </div>
    </header>
  );
}
