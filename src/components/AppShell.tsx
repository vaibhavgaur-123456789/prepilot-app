"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BRAND } from "@/config/brand";
import { flushOutbox, outboxSize } from "@/lib/client/api";
import { LanguageSwitch, useT } from "@/i18n/client";
import type { Key } from "@/i18n/dict";
import { BellIcon, ChartIcon, ChatIcon, HomeIcon, PlanIcon, StudyIcon, TestIcon, UserIcon } from "./icons";
import { FeedbackButton } from "./FeedbackButton";
import { cx } from "./ui";

const NAV: { href: string; label: Key; Icon: typeof HomeIcon }[] = [
  { href: "/", label: "nav.home", Icon: HomeIcon },
  { href: "/plan", label: "nav.plan", Icon: PlanIcon },
  { href: "/study", label: "nav.study", Icon: StudyIcon },
  { href: "/tests", label: "nav.tests", Icon: TestIcon },
  { href: "/analytics", label: "nav.analytics", Icon: ChartIcon },
  { href: "/profile", label: "nav.profile", Icon: UserIcon },
];

export function AppShell({ children, unread, isAdmin }: { children: React.ReactNode; unread: number; isAdmin: boolean }) {
  const t = useT();
  const path = usePathname();
  const [online, setOnline] = useState(true);
  const [pending, setPending] = useState(0);
  const focus = path.startsWith("/study/session/") || path.startsWith("/tests/attempt/");

  useEffect(() => {
    const sync = async () => {
      setOnline(navigator.onLine);
      if (navigator.onLine) await flushOutbox();
      setPending(outboxSize());
    };
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  const active = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));

  if (focus) return <main className="min-h-dvh">{children}</main>;

  return (
    <div className="min-h-dvh md:flex">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-surface focus:p-2">
        {t("nav.skip")}
      </a>
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-border bg-surface p-4 md:flex">
        <Link href="/" className="mb-6 flex items-center gap-2 px-2 text-lg font-bold">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-on-primary">P</span>
          {BRAND.name}
        </Link>
        <nav aria-label="Main" className="flex flex-col gap-1">
          {NAV.map(({ href, label, Icon }) => (
            <Link key={href} href={href} aria-current={active(href) ? "page" : undefined} className={cx("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium", active(href) ? "bg-primary-soft text-primary" : "text-muted hover:bg-surface-2 hover:text-text")}>
              <Icon /> {t(label)}
            </Link>
          ))}
          <Link href="/coach" className={cx("mt-2 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium", active("/coach") ? "bg-primary-soft text-primary" : "text-muted hover:bg-surface-2 hover:text-text")}>
            <ChatIcon /> {t("nav.coach")}
          </Link>
          {([["/attendance", "📅", "quick.attendance"], ["/alarms", "⏰", "quick.alarm"], ["/syllabus", "📚", "quick.syllabus"], ["/help", "❓", "nav.howto"]] as const).map(([href, icon, key]) => (
            <Link key={href} href={href} className={cx("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium", active(href) ? "bg-primary-soft text-primary" : "text-muted hover:bg-surface-2 hover:text-text")}>
              <span className="w-[22px] text-center" aria-hidden>{icon}</span> {t(key)}
            </Link>
          ))}
          {isAdmin && (
            <Link href="/admin" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted hover:bg-surface-2 hover:text-text">
              ⚙️ {t("nav.admin")}
            </Link>
          )}
        </nav>
        <div className="mt-auto space-y-3 px-2">
          <FeedbackButton signedIn variant="link" />
          <LanguageSwitch signedIn />
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-[color-mix(in_srgb,var(--bg)_88%,transparent)] px-4 py-2.5 backdrop-blur md:px-8">
          <Link href="/" className="flex items-center gap-2 font-bold md:invisible" aria-label={BRAND.name}>
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-sm text-on-primary">P</span>
            <span className="hidden min-[420px]:inline">{BRAND.name}</span>
          </Link>
          <div className="flex items-center gap-0.5">
            <LanguageSwitch signedIn className="md:hidden" />
            <Link href="/help" className="grid h-11 w-10 place-items-center rounded-xl text-lg text-muted hover:bg-surface-2 md:hidden" aria-label={t("nav.howto")}>?</Link>
            <FeedbackButton signedIn className="md:hidden" />
            <Link href="/coach" className="grid h-11 w-11 place-items-center rounded-xl text-muted hover:bg-surface-2 md:hidden" aria-label={t("nav.coach")}>
              <ChatIcon />
            </Link>
            <Link href="/notifications" className="relative grid h-11 w-11 place-items-center rounded-xl text-muted hover:bg-surface-2" aria-label={`${t("nav.notifications")}${unread ? ` (${unread})` : ""}`}>
              <BellIcon />
              {unread > 0 && <span className="absolute right-2 top-2 grid h-4 min-w-4 place-items-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">{unread}</span>}
            </Link>
          </div>
        </header>
        {(!online || pending > 0) && (
          <div role="status" className="bg-warning-soft px-4 py-2 text-center text-sm text-warning">
            {!online ? t("offline.banner") : t("offline.pending", { n: pending })}
          </div>
        )}
        <main id="main" className="mx-auto w-full max-w-5xl px-4 pb-28 pt-4 md:px-8 md:pb-10">
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-6 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] md:hidden">
        {NAV.map(({ href, label, Icon }) => (
          <Link key={href} href={href} aria-current={active(href) ? "page" : undefined} className={cx("flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium", active(href) ? "text-primary" : "text-muted")}>
            <Icon width={21} height={21} />
            {t(label)}
          </Link>
        ))}
      </nav>
    </div>
  );
}
