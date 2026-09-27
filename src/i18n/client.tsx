"use client";

import { createContext, useContext } from "react";
import { useRouter } from "next/navigation";
import { LANGS, translate, type Key, type Lang } from "./dict";
import { cx } from "@/components/ui";

const Ctx = createContext<Lang>("en");

export function setLangCookie(code: string) {
  document.cookie = `pp_lang=${code}; path=/; max-age=31536000; samesite=lax`;
}

export function I18nProvider({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  return <Ctx.Provider value={lang}>{children}</Ctx.Provider>;
}

export function useLang() {
  return useContext(Ctx);
}

export function useT() {
  const lang = useContext(Ctx);
  return (key: Key, vars?: Record<string, string | number>) => translate(lang, key, vars);
}

/** EN | हिं switch. Saves to the profile when signed in, and to a cookie for signed-out pages. */
export function LanguageSwitch({ signedIn, className }: { signedIn: boolean; className?: string }) {
  const lang = useLang();
  const router = useRouter();
  async function set(code: Lang) {
    if (code === lang) return;
    setLangCookie(code);
    if (signedIn) {
      await fetch("/api/v1/profile", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ profile: { language: code } }) }).catch(() => undefined);
    }
    router.refresh();
  }
  return (
    <div role="group" aria-label="Language / भाषा" className={cx("flex rounded-xl border border-border p-0.5 text-xs font-semibold", className)}>
      {LANGS.map((l) => (
        <button key={l.code} type="button" aria-pressed={lang === l.code} onClick={() => set(l.code)} className={cx("min-h-9 rounded-lg px-2.5", lang === l.code ? "bg-primary text-on-primary" : "text-muted hover:text-text")}>
          {l.code === "en" ? "EN" : "हिं"}
        </button>
      ))}
    </div>
  );
}
