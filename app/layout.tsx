import type { Metadata, Viewport } from "next";
import { Baloo_2, Noto_Sans_TC } from "next/font/google";
import { site } from "@/content/site";
import "./globals.css";

const baloo = Baloo_2({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-baloo",
  display: "swap",
});

const noto = Noto_Sans_TC({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-noto",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://lqtech-landing.vercel.app"),
  title: "萊乾資訊 LaiChien｜把好點子通電上線 ⚡ 企業官網 · Web App · 品牌 UI/UX",
  description:
    "萊乾資訊是一間接案開發公司，替中小企業到大型團隊打造會發光的數位產品。企業形象官網、網頁應用程式、品牌設計 UI/UX，從設計到開發一條龍。",
  keywords: ["接案開發", "企業官網", "Web App", "品牌設計", "UI/UX", "網站開發", "萊乾資訊"],
  openGraph: {
    title: "萊乾資訊 LaiChien｜把好點子通電上線 ⚡",
    description:
      "企業形象官網、網頁應用程式、品牌設計 UI/UX，從設計到開發一條龍，讓你的生意閃電起步。",
    type: "website",
    locale: "zh_TW",
    siteName: site.name,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#FFCE00",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant">
      <body className={`${baloo.variable} ${noto.variable}`}>{children}</body>
    </html>
  );
}
