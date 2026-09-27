import { requireStudent } from "@/server/auth/guards";
import { prisma } from "@/server/db";
import { getAIService } from "@/server/ai/provider";
import { hasFeature } from "@/server/entitlements";
import { CoachChat } from "@/components/CoachChat";

export const metadata = { title: "AI Coach" };

export default async function CoachPage() {
  const user = await requireStudent();
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
