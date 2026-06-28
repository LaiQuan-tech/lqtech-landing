"use client";

import { useEffect } from "react";

// 滾動進場動畫：所有 .lc-reveal 進入視窗時加上 .lc-in，
// 同容器內元素依序錯開 delay（對應設計稿 IntersectionObserver 行為）。
export default function Reveal() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      document.querySelectorAll(".lc-reveal").forEach((el) => el.classList.add("lc-in"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const target = e.target as HTMLElement;
            const els = Array.from(target.parentElement?.querySelectorAll(".lc-reveal") || []);
            target.style.animationDelay = Math.min(els.indexOf(target), 6) * 0.08 + "s";
            target.classList.add("lc-in");
            io.unobserve(target);
          }
        });
      },
      { threshold: 0.12 }
    );

    const t = setTimeout(() => {
      document.querySelectorAll(".lc-reveal").forEach((el) => io.observe(el));
    }, 60);

    return () => {
      clearTimeout(t);
      io.disconnect();
    };
  }, []);

  return null;
}
