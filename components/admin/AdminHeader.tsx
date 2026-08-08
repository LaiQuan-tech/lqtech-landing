"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import Logo from "@/components/Logo";

const NAV = [
  { href: "/admin", label: "總覽" },
  { href: "/admin/inquiries", label: "諮詢紀錄" },
  { href: "/admin/cases", label: "案件管理" },
  { href: "/admin/board", label: "看板" },
  { href: "/admin/quotes", label: "報價單" },
  { href: "/admin/settings", label: "設定" },
] as const;

/**
 * 後台固定導覽（當前頁加粗變藍）。
 * 版面全部走 CSS（globals.css 的 .gt-adminnav-*），因為要用 media query 切兩種形態：
 *   桌機 ≥769px → 左側固定側欄；窄螢幕 ≤768px → 頂部橫列、連結可橫捲。
 * 內容區的讓位由 .gt-admin-shell 對應處理，改側欄寬度要同步改該處。
 */
export default function AdminHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  // /admin 只在完全相符時 active；其餘用 startsWith 讓子路徑也 active
  function isActive(href: string) {
    return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
  }

  async function logout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch("/api/admin/login", { method: "DELETE" });
    } catch {
      /* 即使登出請求失敗，仍導回登入頁 */
    }
    router.replace("/admin/login");
  }

  return (
    <nav className="gt-adminnav">
      {/* 頂（桌機）／左（手機）：logo + 後台標示 */}
      <Link href="/admin" className="gt-adminnav-brand">
        <Logo size={26} radius={7} />
        <span className="gt-adminnav-brand-title">後台</span>
        <span className="gt-adminnav-brand-sub">萊乾資訊</span>
      </Link>

      {/* 導覽 + 登出（登出在桌機貼側欄底部、窄螢幕跟著連結橫捲）*/}
      <div className="gt-adminnav-links">
        {NAV.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={active ? "gt-admin-navlink is-active" : "gt-admin-navlink"}
              aria-current={active ? "page" : undefined}
            >
              {item.label}
            </Link>
          );
        })}
        <button onClick={logout} disabled={loggingOut} className="gt-adminnav-logout">
          登出
        </button>
      </div>
    </nav>
  );
}
