import { redirect } from "next/navigation";
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
  return (
    <main className="mx-auto min-h-dvh w-full max-w-2xl px-4 py-6">
      <OnboardingWizard
        exams={exams}
        defaultName={user.name}
        changing={changing && !!profile}
        current={profile ? { examId: profile.examId, examDate: profile.examDate, dailyMinutes: profile.dailyMinutes } : null}
      />
    </main>
  );
}
