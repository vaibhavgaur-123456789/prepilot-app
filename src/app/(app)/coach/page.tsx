import { requireUser } from "@/server/auth/guards";
import { prisma } from "@/server/db";
import { getAIService } from "@/server/ai/provider";
import { hasFeature } from "@/server/entitlements";
import { CoachChat } from "@/components/CoachChat";
import { Card } from "@/components/ui";
import Link from "next/link";

export const metadata = { title: "AI Coach" };

export default async function CoachPage() {
  const user = await requireUser();

  // Non-onboarded users (e.g. admin who signed up without going through onboarding)
  // get a friendly prompt instead of a crash.
  if (!user.onboardedAt) {
    return (
      <Card className="mx-auto mt-10 max-w-md text-center">
        <h1 className="text-lg font-semibold">Complete your profile first</h1>
        <p className="mt-1 text-sm text-muted">
          The AI Coach needs your exam details and study profile to give useful answers.
          Finish onboarding to unlock it.
        </p>
        <Link
          href="/onboarding"
          className="mt-4 inline-block rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-on-primary hover:opacity-90"
        >
          Set up my profile →
        </Link>
      </Card>
    );
  }

  const conv = await prisma.aIConversation.findFirst({ where: { userId: user.id }, orderBy: { updatedAt: "desc" }, include: { messages: { orderBy: { createdAt: "asc" }, take: 40 } } });
  const llm = !!getAIService() && hasFeature(user, "AI_COACH_LLM");
  return (
    <CoachChat
      conversationId={conv?.id ?? null}
      initial={(conv?.messages ?? []).map((m) => ({ role: m.role as "user" | "assistant", content: m.content, provider: m.provider }))}
      mode={llm ? "llm" : "rules"}
    />
  );
}
