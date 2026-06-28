# 交接文件：萊乾資訊 官方網站

> 給接手的開發者（或 Claude Code）：這份 README 力求自給自足。沒有參與前期設計討論的人，也應該能只憑這份文件把網站重建出來並部署上線。

---

## 1. 專案概觀

萊乾資訊是一間**接案開發公司**，提供企業形象官網、網頁應用程式（Web App）、品牌設計 / UI/UX。本網站是公司的**官方形象網站 + 名單蒐集（lead-gen）網站**，目標是：

1. 展示公司專業、技術與開發流程，建立信任。
2. 透過**作品案例**與**客戶評價**增加說服力。
3. 透過**聯絡表單**與 **LINE 官方帳號**蒐集潛在客戶詢問。

品牌識別色為**皮卡丘黃 `#FFCE00`**，搭配近黑 `#1A1A1A`，視覺主題母題為**閃電 ⚡**（呼應「通電上線」的品牌語彙）。整體調性活潑、明亮、有活力。

> ⚠️ 版權注意：品牌靈感來自皮卡丘，但**不得**在實作中使用任何寶可夢／皮卡丘的官方圖像、角色造型或商標。只沿用「明亮黃色 + 閃電符號」這類通用視覺元素。

---

## 2. 關於設計檔（重要）

本包內 `design/` 資料夾中的 `.dc.html` 檔案是**用 HTML 製作的設計參考稿（prototype）**，用來呈現「預期的外觀與行為」，**不是**可以直接搬上線的生產程式碼。

- 它們使用一套自訂的輕量 runtime（`support.js`，內含 `<x-dc>`、`<sc-for>`、`<sc-if>` 等自訂標籤），**請勿**把這套 runtime 帶進正式專案。
- 你的任務是：**用目標技術棧（見下方）的慣用寫法，把這些設計重建出來** —— 像素級還原視覺，但用該框架的元件、路由與資料層。
- 直接在瀏覽器打開 `design/萊乾資訊官網.dc.html` 即可預覽完整設計（需連網載入 Google Fonts）。

### 如何檢視設計稿
用瀏覽器開啟 `design/萊乾資訊官網.dc.html`。`Hero 方向探索.dc.html` 是三個首頁主視覺方向的探索稿，**最終採用「方向 A — 滿版電力黃」**，已落實在主檔中，保留僅供參考。

---

## 3. 保真度（Fidelity）

**高保真（hi-fi）。** 設計稿已含最終配色、字體、間距、圓角、陰影與互動。請**像素級還原** UI，並用正式專案的元件庫與模式去實作。下方〈設計 Token〉與〈畫面與區塊〉提供精確數值。

---

## 4. 建議技術棧與部署架構

使用者指定要部署在 **Vercel、GitHub、Supabase、Railway** 上。完整設定請見同資料夾的 **`DEPLOYMENT.md`**。摘要：

| 角色 | 服務 | 說明 |
|---|---|---|
| 原始碼託管 | **GitHub** | 單一 repo，main 分支自動觸發部署 |
| 前端 / SSR | **Vercel** | 部署 **Next.js（App Router）** 前台官網 |
| 資料庫 / 表單儲存 / 後台 | **Supabase** | Postgres 存放聯絡表單名單；可用 Supabase Auth 做簡易後台登入 |
| 背景服務 / Worker（選用） | **Railway** | 跑通知 worker（如把新名單轉發到 Email / LINE Notify / Slack），或排程任務 |

> 建議框架：**Next.js 14+（App Router）+ TypeScript + Tailwind CSS**。設計稿的 class hover 行為與 inline style 都很容易對應到 Tailwind utility。若團隊已有既定框架，依既有慣例即可。

---

## 5. 畫面與區塊（單頁式 Landing Page）

整站是**單頁、錨點導航（anchor scroll）**結構，由上而下：Nav → Hero → Trust Strip → 服務 → 作品 → 流程 → 評價 → FAQ → 聯絡 → Footer。外加兩個浮動層：可點擊泡泡、LINE 浮動鈕。

頁面最大內容寬度：`max-width: 1200px`，左右 padding `32px`，置中。

