import { redirect } from "next/navigation";
import { requireUser } from "@/server/auth/guards";
import { listExams } from "@/server/services/onboarding.service";
import { OnboardingWizard } from "@/components/OnboardingWizard";

export const metadata = { title: "Set up your preparation" };

export default async function OnboardingPage() {
  const user = await requireUser();
  if (user.onboardedAt) redirect("/");
  const exams = await listExams();
  return (
    <main className="mx-auto min-h-dvh w-full max-w-2xl px-4 py-6">
      <OnboardingWizard exams={exams} defaultName={user.name} />
    </main>
  );
}
