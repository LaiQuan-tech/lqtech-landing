"use server";

import { supabaseAdmin } from "@/lib/supabase/server";

export type LeadInput = {
  name: string;
  company?: string;
  email: string;
  phone?: string;
  needType?: string;
  message: string;
};

export type LeadResult = { ok: true } | { ok: false; error: string };

export async function submitLead(form: LeadInput): Promise<LeadResult> {
  // 後端再驗一次（前端驗證可被繞過）。
  if (!form.name?.trim() || !/.+@.+\..+/.test(form.email || "") || !form.message?.trim()) {
    return { ok: false, error: "必填欄位不完整" };
  }

  if (!supabaseAdmin) {
    // 環境變數未設定時的保護，避免直接 500。
    return { ok: false, error: "伺服器尚未設定資料庫，請稍後再試或用 LINE 聯繫" };
  }

  const { error } = await supabaseAdmin.from("leads").insert({
    name: form.name.trim(),
    company: form.company?.trim() || null,
    email: form.email.trim(),
    phone: form.phone?.trim() || null,
    need_type: form.needType || null,
    message: form.message.trim(),
  });

  if (error) {
    return { ok: false, error: "送出失敗，請稍後再試或用 LINE 聯繫" };
  }
  return { ok: true };
}
