// 各區塊內容（由設計稿 renderVals() 抽出，方便維護而不動版面）。

export const services = [
  {
    icon: "🏢",
    title: "企業形象官網",
    desc: "把品牌故事說清楚，讓客戶一眼就信任你。",
    points: ["客製視覺設計", "RWD 響應式", "SEO 基礎優化"],
  },
  {
    icon: "⚙️",
    title: "網頁應用程式",
    desc: "從會員系統到後台儀表板，複雜功能也穩穩接好。",
    points: ["前後端整合", "資料庫設計", "第三方串接"],
  },
  {
    icon: "🎨",
    title: "品牌設計 · UI/UX",
    desc: "從 0 到 1 規劃介面與體驗，好看也好用。",
    points: ["使用者流程", "互動原型", "設計系統"],
  },
];

export const works = [
  { emoji: "🛒", bg: "linear-gradient(135deg,#FFE680,#FFCE00)", tag: "電商", title: "鮮選市集電商平台", desc: "生鮮電商，含金流、物流與會員點數系統。", stack: ["Next.js", "Stripe", "PostgreSQL"] },
  { emoji: "🏨", bg: "linear-gradient(135deg,#FFD9A0,#FFB347)", tag: "官網", title: "礁溪溫泉會館官網", desc: "訂房導流與品牌形象，上線後詢問量翻倍。", stack: ["React", "CMS", "SEO"] },
  { emoji: "📊", bg: "linear-gradient(135deg,#C5E8FF,#7FC4FF)", tag: "Web App", title: "業績戰情儀表板", desc: "即時銷售數據視覺化，主管決策一目了然。", stack: ["TypeScript", "D3.js", "Node"] },
  { emoji: "💪", bg: "linear-gradient(135deg,#D4F5C5,#9FE07F)", tag: "Web App", title: "健身房預約系統", desc: "教練排課、會員預約與扣點一站搞定。", stack: ["React", "Firebase", "RWD"] },
  { emoji: "🎓", bg: "linear-gradient(135deg,#E5D4FF,#B89FFF)", tag: "平台", title: "線上課程學習平台", desc: "影音課程、測驗與證書，支援萬人併發。", stack: ["Next.js", "AWS", "Video"] },
  { emoji: "🍰", bg: "linear-gradient(135deg,#FFD0D8,#FF9FB0)", tag: "品牌", title: "甜點品牌識別 · 官網", desc: "完整品牌視覺 + 線上訂購，質感大升級。", stack: ["Figma", "UI/UX", "Webflow"] },
];

export const steps = [
  { n: "01", title: "需求訪談", desc: "深入了解你的目標、客群與痛點。" },
  { n: "02", title: "規劃報價", desc: "提出方案、時程與透明報價。" },
  { n: "03", title: "設計原型", desc: "UI/UX 設計與可點擊互動原型。" },
  { n: "04", title: "開發測試", desc: "敏捷開發，分階段交付與驗收。" },
  { n: "05", title: "上線維運", desc: "順利上線並持續優化維護。" },
];

export const reviews = [
  { quote: "從溝通到交付都超順，他們是真的懂我們的生意，不是只會寫程式。", name: "陳先生", role: "鮮選市集 創辦人", initial: "陳", bg: "#FFE680" },
  { quote: "官網改版後詢問量直接翻倍，設計質感完全提升了品牌形象。", name: "林小姐", role: "溫泉會館 行銷總監", initial: "林", bg: "#FFD9A0" },
  { quote: "複雜的後台需求他們都接得住，時程也準時，大型專案放心交給他們。", name: "黃經理", role: "上市集團 IT 部門", initial: "黃", bg: "#C5E8FF" },
];

export const faqs = [
  { q: "一個專案大概要多少預算？", a: "依規模而定。形象官網從數萬元起，功能型 Web App 則視需求報價。我們會在免費諮詢後給你清楚的分項報價，不會有隱藏費用。" },
  { q: "開發時程通常多久？", a: "形象官網約 3–5 週，中型 Web App 約 6–12 週。確認需求後我們會給你一份含里程碑的時程表，過程中隨時可追蹤進度。" },
  { q: "沒有設計稿也可以做嗎？", a: "完全可以。品牌 UI/UX 就是我們的服務之一，從零開始幫你規劃視覺與互動，你只要提供想法與素材即可。" },
  { q: "上線後還有維護嗎？", a: "有的。我們提供上線後的維運與優化方案，包含主機監控、資安更新與功能迭代，讓網站持續穩定運作。" },
  { q: "可以簽合約與開發票嗎？", a: "當然。萊乾資訊為正式立案公司，所有合作皆簽訂正式合約並開立統一發票，大型企業採購流程也沒問題。" },
];

export const needTypes = ["企業官網", "Web App", "品牌 UI/UX", "其他"];

export const bubbles = [
  { left: "8%",  size: "60px", bg: "rgba(255,206,0,.85)",  border: "none",               icon: "⚡", fontSize: "26px", dur: "13s", delay: "0s" },
  { left: "26%", size: "44px", bg: "rgba(6,199,85,.9)",    border: "none",               icon: "💬", fontSize: "20px", dur: "16s", delay: "3s" },
  { left: "52%", size: "72px", bg: "rgba(255,206,0,.7)",   border: "3px solid #1A1A1A",  icon: "⚡", fontSize: "30px", dur: "15s", delay: "6s" },
  { left: "70%", size: "50px", bg: "rgba(255,255,255,.9)", border: "2px solid #FFCE00",  icon: "✨", fontSize: "22px", dur: "14s", delay: "1.5s" },
  { left: "88%", size: "56px", bg: "rgba(6,199,85,.85)",   border: "none",               icon: "💬", fontSize: "24px", dur: "17s", delay: "8s" },
  { left: "40%", size: "40px", bg: "rgba(255,206,0,.8)",   border: "none",               icon: "⚡", fontSize: "18px", dur: "12s", delay: "10s" },
];
