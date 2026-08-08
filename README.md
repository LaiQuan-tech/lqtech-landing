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
| `ADMIN_PASSWORD` / `ADMIN_SESSION_SECRET` | 後台登入密碼與 session 簽章金鑰 |
| `CRON_SECRET` | cron 端點的 Bearer 授權 |
| `GEMINI_API_KEY` | AI 客服／報價 |
| `PCHOMEPAY_*` | 金流憑證與付款方式 |
| `GITHUB_TOKEN` | 讀每案 repo 的開發進度；fine-grained PAT，Contents + Metadata 唯讀 |

## GitHub 開發進度

後台案件詳情頁會顯示該案 repo 的開發進度（百分比、分組、最近 commit）。
repo 位置取自案件的「基礎設施連結 → GitHub Repo」，進度來源優先序：
根目錄 `PROGRESS.md` → `docs/plans/` 挑檔 → 只有 commit 活動。
格式規範見 [docs/PROGRESS-format.md](docs/PROGRESS-format.md)，本專案自己的進度在 [PROGRESS.md](PROGRESS.md)。

同步時機：`/api/cron/lifecycle` 每天跑時順帶更新（過期門檻 `GITHUB_SYNC_HOURS`，預設 20 小時），
或在案件詳情頁按「重新同步」。**後台頁只讀 DB 快照，render 期間不打 GitHub。**

驗證解析結果（不需登入後台）：

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  "https://laiquan.co/api/cron/github-probe?repo=LaiQuan-tech/aster"
```

加 `&path=docs/plans/P1-progress.md` 可指定檔案、`&anon=1` 可在沒有 token 時讀公開 repo。

## 結構

```
app/            layout / page / globals.css / actions / robots / sitemap
components/     各區塊（Nav, Hero, Services, Works, Process, Reviews, Faq, Contact…）
content/        site.ts（站台設定）、data.ts（各區塊內容）
lib/supabase/   server.ts（service_role client）
design_handoff_laichien_site/  原始設計交接稿（參考）
```

## 資料庫 schema

`supabase/schema.sql` 是權威來源（含後續的 `alter table … add column if not exists`），
在 Supabase SQL Editor 執行即可；`leads` 資料表另見 `design_handoff_laichien_site/DEPLOYMENT.md` §4.2。

⚠️ 部署與 migration 不保證同時發生。`lib/adminCases.ts` 對 `github_*` 三欄有降級查詢：
欄位還沒建時後台照常運作、進度顯示「尚未同步」，跑完 alter table 後自動恢復。

## 上線前待辦

見 `design_handoff_laichien_site/DEPLOYMENT.md` §9：換真實聯絡資訊 / LINE @ID、作品截圖、評價同意、綁定自訂網域等。