### 5.1 導覽列 Nav（sticky）
- **位置**：`position: sticky; top: 0; z-index: 70`。
- **背景**：`rgba(255,206,0,.96)` + `backdrop-filter: blur(6px)`；底部 `3px solid #1A1A1A`。
- **左側 Logo**：42×42 黑色圓角方塊（`border-radius:12px`）內含一個黃色閃電符號；右接公司名「萊乾資訊」，字體 Baloo 2 / 800 / 24px / `#1A1A1A`。
- **右側選單**：服務、作品、流程、評價、FAQ（500 / 16px，hover 變 `#9a7a00`），最右為 CTA 鈕「免費諮詢」= 黑底 `#1A1A1A` / 黃字 `#FFCE00` / `border-radius:999px` / padding `11px 22px`。hover 上移 2px + 陰影。
- 所有連結為頁內錨點（`#services`、`#works`、`#process`、`#reviews`、`#faq`、`#contact`、`#top`）。

### 5.2 Hero
- **背景**：滿版 `#FFCE00`。底部用一個 `clip-path` 斜切色塊過渡到下一區的米白 `#FFFBEC`。
- **裝飾**：多個半透明白色圓泡 + 兩個重疊的大型閃電 `clip-path` 形狀（黑 + 半透明白），皆套用上下漂浮動畫 `lc-floaty`（見動畫段）。
- **內容**（max-width 680px，左對齊）：
  - 小標籤 pill：黑底黃字「⚡ 企業官網 · Web App · 品牌 UI/UX」。
  - H1：「把好點子／通電上線」，Baloo 2 / 800 / **84px** / line-height 1.06 / `#1A1A1A`。
  - 副標：22px / 500 / `#3a3000` / line-height 1.7。
  - 兩顆 CTA：主鈕黑底白字「免費聊聊你的專案 →」（連 `#contact`）；次鈕白底黑字黑框「看作品案例」（連 `#works`）。皆 `border-radius:999px`、padding `18px 36px`。
  - 數據列（gap 46px）：**50+** 完成專案 ／ **98%** 客戶回購率 ／ **6 年** 開發經驗。數字 Baloo 2 / 800 / 38px。

### 5.3 Trust Strip（技術 / 夥伴）
- 背景 `#FFFBEC`，置中一行：灰字「合作夥伴與技術夥伴」+ 一排白底圓角 pill：**React、Next.js、Node.js、TypeScript、Figma、AWS、Flutter**。

### 5.4 服務 Services（`#services`）
- 背景 `#FFFBEC`，padding `90px 32px 80px`。
- 置中標題區：pill「我們的服務」（`#FFE680` 底 / `#9a7a00` 字）+ H2「一站搞定，從想法到上線」（Baloo 2 / 800 / 46px）+ 副標 18px / `#777`。
- **3 欄卡片** grid（`gap:26px`）。每張卡：白底、`2px solid #f0e6c0` 框、`border-radius:24px`、padding `38px 32px`、底部立體陰影 `0 4px 0 #f0e6c0`。hover：上移 8px + 大陰影（`.lc-card`）。
  - 卡頭：64×64 黃色圓角方塊（`border-radius:18px`）內放 emoji 圖示。
  - 卡標題：Baloo 2 / 700 / 24px。描述 16px / `#777`。
  - 重點列：每行「⚡ + 文字」。
- 三張卡內容：
  1. 🏢 **企業形象官網** — 把品牌故事說清楚，讓客戶一眼就信任你。｜客製視覺設計、RWD 響應式、SEO 基礎優化
  2. ⚙️ **網頁應用程式** — 從會員系統到後台儀表板，複雜功能也穩穩接好。｜前後端整合、資料庫設計、第三方串接
  3. 🎨 **品牌設計 · UI/UX** — 從 0 到 1 規劃介面與體驗，好看也好用。｜使用者流程、互動原型、設計系統

