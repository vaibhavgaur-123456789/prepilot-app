import { BRAND } from "@/config/brand";
import { LanguageSwitch } from "@/i18n/client";
import { FeedbackButton } from "@/components/FeedbackButton";
import { InstallButton } from "@/components/InstallButton";
import { LogoMark } from "@/components/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-3 flex justify-end"><LanguageSwitch signedIn={false} /></div>
        <div className="mb-6 text-center">
          <div className="animate-pop mx-auto mb-3 w-fit"><LogoMark size={64} title={BRAND.name} /></div>
          <h1 className="text-grad text-3xl font-extrabold">{BRAND.name}</h1>
          <p className="mt-1 text-sm text-muted">{BRAND.tagline}</p>
        </div>
        <div className="animate-in rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow)]">{children}</div>
        <p className="mt-3 text-center text-xs"><a href="/welcome" className="font-semibold text-primary">← {BRAND.name}</a></p>
        <div className="mt-4 flex flex-col items-center gap-3"><InstallButton /><FeedbackButton signedIn={false} variant="link" /></div>
      </div>
    </main>
  );
}
