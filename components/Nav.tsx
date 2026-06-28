"use client";

import { useState, useEffect } from "react";
import Logo from "./Logo";
import CurrentLine from "./CurrentLine";
import { navLinks, site } from "@/content/site";

export default function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 70,
        background: scrolled ? "rgba(255,206,0,.98)" : "rgba(255,206,0,.96)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        borderBottom: "3px solid #1A1A1A",
        boxShadow: scrolled ? "0 8px 24px rgba(26,26,26,.22)" : "0 0 0 rgba(0,0,0,0)",
        transition: "box-shadow .3s ease, background .3s ease",
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
          padding: scrolled ? "9px 32px" : "16px 32px",
          transition: "padding .3s ease",
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
          aria-label={open ? "關閉選單" : "開啟選單"}
          aria-expanded={open}
          className="lc-nav-toggle"
          onClick={() => setOpen((v) => !v)}
          style={{
            alignItems: "center",
            justifyContent: "center",
            width: 44,
            height: 44,
            borderRadius: 12,
            border: "none",
            background: "#1A1A1A",
            cursor: "pointer",
            padding: 0,
          }}
        >
          <span style={{ position: "relative", display: "block", width: 22, height: 16 }}>
            {[0, 1, 2].map((i) => {
              const base: React.CSSProperties = {
                position: "absolute",
                left: 0,
                width: 22,
                height: 2.5,
                borderRadius: 2,
                background: "#FFCE00",
                transition: "transform .25s ease, opacity .2s ease, top .25s ease",
              };
              const closedTop = [0, 6.75, 13.5][i];
              if (open) {
                if (i === 1) return <span key={i} style={{ ...base, top: 6.75, opacity: 0 }} />;
                return <span key={i} style={{ ...base, top: 6.75, transform: `rotate(${i === 0 ? 45 : -45}deg)` }} />;
              }
              return <span key={i} style={{ ...base, top: closedTop }} />;
            })}
          </span>
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
            className="lc-nav-cta lc-zap"
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

      {/* 招牌底部電流線：亮光持續由左往右流過 */}
      <CurrentLine
        height={3}
        baseColor="transparent"
        glow="rgba(255,255,255,.9)"
        duration={3}
        style={{ position: "absolute", left: 0, right: 0, bottom: -3, zIndex: 1 }}
      />
    </header>
  );
}