### 5.5 作品案例 Works（`#works`）
- **深色區**：背景 `#1A1A1A`，padding `90px 32px`。
- 標題區同上但白字；pill 為黃底黑字「作品案例」。H2「我們做過的好東西」。副標 `#bbb`，註明「圖片為示意佔位」。
- **3 欄卡片** grid（共 6 張）。每張卡：`#262626` 底、`border-radius:24px`、`overflow:hidden`、陰影 `0 8px 0 rgba(0,0,0,.3)`。hover 上移 10px；卡內圖片 `scale(1.06)`（`.lc-work` / `.lc-work-img`）。
  - 圖片區：200px 高，目前用 `linear-gradient` 漸層 + 置中大 emoji 當**佔位圖**（待換成真實截圖）。左上角 pill 標籤（黑底黃字，如「電商」「官網」「Web App」）。
  - 卡身：標題 Baloo 2 / 700 / 21px 白字；描述 15px / `#aaa`；底部技術標籤 pill（黃色半透明 `rgba(255,206,0,.14)` 底 / `#FFCE00` 字）。
- 六個案例（皆為示意，待換真實內容）：
  1. 🛒 電商 — **鮮選市集電商平台** — 生鮮電商，含金流、物流與會員點數系統。｜Next.js, Stripe, PostgreSQL
  2. 🏨 官網 — **礁溪溫泉會館官網** — 訂房導流與品牌形象，上線後詢問量翻倍。｜React, CMS, SEO
  3. 📊 Web App — **業績戰情儀表板** — 即時銷售數據視覺化，主管決策一目了然。｜TypeScript, D3.js, Node
  4. 💪 Web App — **健身房預約系統** — 教練排課、會員預約與扣點一站搞定。｜React, Firebase, RWD
  5. 🎓 平台 — **線上課程學習平台** — 影音課程、測驗與證書，支援萬人併發。｜Next.js, AWS, Video
  6. 🍰 品牌 — **甜點品牌識別 · 官網** — 完整品牌視覺 + 線上訂購，質感大升級。｜Figma, UI/UX, Webflow

### 5.6 開發流程 Process（`#process`）
- 背景 `#FFFBEC`。標題「透明的五步驟，全程不斷電」。
- **5 欄** grid。每格白卡（`2px solid #f0e6c0` / `border-radius:20px` / 置中）。頂部 54×54 黃色圓角方塊放序號（Baloo 2 / 800 / 24px）。hover 時序號方塊翻黑底黃字 + 旋轉放大（`.lc-step-num`）。
- 五步：**01 需求訪談**（深入了解目標、客群與痛點）→ **02 規劃報價**（方案、時程與透明報價）→ **03 設計原型**（UI/UX 與可點擊互動原型）→ **04 開發測試**（敏捷開發，分階段交付驗收）→ **05 上線維運**（順利上線並持續優化）。

### 5.7 客戶評價 Reviews（`#reviews`）
- 背景 `#FFF6CF`（淺黃）。pill 黑底黃字「客戶評價」+ H2「客戶怎麼說」。
- **3 欄卡片**：白底、`border-radius:24px`、padding `34px 30px`、陰影 `0 6px 0 rgba(255,206,0,.5)`。
  - 頂部五顆星 `★★★★★`（`#FFCE00`）。引言 17px / 500 / `#333`。
  - 底部作者列：48×48 圓形頭像（純色底 + 姓氏首字）+ 姓名（700 / 16px）+ 職稱（13px / `#999`）。
- 三則（示意）：陳先生（鮮選市集 創辦人）、林小姐（溫泉會館 行銷總監）、黃經理（上市集團 IT 部門）。引言全文見設計稿 logic。

### 5.8 FAQ（`#faq`）
- 背景 `#FFFBEC`，max-width 820px。H2「你可能想問」。
- **手風琴（accordion）**：每題白卡（`2px solid #f0e6c0` / `border-radius:18px`）。問題列 padding `22px 26px`，可點擊；右側 32×32 黃色圓形「+」號，展開時旋轉 45°（變 ×）。答案區用 `max-height` 過渡展開（0 ↔ 240px，transition `.3s ease`）。一次只展開一題。hover 問題列底色變 `#FFF6CF`。
- 五題（問題＋答案全文見設計稿 logic `faqData`）：預算、時程、沒有設計稿可否做、上線後維護、合約與發票。

