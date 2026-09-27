"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useT } from "@/i18n/client";
import { Button, cx } from "./ui";

type Platform = "installed" | "prompt" | "ios" | "inapp-android" | "inapp-ios" | "samsung" | "other";

// Browsers inside WhatsApp, Instagram, Facebook, Telegram etc. cannot install apps.
const IN_APP = /FBAN|FBAV|FB_IAB|Instagram|WhatsApp|Line\/|Telegram|Snapchat|; wv\)|GSA\//i;

function detect(): Platform {
  if (typeof window === "undefined") return "other";
  const ua = navigator.userAgent;
  const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
  if (standalone) return "installed";
  if (window.__ppInstall) return "prompt";
  const ios = /iphone|ipad|ipod/i.test(ua);
  if (IN_APP.test(ua)) return ios ? "inapp-ios" : "inapp-android";
  if (ios) return "ios";
  if (/SamsungBrowser/i.test(ua)) return "samsung";
  return "other";
}

/** Opens the current page in Chrome from an Android in-app browser. */
function chromeIntentUrl() {
  const { host, pathname, search } = window.location;
  return `intent://${host}${pathname}${search}#Intent;scheme=https;package=com.android.chrome;end`;
}

/**
 * "📲 Install app". On Android/Chrome/Edge it opens the browser's own install dialog.
 * On iPhone, and where the browser offers no prompt, it shows the manual steps.
 */
export function InstallButton({ variant = "button", className }: { variant?: "button" | "banner"; className?: string }) {
  const t = useT();
  const [platform, setPlatform] = useState<Platform>("other");
  const [mounted, setMounted] = useState(false);
  const [help, setHelp] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const update = () => setPlatform(detect());
    const id = setTimeout(() => {
      setMounted(true);
      update();
      try {
        setHidden(variant === "banner" && localStorage.getItem("pp_install_dismissed") === "1");
      } catch {
        /* storage unavailable */
      }
    }, 0);
    window.addEventListener("pp-installable", update);
    return () => {
      clearTimeout(id);
      window.removeEventListener("pp-installable", update);
    };
  }, [variant]);

  if (!mounted || platform === "installed" || hidden) return null;

  async function install() {
    const ev = window.__ppInstall;
    if (ev) {
      await ev.prompt();
      await ev.userChoice.catch(() => undefined);
      window.__ppInstall = null;
      setPlatform(detect());
    } else {
      setHelp(true);
    }
  }

  const dialog = help
    ? createPortal(
        <div role="dialog" aria-modal aria-label={t("install.title")} className="fixed inset-0 z-50 grid place-items-end bg-black/40 sm:place-items-center" onClick={() => setHelp(false)}>
          <div className="w-full max-w-md rounded-t-2xl bg-surface p-5 sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold">📲 {t("install.title")}</h2>
            {platform === "inapp-android" ? (
              <div className="mt-3 space-y-3 text-sm">
                <p>{t("install.inapp")}</p>
                <a href={chromeIntentUrl()} className="flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 font-semibold text-on-primary">{t("install.openChrome")}</a>
                <p className="text-xs text-muted">{t("install.inappManual")}</p>
              </div>
            ) : platform === "inapp-ios" ? (
              <div className="mt-3 space-y-2 text-sm">
                <p>{t("install.inapp")}</p>
                <p>{t("install.inappIos")}</p>
              </div>
            ) : platform === "ios" ? (
              <ol className="mt-3 list-inside list-decimal space-y-2 text-sm">
                <li>{t("install.ios1")}</li>
                <li>{t("install.ios2")}</li>
                <li>{t("install.ios3")}</li>
              </ol>
            ) : platform === "samsung" ? (
              <ol className="mt-3 list-inside list-decimal space-y-2 text-sm">
                <li>{t("install.samsung1")}</li>
                <li>{t("install.samsung2")}</li>
              </ol>
            ) : (
              <ol className="mt-3 list-inside list-decimal space-y-2 text-sm">
                <li>{t("install.android1")}</li>
                <li>{t("install.android2")}</li>
                <li>{t("install.android3")}</li>
              </ol>
            )}
            <p className="mt-3 text-xs text-muted">{t("install.note")}</p>
            <Button className="mt-4 w-full" onClick={() => setHelp(false)}>OK</Button>
          </div>
        </div>,
        document.body,
      )
    : null;

  if (variant === "banner") {
    return (
      <>
        <div className={cx("flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary-soft p-3", className)}>
          <span className="text-2xl" aria-hidden>📲</span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{t("install.bannerTitle")}</p>
            <p className="text-xs text-muted">{t("install.bannerText")}</p>
          </div>
          <Button onClick={install} className="shrink-0">{t("install.button")}</Button>
          <button type="button" aria-label="Dismiss" className="shrink-0 px-1 text-muted" onClick={() => { setHidden(true); try { localStorage.setItem("pp_install_dismissed", "1"); } catch { /* ignore */ } }}>✕</button>
        </div>
        {dialog}
      </>
    );
  }
  return (
    <>
      <Button variant="secondary" onClick={install} className={className}>📲 {t("install.button")}</Button>
      {dialog}
    </>
  );
}
