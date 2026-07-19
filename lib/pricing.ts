// 萊乾資訊服務「價目表 / 費率卡」——AI 報價只能依此組價，不得自行發明價格。
// P2 起價目表存 DB（settings key `rate_card`，後台「系統設定」可編輯）；
// 下方 DEFAULT_RATE_CARD 為內建 fallback（DB 未設定／資料形狀不對時使用）。

import { getSetting } from "@/lib/settings";

export type RateItem = {
  key: string;
  name: string;
  unit: string; // 式 | 年 | 月 | 頁 | 次…
  price: number; // 參考價 / 起價（新台幣）
  note?: string;
};

/** 內建預設價目（萊乾資訊暫定價，後台「系統設定」可改）。DB `rate_card` 缺漏或壞資料時的 fallback。 */
export const DEFAULT_RATE_CARD: RateItem[] = [
  { key: "corporate_site", name: "企業形象官網建置", unit: "式", price: 60000, note: "RWD、5–8 頁、基本 SEO，約 3–5 週" },
  { key: "webapp_mvp", name: "Web App 開發（MVP）", unit: "式", price: 250000, note: "中型應用約 6–12 週，含需求規劃" },
  { key: "webapp_module", name: "Web App 功能模組擴充", unit: "式", price: 60000, note: "既有系統加功能，依模組估" },
  { key: "brand_uiux", name: "品牌設計 UI/UX", unit: "式", price: 80000, note: "Logo/VI/介面設計整套" },
  { key: "uiux_page", name: "介面設計（單頁）", unit: "頁", price: 8000, note: "" },
  { key: "hosting_maintenance", name: "網站代管與維護", unit: "年", price: 18000, note: "主機、資安、備份、更新" },
];

export const CURRENCY = "TWD";
export const DEFAULT_VALID_DAYS = 14;

/** 單一項目形狀檢查：{key,name,unit,price>0}（note 選填字串）。 */
function isValidRateItem(raw: unknown): raw is RateItem {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return false;
  const o = raw as Record<string, unknown>;
  return (
    typeof o.key === "string" && !!o.key.trim() &&
    typeof o.name === "string" && !!o.name.trim() &&
    typeof o.unit === "string" && !!o.unit.trim() &&
    typeof o.price === "number" && Number.isFinite(o.price) && o.price > 0 &&
    (o.note === undefined || o.note === null || typeof o.note === "string")
  );
}

/** 驗整份價目表形狀：非空陣列且每項合法 → 消毒後回傳；否則 null。 */
export function coerceRateCard(raw: unknown): RateItem[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  if (!raw.every(isValidRateItem)) return null;
  return raw.map((r) => ({
    key: r.key.trim().slice(0, 60),
    name: r.name.trim().slice(0, 100),
    unit: r.unit.trim().slice(0, 20),
    price: Math.round(r.price),
    ...(typeof r.note === "string" && r.note.trim() ? { note: r.note.trim().slice(0, 300) } : {}),
  }));
}

/**
 * 讀取價目表（settings key `rate_card`）。
 * 查無、形狀不對（非陣列／空陣列／任一項缺 key/name/unit 或 price<=0）、DB 出錯 → 一律回 DEFAULT_RATE_CARD。
 */
export async function getRateCard(): Promise<RateItem[]> {
  try {
    const raw = await getSetting<unknown>("rate_card", null);
    const coerced = coerceRateCard(raw);
    if (coerced) return coerced;
    // 有存值卻形狀不合法＝資料壞了：記 log（否則 AI 靜默用內建暫定價，難以察覺）。
    if (raw != null) console.warn("[pricing] settings.rate_card 形狀不合法，改用內建預設價目表");
    return DEFAULT_RATE_CARD;
  } catch (err) {
    console.warn("[pricing] getRateCard 讀取失敗，改用內建預設價目表:", err);
    return DEFAULT_RATE_CARD;
  }
}

/** 給 Gemini prompt 用的文字版價目表。 */
export function rateCardText(items: RateItem[]): string {
  return items
    .map((r) => `- ${r.name}（單位：${r.unit}，參考價 NT$${r.price.toLocaleString("en-US")}）${r.note ? "：" + r.note : ""}`)
    .join("\n");
}

/** 內建預設價目的文字版（fallback 相容；新程式請改用 rateCardText(await getRateCard())）。 */
export const RATE_CARD_TEXT = rateCardText(DEFAULT_RATE_CARD);
