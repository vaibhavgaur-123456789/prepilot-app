import { BRAND } from "@/config/brand";
import { LanguageSwitch } from "@/i18n/client";
import { FeedbackButton } from "@/components/FeedbackButton";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-3 flex justify-end"><LanguageSwitch signedIn={false} /></div>
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-primary text-xl font-bold text-on-primary">P</div>
          <h1 className="text-2xl font-bold">{BRAND.name}</h1>
          <p className="mt-1 text-sm text-muted">{BRAND.tagline}</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow)]">{children}</div>
        <div className="mt-4 text-center"><FeedbackButton signedIn={false} variant="link" /></div>
      </div>
    </main>
  );
}
