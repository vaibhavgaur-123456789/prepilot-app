"use client";

import { useEffect } from "react";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
declare global {
  interface Window {
    __ppInstall?: InstallEvent | null;
  }
}

/** Registers the service worker and captures the browser's "install app" prompt as early as possible. */
export function ServiceWorker() {
  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      window.__ppInstall = e as InstallEvent;
      window.dispatchEvent(new Event("pp-installable"));
    };
    const onInstalled = () => {
      window.__ppInstall = null;
      window.dispatchEvent(new Event("pp-installable"));
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);
  return null;
}
