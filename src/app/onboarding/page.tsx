import Link from "next/link";
import { redirect } from "next/navigation";
import { getT } from "@/i18n/server";
import { requireUser } from "@/server/auth/guards";
import { prisma } from "@/server/db";
import { listExams } from "@/server/services/onboarding.service";
import { OnboardingWizard } from "@/components/OnboardingWizard";

export const metadata = { title: "Set up your preparation" };

/** First-time setup, or (with ?change=1) switching to a different exam later. */
export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ change?: string }> }) {
  const user = await requireUser();
  const changing = (await searchParams).change === "1";
  if (user.onboardedAt && !changing) redirect("/");
  const [exams, profile] = await Promise.all([listExams(), prisma.studentProfile.findUnique({ where: { userId: user.id } })]);
  const { t } = await getT();
  return (
    <main className="mx-auto min-h-dvh w-full max-w-2xl px-4 py-6">
      {!changing && (
        <Link href="/teacher" className="mb-4 flex items-center justify-between gap-2 rounded-2xl border border-border bg-accent-soft px-4 py-3 text-sm">
          <span>👩‍🏫 {t("teacher.onboardingHint")}</span>
          <span className="shrink-0 font-semibold text-accent">{t("teacher.open")} →</span>
        </Link>
      )}
      <OnboardingWizard
        exams={exams}
        defaultName={user.name}
        changing={changing && !!profile}
        current={profile ? { examId: profile.examId, examDate: profile.examDate, dailyMinutes: profile.dailyMinutes } : null}
      />
    </main>
  );
}
