"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BRAND } from "@/config/brand";
import { flushOutbox, outboxSize } from "@/lib/client/api";
import { BellIcon, ChartIcon, ChatIcon, HomeIcon, PlanIcon, StudyIcon, TestIcon, UserIcon } from "./icons";
import { cx } from "./ui";

const NAV = [
  { href: "/", label: "Home", Icon: HomeIcon },
  { href: "/plan", label: "Plan", Icon: PlanIcon },
  { href: "/study", label: "Study", Icon: StudyIcon },
  { href: "/tests", label: "Tests", Icon: TestIcon },
  { href: "/analytics", label: "Analytics", Icon: ChartIcon },
  { href: "/profile", label: "Profile", Icon: UserIcon },
];

export function AppShell({ children, unread, isAdmin }: { children: React.ReactNode; unread: number; isAdmin: boolean }) {
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
        Skip to content
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
              <Icon /> {label}
            </Link>
          ))}
          <Link href="/coach" className={cx("mt-2 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium", active("/coach") ? "bg-primary-soft text-primary" : "text-muted hover:bg-surface-2 hover:text-text")}>
            <ChatIcon /> AI Coach
          </Link>
          {isAdmin && (
            <Link href="/admin" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted hover:bg-surface-2 hover:text-text">
              ⚙️ Admin
            </Link>
          )}
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-[color-mix(in_srgb,var(--bg)_88%,transparent)] px-4 py-2.5 backdrop-blur md:px-8">
          <Link href="/" className="flex items-center gap-2 font-bold md:invisible">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-sm text-on-primary">P</span>
            {BRAND.name}
          </Link>
          <div className="flex items-center gap-1">
            <Link href="/coach" className="grid h-11 w-11 place-items-center rounded-xl text-muted hover:bg-surface-2 md:hidden" aria-label="AI coach">
              <ChatIcon />
            </Link>
            <Link href="/notifications" className="relative grid h-11 w-11 place-items-center rounded-xl text-muted hover:bg-surface-2" aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}>
              <BellIcon />
              {unread > 0 && <span className="absolute right-2 top-2 grid h-4 min-w-4 place-items-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">{unread}</span>}
            </Link>
          </div>
        </header>
        {(!online || pending > 0) && (
          <div role="status" className="bg-warning-soft px-4 py-2 text-center text-sm text-warning">
            {!online ? "Offline: today's plan and your timer still work. Changes will sync when you reconnect." : `${pending} change${pending === 1 ? "" : "s"} waiting to sync…`}
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
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
