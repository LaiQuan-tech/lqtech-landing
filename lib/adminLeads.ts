import { createAdminSupabase } from "@/lib/supabase";

// 後台「聯絡表單名單」讀取層（讀 lqtech 既有的 leads 表，service_role）。
// 來源站版本讀的是舊聯絡表；lqtech 沒有對應表，改讀 leads。
// export 契約（type Lead / getLeads / getLeadCount）由後台頁面共用，勿更動形狀。

export type Lead = {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  need_type: string | null;
  message: string;
  notified: boolean;
  created_at: string;
};

const COLS = "id, name, company, email, phone, need_type, message, notified, created_at";

type RawLead = {
  id?: string | null;
  name?: string | null;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  need_type?: string | null;
  message?: string | null;
  notified?: boolean | null;
  created_at?: string | null;
};

/** 把 DB 回來的原始列正規化成 Lead（缺值一律補 null／空字串／false）。 */
function normalize(r: RawLead): Lead {
  return {
    id: String(r.id ?? ""),
    name: String(r.name ?? ""),
    company: r.company ?? null,
    email: r.email ?? null,
    phone: r.phone ?? null,
    need_type: r.need_type ?? null,
    message: String(r.message ?? ""),
    notified: r.notified ?? false,
    created_at: String(r.created_at ?? ""),
  };
}

/** 聯絡表單名單（leads 表；created_at 由新到舊）。出錯回 []。 */
export async function getLeads(limit = 100): Promise<Lead[]> {
  const supabase = createAdminSupabase();
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from("leads")
      .select(COLS)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return (data as RawLead[]).map(normalize);
  } catch {
    return [];
  }
}

/** 聯絡表單名單總數（總覽計數卡）。出錯回 0。 */
export async function getLeadCount(): Promise<number> {
  const supabase = createAdminSupabase();
  if (!supabase) return 0;
  try {
    const { count, error } = await supabase
      .from("leads")
      .select("*", { count: "exact", head: true });
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}
