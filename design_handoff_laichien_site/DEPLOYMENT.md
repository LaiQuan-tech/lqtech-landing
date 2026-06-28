# 部署與架構：萊乾資訊官網

技術棧：**Next.js（App Router）+ TypeScript + Tailwind CSS**，部署於 **Vercel / GitHub / Supabase / Railway**。

---

## 1. 架構總覽

```
                         ┌─────────────────────────┐
   訪客瀏覽器  ──────────▶│  Vercel (Next.js 前台)   │
                         │  - SSR/SSG 官網頁面       │
                         │  - /api 或 Server Action  │
                         └───────────┬─────────────┘
                                     │ insert 名單
                                     ▼
                         ┌─────────────────────────┐
                         │  Supabase (Postgres)     │
                         │  - leads 資料表           │
                         │  - Auth（後台登入，選用）  │
                         │  - Row Level Security     │
                         └───────────┬─────────────┘
                                     │ Webhook / 輪詢
                                     ▼
                         ┌─────────────────────────┐
                         │  Railway (Worker，選用)   │
                         │  - 新名單通知             │
                         │    (Email / LINE / Slack) │
                         │  - 排程任務               │
                         └─────────────────────────┘

   原始碼：GitHub repo（main → Vercel 自動部署；Railway 連同 repo 部署 worker）
```

職責分配：
- **GitHub**：唯一原始碼來源（single source of truth）。push 到 `main` 自動觸發 Vercel（與 Railway）部署。
- **Vercel**：跑 Next.js 前台。表單送出走 **Server Action 或 Route Handler**，用 service role 寫進 Supabase。
- **Supabase**：Postgres 存名單；（選用）Auth 做後台 `/admin` 登入查名單。
- **Railway**：跑長駐 / 背景 worker（Vercel 的 serverless 不適合長駐）。例如監聽 Supabase 新名單並發通知，或跑 cron。**若初期不需要通知，可暫不啟用 Railway。**

---

## 2. 專案結構建議

```
laichien-site/
├─ app/
│  ├─ page.tsx                # 單頁官網（組合各 section）
│  ├─ layout.tsx              # 字型、metadata、全域
│  ├─ globals.css             # Tailwind + keyframes
│  ├─ actions/
│  │  └─ submit-lead.ts       # Server Action：寫入 Supabase
│  ├─ api/
│  │  └─ leads/route.ts       # （替代方案）Route Handler
│  └─ admin/                  # （選用）名單後台，需登入
│     └─ page.tsx
├─ components/
│  ├─ Nav.tsx  Hero.tsx  Services.tsx  Works.tsx
│  ├─ Process.tsx  Reviews.tsx  Faq.tsx
│  ├─ ContactForm.tsx  Footer.tsx
│  ├─ FloatingBubbles.tsx  LineFab.tsx
│  └─ Reveal.tsx             # IntersectionObserver 進場動畫包裝
├─ lib/
│  └─ supabase/
│     ├─ client.ts           # 瀏覽器端（anon key）
│     └─ server.ts           # 伺服器端（service role key）
├─ content/
│  ├─ services.ts  works.ts  steps.ts  reviews.ts  faqs.ts
│  └─ site.ts                # LINE 連結、email、電話、slogan
├─ public/works/             # 作品案例真實截圖
├─ worker/                   # （選用）Railway worker，可獨立資料夾或 repo
│  └─ index.ts
├─ .env.local                # 本地環境變數（勿進版控）
├─ .env.example              # 範本（進版控）
└─ tailwind.config.ts
```

> 設計稿中各區塊的資料（services / works / steps / reviews / faqs）都集中在 logic 的 `renderVals()`。實作時抽到 `content/*.ts`，方便日後維護而不動版面。

---

## 3. Tailwind 主題對應

把設計 token 寫進 `tailwind.config.ts`：

