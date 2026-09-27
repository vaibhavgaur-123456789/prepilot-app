"use client";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
declare global {
  interface Window {
    __ppInstall?: InstallEvent | null;
  }
}

/**
 * The install prompt capture and service-worker registration run from an inline script in the root
 * layout's <head> (they must happen before React hydrates). This component only carries the types.
 */
export function ServiceWorker() {
  return null;
}
