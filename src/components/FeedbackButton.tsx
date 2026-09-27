"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/client/api";
import { useT } from "@/i18n/client";
import { Alert, Button, cx, inputClass } from "./ui";

const CATS = ["BUG", "CONTENT_ERROR", "SUGGESTION", "ACCOUNT", "OTHER"] as const;

export function FeedbackButton({ signedIn, className, variant = "icon" }: { signedIn: boolean; className?: string; variant?: "icon" | "link" }) {
  const t = useT();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<(typeof CATS)[number]>("BUG");
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    setError(null);
    try {
      await apiFetch("/api/v1/feedback", { method: "POST", body: { category, message, page: path, contact } });
      setState("sent");
      setMessage("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't send. Please try again.");
      setState("idle");
    }
  }

  return (
    <>
      {variant === "icon" ? (
        <button type="button" onClick={() => { setOpen(true); setState("idle"); }} aria-label={t("nav.help")} title={t("nav.help")} className={cx("grid h-11 w-11 place-items-center rounded-xl text-muted hover:bg-surface-2", className)}>
          <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7" />
          </svg>
        </button>
      ) : (
        <button type="button" onClick={() => { setOpen(true); setState("idle"); }} className={cx("text-sm font-semibold text-primary", className)}>{t("nav.help")}</button>
      )}
      {open && createPortal(
        <div role="dialog" aria-modal aria-label={t("fb.title")} className="fixed inset-0 z-50 grid place-items-end bg-black/40 sm:place-items-center" onClick={() => setOpen(false)}>
          <div className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-surface p-5 sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold">{t("fb.title")}</h2>
            <p className="mt-1 text-sm text-muted">{t("fb.subtitle")}</p>
            {state === "sent" ? (
              <div className="mt-4 space-y-3">
                <Alert tone="success">{t("fb.thanks")}</Alert>
                <Button className="w-full" onClick={() => setOpen(false)}>OK</Button>
              </div>
            ) : (
              <form onSubmit={send} className="mt-4 space-y-3">
                <fieldset>
                  <legend className="mb-1 text-sm font-medium">{t("fb.category")}</legend>
                  <div className="grid grid-cols-2 gap-2">
                    {CATS.map((c) => (
                      <button key={c} type="button" aria-pressed={category === c} onClick={() => setCategory(c)} className={cx("min-h-11 rounded-xl border px-2 text-xs font-medium", category === c ? "border-primary bg-primary-soft text-primary" : "border-border")}>{t(`fb.${c}`)}</button>
                    ))}
                  </div>
                </fieldset>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium">{t("fb.message")}</span>
                  <textarea required minLength={5} maxLength={3000} className={cx(inputClass, "min-h-28 py-2")} placeholder={t("fb.placeholder")} value={message} onChange={(e) => setMessage(e.target.value)} />
                </label>
                {!signedIn && (
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium">{t("fb.contact")}</span>
                    <input type="email" className={inputClass} value={contact} onChange={(e) => setContact(e.target.value)} />
                  </label>
                )}
                {error && <Alert tone="danger">{error}</Alert>}
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="secondary" onClick={() => setOpen(false)}>{t("common.cancel")}</Button>
                  <Button type="submit" disabled={state === "sending" || message.trim().length < 5}>{state === "sending" ? t("fb.sending") : t("fb.send")}</Button>
                </div>
              </form>
            )}
          </div>
        </div>,
        // Portal: the sticky header uses backdrop-filter, which would otherwise trap this fixed overlay inside it.
        document.body,
      )}
    </>
  );
}
