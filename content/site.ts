// 站台基本設定。聯絡資訊優先讀環境變數，方便部署時覆寫；未設定時用示意值。
export const site = {
  name: "萊乾資訊",
  nameEn: "LaiChien Information",
  slogan: "把好點子通電上線 ⚡ 企業官網 · Web App · 品牌 UI/UX",
  lineUrl: process.env.NEXT_PUBLIC_LINE_URL || "https://line.me/R/ti/p/@laichien",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@laichien.tw",
  phone: process.env.NEXT_PUBLIC_CONTACT_PHONE || "02-1234-5678",
  address: "台北市 · 新北市 · 全台遠端服務",
};

export const navLinks = [
  { href: "#services", label: "服務" },
  { href: "#works", label: "作品" },
  { href: "#process", label: "流程" },
  { href: "#reviews", label: "評價" },
  { href: "#faq", label: "FAQ" },
];

export const techs = ["React", "Next.js", "Node.js", "TypeScript", "Figma", "AWS", "Flutter"];
