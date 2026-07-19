"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { trackEvent } from "@/lib/analytics";

const YELLOW = "#FFCE00";
const INK = "#1A1A1A";

type Msg = { role: "user" | "model"; text: string };

const GREETING =
  "嗨！我是萊乾資訊的 AI 小幫手 ⚡ 想做官網、Web App 還是品牌設計？跟我說說你的想法，我幫你估個方向。";
const SUGGESTIONS = [
  "做一個形象官網大概多少錢？",
  "Web App 開發流程是什麼？",
  "我想了解品牌設計服務",
  "可以先免費諮詢嗎？",
];

export default function ChatWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([{ role: "model", text: GREETING }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sessionIdRef = useRef<string>("");

  // 每次掛載產生一個 session id，隨每則訊息送給後端做對話紀錄（後台可看）。
  useEffect(() => {
    sessionIdRef.current =
      globalThis.crypto?.randomUUID?.() ?? `s_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, loading, open]);

  // 允許站上其他元件以事件開啟聊天
  useEffect(() => {
    const openHandler = () => {
      setOpen(true);
      trackEvent("ai_chat_open", { source: "event" });
    };
    window.addEventListener("lq:open-chat", openHandler);
    return () => window.removeEventListener("lq:open-chat", openHandler);
  }, []);

  function toggle() {
    setOpen((o) => {
      if (!o) trackEvent("ai_chat_open", { source: "fab" });
      return !o;
    });
  }

  async function send(text: string) {
    const q = text.trim();
    if (!q || loading) return;
    trackEvent("ai_chat_message", { chars: q.length });
    const next = [...msgs, { role: "user" as const, text: q }];
    setMsgs(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, sessionId: sessionIdRef.current }),
      });
      const data = await res.json();
      setMsgs((m) => [
        ...m,
        {
          role: "model",
          text: data.ok ? data.reply : data.message || "抱歉，暫時無法回覆，請稍後再試。",
        },
      ]);
      if (data.ok && data.quotePending) void generateQuote();
    } catch {
      setMsgs((m) => [...m, { role: "model", text: "連線出了點問題，請稍後再試，或到官網下方填聯絡表單。" }]);
    } finally {
      setLoading(false);
    }
  }

  // 客人同意收報價 → 靜默請後端依對話產生報價草稿（老闆審核後才寄）。
  async function generateQuote() {
    try {
      await fetch("/api/ai/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sessionIdRef.current }),
      });
    } catch {
      /* 靜默：草稿生成失敗不影響對話 */
    }
  }

  // 後台頁面不顯示對外的 AI 客服浮動按鈕
  if (pathname?.startsWith("/admin")) return null;

  return (
    <>
      {/* 浮動按鈕 */}
      <button
        aria-label={open ? "關閉 AI 小幫手" : "開啟 AI 小幫手"}
        onClick={toggle}
        className="gt-chat-fab lc-zap"
        style={{
          position: "fixed",
          right: 20,
          bottom: 20,
          zIndex: 70,
          width: 60,
          height: 60,
          borderRadius: "50%",
          border: "none",
          cursor: "pointer",
          background: YELLOW,
          color: INK,
          boxShadow: "0 10px 30px rgba(255,206,0,.45)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 26,
        }}
      >
        {open ? "✕" : "💬"}
      </button>

      {open && (
        <div className="gt-chat-panel" role="dialog" aria-label="萊乾資訊 AI 小幫手">
          {/* header */}
          <div style={{ padding: "16px 18px", background: INK, color: "#fff", display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: YELLOW,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                fontWeight: 700,
              }}
            >
              ⚡
            </span>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>萊乾 AI 小幫手</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.6)" }}>由 Gemini 驅動 · 即時回覆</div>
            </div>
          </div>

          {/* messages */}
          <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "16px", background: "#FFFBEC" }}>
            {msgs.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: 10 }}>
                <div
                  style={{
                    maxWidth: "82%",
                    padding: "10px 14px",
                    borderRadius: 14,
                    fontSize: 14.5,
                    lineHeight: 1.6,
                    whiteSpace: "pre-wrap",
                    background: m.role === "user" ? YELLOW : "#fff",
                    color: INK,
                    boxShadow: m.role === "user" ? "none" : "0 2px 10px rgba(26,26,26,.06)",
                  }}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 10 }}>
                <div style={{ padding: "10px 14px", borderRadius: 14, background: "#fff", color: "#86868b", fontSize: 14 }}>
                  正在輸入…
                </div>
              </div>
            )}
            {msgs.length <= 1 && !loading && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    style={{
                      fontSize: 13,
                      color: INK,
                      background: "#fff",
                      border: `1px solid ${YELLOW}`,
                      borderRadius: 980,
                      padding: "7px 13px",
                      cursor: "pointer",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            style={{ display: "flex", gap: 8, padding: 12, borderTop: "1px solid rgba(0,0,0,.08)", background: "#fff" }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="輸入你的問題…"
              maxLength={500}
              style={{
                flex: 1,
                border: "1px solid rgba(0,0,0,.14)",
                borderRadius: 980,
                padding: "10px 16px",
                fontSize: 14.5,
                outline: "none",
              }}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              style={{
                border: "none",
                borderRadius: "50%",
                width: 42,
                height: 42,
                background: YELLOW,
                color: INK,
                cursor: loading || !input.trim() ? "default" : "pointer",
                opacity: loading || !input.trim() ? 0.5 : 1,
                fontSize: 17,
                flexShrink: 0,
              }}
            >
              ↑
            </button>
          </form>
          <div style={{ fontSize: 11, color: "#9aa3b0", textAlign: "center", padding: "0 12px 10px", background: "#fff" }}>
            AI 生成內容僅供參考，正式諮詢請{" "}
            <a href="/#contact" style={{ color: "#9a7a00" }}>
              填聯絡表單
            </a>
          </div>
        </div>
      )}
    </>
  );
}