### 5.9 聯絡 Contact（`#contact`）
- **深色區** `#1A1A1A`，padding `90px 32px`。兩欄 grid（`1fr 1.1fr`，gap 60px）。
- **左欄**：pill 黃底「免費諮詢」+ H2「準備好讓生意／**通電**了嗎？」（通電兩字 `#FFCE00`）+ 說明 `#bbb`。下方綠色 LINE 大鈕（`#06C755` 底）「加 LINE 立即諮詢」。再下方三行聯絡資訊：✉️ Email、📞 電話、📍 地址（**目前皆為示意值，需替換**）。
- **右欄表單卡**：白底、`border-radius:28px`、padding `38px 36px`、大陰影。欄位：
  - 姓名*（必填）、公司／品牌（選填）── 兩欄並排
  - Email*（必填，需含 `@` 與 `.`）、電話／LINE ID（選填）── 兩欄並排
  - 需求類型：四顆可單選的 chip（企業官網 / Web App / 品牌 UI/UX / 其他）；選中變黃底。
  - 專案簡述*（必填，textarea，4 行）
  - 錯誤提示列（紅底）：必填未填或 Email 格式錯誤時顯示。
  - 送出鈕：黃底黑字「送出諮詢 ⚡」，底部立體陰影 `0 6px 0 #cca600`。
  - 送出成功 → 整張卡換成成功狀態：黃色圓形 ⚡（脈動動畫）+「收到囉！」+ 感謝文（帶入姓名）+「再填一筆」按鈕。
  - 欄位 focus：邊框變黃 + `0 0 0 4px rgba(255,206,0,.25)` 外光暈。
- 表單欄位樣式：padding `13px 15px`、`2px solid #eadfb8` 框、`border-radius:12px`、底色 `#FFFEF8`。

### 5.10 Footer
- 背景 `#111`，padding `46px 32px 38px`。一行三段：Logo + 公司名 ／ slogan「把好點子通電上線 ⚡ 企業官網 · Web App · 品牌 UI/UX」／ 版權「© 2026 萊乾資訊 LaiChien Information.」。

### 5.11 浮動層
- **可點擊泡泡**：6 顆泡泡從畫面底部緩緩上升（`lc-bubrise`，13–17s 不等、各有 delay），內含 ⚡ / 💬 / ✨ 符號，黃色或 LINE 綠。**點擊任一泡泡 → 開啟 LINE 連結**（新分頁）。`pointer-events` 僅泡泡本身可點，容器穿透。
- **LINE 浮動鈕**：右下角固定（`right:26px; bottom:26px; z-index:80`）。66×66 綠色圓鈕「LINE」（脈動動畫）+ 下方「點我諮詢」小標。hover 放大旋轉。連 LINE 連結。

---

## 6. 互動與行為

- **錨點平滑捲動**：`html { scroll-behavior: smooth }`，所有 nav 與 CTA 用 `#id` 連結。
- **滾動進場動畫**：所有 `.lc-reveal` 元素初始 `opacity:0`，進入視窗（IntersectionObserver，threshold 0.12）時加 `.lc-in`，播放 `lc-rise`（位移 40px → 0、淡入，`.7s cubic-bezier(.2,.7,.3,1)`）。同一容器內元素依序錯開 delay（每個 +0.08s，最多 6 個）。
  - → 在 React 中可用 `react-intersection-observer` 或自寫 hook + framer-motion 重現。
- **hover 狀態**（皆已在設計稿 class 定義）：按鈕上移／變色、卡片上移＋陰影、作品圖放大、流程序號翻色旋轉、連結變色。
- **FAQ 手風琴**：點擊切換，一次一題，`max-height` 過渡，「+」旋轉成「×」。
- **表單驗證**：姓名、Email、專案簡述為必填；Email 需符合 `/.+@.+\..+/`。未過 → 顯示紅色錯誤列。通過 → 切換到成功畫面。
  - → 正式實作請改為**真正送出到 Supabase**（見 DEPLOYMENT.md），而非只切換前端狀態。
- **需求類型 chip**：單選 toggle（再點一次可取消）。

### 動畫一覽（keyframes，皆在設計稿 `<style>` 中）
| 名稱 | 效果 | 用途 |
|---|---|---|
| `lc-floaty` / `lc-floaty2` | 上下漂浮 ±16–18px | Hero 泡泡、閃電、裝飾圓 |
| `lc-pulse` | scale 1 ↔ 1.08 | LINE 鈕、成功 ⚡ |
| `lc-rise` | 位移＋淡入 | 滾動進場 |
| `lc-bubrise` | 由下往上升 680px + 淡出 | 可點擊泡泡 |

---

## 7. 狀態管理（前端）

