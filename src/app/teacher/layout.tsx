import Link from "next/link";
import { requireUser } from "@/server/auth/guards";
import { getT } from "@/i18n/server";
import { LanguageSwitch } from "@/i18n/client";
import { Logo } from "@/components/Logo";

export const metadata = { robots: { index: false } };

/** Teacher area: needs sign-in only (a teacher doesn't have to set up a study profile). */
export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const { t } = await getT();
  return (
    <div className="mx-auto min-h-dvh w-full max-w-5xl px-4 py-4">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <Link href="/teacher" className="flex items-center gap-2 font-bold"><Logo size={30} /> <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-semibold text-accent">{t("teacher.badge")}</span></Link>
        <div className="flex items-center gap-2 text-sm">
          <LanguageSwitch signedIn />
          {user.onboardedAt ? <Link href="/" className="font-semibold text-primary">{t("teacher.studentApp")} →</Link> : <Link href="/onboarding" className="text-muted">{t("teacher.alsoStudy")}</Link>}
        </div>
      </header>
      {children}
    </div>
  );
}
