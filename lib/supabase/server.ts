import { createClient } from "@supabase/supabase-js";

// 伺服器端 client：用 service_role key 寫入，繞過 RLS。
// 切勿在 client component 匯入此檔（key 不可外洩到瀏覽器）。
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdmin =
  url && serviceKey
    ? createClient(url, serviceKey, { auth: { persistSession: false } })
    : null;