設計稿用的狀態（請對應到正式框架的 state）：
- `fName, fCompany, fEmail, fPhone, fMsg`：表單欄位值。
- `need`：選中的需求類型 chip（字串，可為空）。
- `sent` / `sentName`：是否已送出、送出時的姓名（用於成功畫面）。
- `showError`：是否顯示驗證錯誤。
- `openFaq`：目前展開的 FAQ index（-1 表全收合）。

**正式版需新增**：送出時的 loading 狀態、API 失敗的 error 狀態、（後台）名單列表的資料抓取狀態。

---

## 8. 設計 Token

### 顏色
| 用途 | Hex |
|---|---|
| 品牌主色（皮卡丘黃） | `#FFCE00` |
| 淺黃 pill 底 | `#FFE680` |
| 區塊淺黃底 | `#FFF6CF` |
| 頁面米白底 | `#FFFBEC` |
| 表單欄位底 | `#FFFEF8` |
| 近黑（文字 / 深色區） | `#1A1A1A` |
| Footer 黑 | `#111` |
| 黃色文字（深色底上） | `#9a7a00` |
| 深色區副標灰 | `#bbb` / `#aaa` |
| 一般副標灰 | `#777` / `#888` |
| 卡片邊框 | `#f0e6c0` / `#eadfb8` |
| 立體陰影黃 | `#cca600`（送出鈕） |
| LINE 綠 | `#06C755` |
| 錯誤紅 | `#C0392B`（底 `#FFF0F0`） |

### 字型
- **標題 / 數字**：`'Baloo 2'`（Google Fonts，weight 500–800）。圓潤活潑，呼應品牌調性。
- **內文**：`'Noto Sans TC'`（weight 400/500/700/900）。
- 載入：`https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=Noto+Sans+TC:wght@400;500;700;900&display=swap`
- H1 84px / H2 46px / 卡標 21–24px / 內文 16–22px / 小標籤 14px。

### 圓角
- 卡片 `24px`、表單卡 `28px`、流程卡 `20px`、FAQ `18px`、欄位 `12px`、圖示方塊 `12–18px`、pill / 圓鈕 `999px`。

### 陰影
- 卡片立體底陰影 `0 4px 0 #f0e6c0`、作品 `0 8px 0 rgba(0,0,0,.3)`、評價 `0 6px 0 rgba(255,206,0,.5)`、送出鈕 `0 6px 0 #cca600`。
- hover 浮起：`0 22px 50px rgba(26,26,26,.16)`（卡片）、`0 26px 60px rgba(26,26,26,.22)`（作品）。
- 表單卡 / LINE 鈕：`0 20px 60px rgba(0,0,0,.4)` / `0 10px 28px rgba(6,199,85,.5)`。

### 閃電 clip-path
母題形狀統一使用：
```css
clip-path: polygon(58% 0, 18% 52%, 46% 52%, 30% 100%, 82% 40%, 52% 40%);
```

---

## 9. 素材 Assets

- **目前無真實圖片**。作品案例與裝飾皆用 CSS 漸層 + emoji 佔位。上線前需：
  - 作品案例 6 張**真實截圖**（建議 ≥ 800px 寬，比例約 16:10）。
  - 客戶頭像（選用，目前用姓氏首字）。
  - Logo：目前以 CSS 繪製（黑圓角方塊 + 黃閃電）。如有正式 logo SVG 請替換。
- Email、電話、地址、LINE @ID **皆為示意值**，需替換為真實資訊。
  - LINE 連結目前：`https://line.me/R/ti/p/@laichien` → 換成真實官方帳號 ID。

---

## 10. 檔案清單

`design/` 資料夾：
- `萊乾資訊官網.dc.html` — **最終完整設計稿**（採方向 A）。直接用瀏覽器開啟即可預覽。
- `Hero 方向探索.dc.html` — 三個首頁主視覺探索方向（僅參考，最終採方向 A）。
- `support.js` — 設計稿用的自訂 runtime。**僅供預覽，請勿帶入正式專案。**

同層文件：
- `README.md` — 本文件（設計規格）。
- `DEPLOYMENT.md` — 部署架構與 Vercel / GitHub / Supabase / Railway 設定步驟、Supabase schema、聯絡表單串接範例。
