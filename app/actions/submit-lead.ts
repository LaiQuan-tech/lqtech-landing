"use server";

import { supabaseAdmin } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";

export type LeadInput = {
  name: string;
  company?: string;
  email: string;
  phone?: string;
  needType?: string;
  message: string;
};

export type LeadResult = { ok: true } | { ok: false; error: string };

function esc(s: string) {
  return s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c] || c));
}

async function notify(form: LeadInput) {
  const to = process.env.LEAD_NOTIFY_EMAIL || "lqtech2026@gmail.com";
  const when = new Intl.DateTimeFormat("zh-TW", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Taipei",
  }).format(new Date());

  const rows: [string, string][] = [
    ["姓名", form.name],
    ["公司／品牌", form.company || "—"],
    ["Email", form.email],
    ["電話", form.phone || "—"],
    ["需求類型", form.needType || "未選"],
    ["專案簡述", form.message],
    ["送出時間", when],
  ];

  const text = rows.map(([k, v]) => `${k}：${v}`).join("\n");
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;color:#1A1A1A">
      <div style="background:#FFCE00;padding:16px 20px;border-radius:12px 12px 0 0;font-weight:800;font-size:18px">⚡ 萊乾官網新詢問</div>
      <table style="width:100%;border-collapse:collapse;background:#fff;border:1px solid #f0e6c0;border-top:none;border-radius:0 0 12px 12px">
        ${rows
          .map(
            ([k, v]) =>
              `<tr><td style="padding:10px 14px;color:#888;font-size:13px;white-space:nowrap;vertical-align:top;border-bottom:1px solid #f5eed0">${esc(k)}</td><td style="padding:10px 14px;font-size:14px;border-bottom:1px solid #f5eed0;white-space:pre-wrap">${esc(v)}</td></tr>`
          )
          .join("")}
      </table>
      <p style="color:#999;font-size:12px;margin-top:12px">可直接回覆此信與客戶聯繫（回覆會寄到 ${esc(form.email)}）。</p>
    </div>`;

  return sendEmail({
    to,
    subject: `【萊乾官網新詢問】${form.name}｜${form.needType || "未選類型"}`,
    html,
    text,
    replyTo: form.email,
  });
}

export async function submitLead(form: LeadInput): Promise<LeadResult> {
  // 後端再驗一次（前端驗證可被繞過）。
  if (!form.name?.trim() || !/.+@.+\..+/.test(form.email || "") || !form.message?.trim()) {
    return { ok: false, error: "必填欄位不完整" };
  }

  if (!supabaseAdmin) {
    // 環境變數未設定時的保護，避免直接 500。
    return { ok: false, error: "伺服器尚未設定資料庫，請稍後再試，或來信 lqtech2026@gmail.com。" };
  }

  const clean: LeadInput = {
    name: form.name.trim(),
    company: form.company?.trim() || undefined,
    email: form.email.trim(),
    phone: form.phone?.trim() || undefined,
    needType: form.needType || undefined,
    message: form.message.trim(),
  };

  const { error } = await supabaseAdmin.from("leads").insert({
    name: clean.name,
    company: clean.company || null,
    email: clean.email,
    phone: clean.phone || null,
    need_type: clean.needType || null,
    message: clean.message,
  });

  if (error) {
    return { ok: false, error: "送出失敗，請稍後再試，或來信 lqtech2026@gmail.com。" };
  }

  // 名單已存。寄通知信為盡力而為，失敗不影響表單成功。
  try {
    await notify(clean);
  } catch (e) {
    console.error("[submit-lead] 通知信寄送例外:", e);
  }

  return { ok: true };
}