```ts
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#FFCE00', soft: '#FFE680', wash: '#FFF6CF', cream: '#FFFBEC' },
        ink: { DEFAULT: '#1A1A1A', black: '#111' },
        line: '#06C755',
      },
      fontFamily: {
        display: ['"Baloo 2"', 'sans-serif'],
        sans: ['"Noto Sans TC"', 'sans-serif'],
      },
      keyframes: {
        floaty: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-18px)' } },
        rise:   { from: { opacity: '0', transform: 'translateY(40px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        bubrise:{ '0%': { transform: 'translateY(0) scale(1)', opacity: '0' }, '10%': { opacity: '.7' }, '100%': { transform: 'translateY(-680px) scale(1.3)', opacity: '0' } },
        pulse2: { '0%,100%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.08)' } },
      },
      animation: {
        floaty: 'floaty 6s ease-in-out infinite',
        rise: 'rise .7s cubic-bezier(.2,.7,.3,1) forwards',
        pulse2: 'pulse2 2.6s ease-in-out infinite',
      },
    },
  },
}
```

字型用 `next/font/google` 載入 Baloo 2 與 Noto Sans TC。

---

## 4. Supabase 設定

### 4.1 建立專案
1. 在 [supabase.com](https://supabase.com) 建立新專案，記下 **Project URL**、**anon key**、**service_role key**。
2. SQL Editor 執行下方 schema。

### 4.2 資料表 schema
```sql
-- 聯絡表單名單
create table public.leads (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  company     text,
  email       text not null,
  phone       text,
  need_type   text,              -- 企業官網 / Web App / 品牌 UI/UX / 其他
  message     text not null,
  source      text default 'website',
  status      text default 'new',-- new / contacted / closed
  created_at  timestamptz default now()
);

alter table public.leads enable row level security;

-- 不開放匿名直接讀寫；寫入一律經由伺服器端 service_role（繞過 RLS）。
-- 若要讓前端用 anon key 直接 insert，可改為下列 policy（較不建議）：
-- create policy "anon can insert leads" on public.leads
--   for insert to anon with check (true);
```

> **建議做法**：表單送出走 **Server Action**，在伺服器端用 `service_role` key 寫入（繞過 RLS，最安全，key 不外洩）。RLS 維持關閉對外，後台讀取再用 Auth 控管。

### 4.3 （選用）後台 Auth
- 用 Supabase Auth（Email 登入或 Magic Link）保護 `/admin`。
- 加一條 policy 只允許登入者讀取：
```sql
create policy "authenticated can read leads" on public.leads
  for select to authenticated using (true);
```

---

## 5. 環境變數

`.env.example`（提交到 repo，**不放真實值**）：
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...           # 前端可用（受 RLS 限制）
SUPABASE_SERVICE_ROLE_KEY=eyJ...               # 僅伺服器端，切勿暴露給瀏覽器

# 站台設定
NEXT_PUBLIC_LINE_URL=https://line.me/R/ti/p/@你的官方帳號ID
NEXT_PUBLIC_CONTACT_EMAIL=hello@laichien.tw
NEXT_PUBLIC_CONTACT_PHONE=02-1234-5678

# （選用）Worker 通知
LINE_NOTIFY_TOKEN=
SLACK_WEBHOOK_URL=
```

- **Vercel**：在 Project → Settings → Environment Variables 設定同樣的變數（`SUPABASE_SERVICE_ROLE_KEY` 只給 Production/Preview，**不要**加 `NEXT_PUBLIC_` 前綴，否則會被打包進前端）。
- **Railway**：worker 服務也在 Variables 設定 Supabase URL / service_role / 通知 token。

---

## 6. 表單串接（核心）

### 6.1 伺服器端 Supabase client
```ts
// lib/supabase/server.ts
import { createClient } from '@supabase/supabase-js';

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,    // 僅伺服器端
  { auth: { persistSession: false } }
);
```

### 6.2 Server Action
```ts
// app/actions/submit-lead.ts
'use server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function submitLead(form: {
  name: string; company?: string; email: string;
  phone?: string; needType?: string; message: string;
}) {
  // 後端再驗一次
  if (!form.name?.trim() || !/.+@.+\..+/.test(form.email) || !form.message?.trim()) {
    return { ok: false, error: '必填欄位不完整' };
  }
  const { error } = await supabaseAdmin.from('leads').insert({
    name: form.name.trim(),
    company: form.company?.trim() || null,
    email: form.email.trim(),
    phone: form.phone?.trim() || null,
    need_type: form.needType || null,
    message: form.message.trim(),
  });
  if (error) return { ok: false, error: '送出失敗，請稍後再試或用 LINE 聯繫' };
  return { ok: true };
}
```

### 6.3 表單元件（要點）
- 沿用設計稿的驗證規則（姓名 / Email / 專案簡述必填、Email 格式）。
- 加入 **loading** 與 **error** 狀態（設計稿只有前端切換，正式版要等 API 回應）。
- 成功後切到「收到囉！」成功畫面（帶入姓名）。
- 需求類型 chip 對應 `need_type` 欄位。

---

## 7. （選用）Railway 通知 Worker

Vercel serverless 不適合長駐；新名單通知建議放 Railway。兩種做法：

1. **Supabase Database Webhook**（推薦）：在 Supabase 設定 `leads` 表 `INSERT` 觸發 webhook，打到 Railway worker 暴露的 HTTP endpoint → 由 worker 發 LINE Notify / Slack / Email。
2. **Worker 輪詢**：worker 定期查 `status = 'new'` 的名單並通知後標記。

Railway 部署：連結同一 GitHub repo（指定 `worker/` 為 root 或獨立 repo）→ 設定 start command（如 `node dist/index.js`）→ 設環境變數。

> 初期沒有通知需求，可先跳過 Railway，只靠 Supabase 後台或 `/admin` 看名單；之後再加。

---

## 8. 部署流程（首次）

1. **GitHub**：`git init` → 建 repo → push。確認 `.env.local` 在 `.gitignore`。
2. **Supabase**：建專案 → 跑 schema（§4.2）→ 複製三組 key。
3. **Vercel**：Import GitHub repo → 框架選 Next.js → 填環境變數（§5）→ Deploy。之後每次 push `main` 自動部署。
4. **Railway（選用）**：New Project → Deploy from GitHub → 指向 worker → 填環境變數。
5. **網域**：Vercel 綁定自訂網域（如 `laichien.tw`），DNS 指到 Vercel。
6. **驗收**：表單實際送出一筆 → 確認 Supabase `leads` 有資料 →（若啟用）收到通知。

---

## 9. 上線前檢查清單

- [ ] 把示意聯絡資訊換成真實：LINE @ID、Email、電話、地址。
- [ ] 換上 6 張真實作品截圖與正確案例文案（放 `public/works/`）。
- [ ] 確認客戶評價內容已獲當事人同意，或改為真實可公開的評價。
- [ ] 表單實測能寫入 Supabase；`service_role` key 未外洩到前端 bundle。
- [ ] RWD 響應式：手機 / 平板 / 桌機三斷點檢查（設計稿以桌機為主，需補手機版排版）。
- [ ] SEO：`metadata`（title、description、OG image）、`sitemap.xml`、`robots.txt`。
- [ ] 無障礙：表單 label、按鈕對比、`prefers-reduced-motion` 時關閉漂浮 / 進場動畫。
- [ ] 隱私：表單下方同意聲明，必要時加隱私權政策頁。
- [ ] 分析：接 GA4 / Vercel Analytics 追蹤 CTA 與表單轉換。

---

## 10. RWD 提醒

設計稿是 1280px 桌機視角，多處用固定 grid 欄數與大字級。手機版需處理：
- Nav 收成漢堡選單。
- Hero H1 由 84px 降到約 40–48px；數據列改直排或縮小。
- 服務 / 評價 3 欄 → 1 欄；作品 3 欄 → 1 欄；流程 5 欄 → 橫向捲動或 2 欄。
- 聯絡兩欄 → 上下堆疊。
- 漂浮泡泡在小螢幕可減量，避免遮擋內容。
