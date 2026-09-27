"use client";

import { useEffect, useRef, useState } from "react";
import { apiFetch, ApiError } from "@/lib/client/api";
import { Alert, Badge, Button, cx, inputClass, PageHeader } from "./ui";
import { useLang, useT } from "@/i18n/client";

type Msg = { role: "user" | "assistant"; content: string; provider?: string | null };
const SUGGESTIONS = {
  en: ["What should I study today?", "I missed yesterday. What should I do?", "I have only 2 hours today.", "My Maths score is falling.", "Why am I getting questions wrong?", "Create a revision plan.", "Analyze my last mock.", "I don't feel like studying", "What's my streak?"],
  hi: ["आज क्या पढ़ूँ?", "कल पढ़ाई छूट गई, अब क्या करूँ?", "आज सिर्फ 2 घंटे हैं", "मेरा Maths गिर रहा है", "मेरी गलतियाँ क्यों हो रही हैं?", "रिवीज़न प्लान बनाओ", "पिछला टेस्ट कैसा रहा?", "पढ़ने का मन नहीं कर रहा", "मेरी स्ट्रीक कितनी है?"],
};

export function CoachChat({ conversationId: initialId, initial, mode }: { conversationId: string | null; initial: Msg[]; mode: "llm" | "rules" }) {
  const t = useT();
  const lang = useLang();
  const [id, setId] = useState(initialId);
  const [msgs, setMsgs] = useState<Msg[]>(initial);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const end = useRef<HTMLDivElement>(null);

  // Braces matter: newer browsers return a Promise from scrollIntoView, and an effect may only return a cleanup function.
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  async function send(message: string) {
    if (!message.trim() || busy) return;
    setMsgs((m) => [...m, { role: "user", content: message }]);
    setText("");
    setBusy(true);
    setError(null);
    try {
      const r = await apiFetch<{ conversationId: string; answer: string; provider: string }>("/api/v1/coach", { method: "POST", body: { message, conversationId: id } });
      setId(r.conversationId);
      setMsgs((m) => [...m, { role: "assistant", content: r.answer, provider: r.provider }]);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "The coach is unavailable right now. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100dvh-10rem)] flex-col">
      <PageHeader title={t("coach.title")}subtitle="Answers use your actual plan, study history, mocks, weak topics and revision schedule." action={<Badge tone={mode === "llm" ? "primary" : "neutral"}>{mode === "llm" ? "Claude-powered" : "Built-in data coach"}</Badge>} />
      {mode === "rules" && <p className="-mt-2 mb-3 text-xs text-muted">{t("coach.rulesNote")}</p>}
      <div className="flex-1 space-y-3" aria-live="polite">
        {msgs.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted">Ask anything about your preparation. Try one of these:</div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={cx("max-w-[88%] whitespace-pre-line rounded-2xl px-4 py-3 text-sm", m.role === "user" ? "animate-in ml-auto bg-grad" : "animate-in border border-border bg-surface")}>
            {m.content}
            {m.role === "assistant" && m.provider && <p className="mt-2 text-[10px] uppercase tracking-wide text-muted">{m.provider === "rule-based" ? "Built-in coach" : "Claude"}</p>}
          </div>
        ))}
        {busy && <div className="w-24 animate-pulse rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-muted">Thinking…</div>}
        <div ref={end} />
      </div>
      {error && <div className="mt-3"><Alert tone="danger">{error}</Alert></div>}
      <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
        {SUGGESTIONS[lang].map((s) => <button key={s} type="button" onClick={() => send(s)} disabled={busy} className="shrink-0 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium hover:bg-surface-2">{s}</button>)}
      </div>
      <form className="sticky bottom-20 flex gap-2 md:bottom-4" onSubmit={(e) => { e.preventDefault(); send(text); }}>
        <label className="sr-only" htmlFor="coach-input">Message</label>
        <input id="coach-input" className={inputClass} placeholder={t("coach.placeholder")} value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} />
        <Button type="submit" disabled={busy || !text.trim()}>{t("coach.send")}</Button>
      </form>
    </div>
  );
}
