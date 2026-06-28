# 萊乾資訊 官方網站 — lqtech-landing

接案開發公司「萊乾資訊」的官方形象網站 + 名單蒐集（lead-gen）單頁站。
品牌色皮卡丘黃 `#FFCE00` ⚡，由設計交接稿像素級重建。

## 技術棧

- **Next.js 14（App Router）+ TypeScript**
- **Tailwind CSS**（主題 token）+ 沿用設計稿的 keyframes / hover 類別
- **Supabase**（Postgres）— 聯絡表單名單，經 Server Action 用 service_role 寫入
- 部署於 **Vercel**（push `main` 自動部署）

## 本地開發

```bash
npm install
cp .env.example .env.local   # 填入 Supabase 與站台設定
npm run dev                  # http://localhost:3000
```

## 環境變數

見 `.env.example`。重點：

| 變數 | 說明 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 專案 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key（前端） |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key，**僅伺服器端**，勿加 `NEXT_PUBLIC_` 前綴 |
| `NEXT_PUBLIC_LINE_URL` / `_CONTACT_EMAIL` / `_CONTACT_PHONE` | 站台聯絡資訊 |

## 結構

```
app/            layout / page / globals.css / actions / robots / sitemap
components/     各區塊（Nav, Hero, Services, Works, Process, Reviews, Faq, Contact…）
content/        site.ts（站台設定）、data.ts（各區塊內容）
lib/supabase/   server.ts（service_role client）
design_handoff_laichien_site/  原始設計交接稿（參考）
```

## 資料庫 schema

`leads` 資料表（已建於 Supabase；schema 見 `design_handoff_laichien_site/DEPLOYMENT.md` §4.2）。

## 上線前待辦

見 `design_handoff_laichien_site/DEPLOYMENT.md` §9：換真實聯絡資訊 / LINE @ID、作品截圖、評價同意、綁定自訂網域等。
