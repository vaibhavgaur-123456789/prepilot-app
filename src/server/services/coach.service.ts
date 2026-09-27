import { prisma } from "@/server/db";
import { notFound } from "@/server/errors";
import { buildCoachContext } from "@/server/ai/context";
import { getAIService, type ChatTurn } from "@/server/ai/provider";
import { COACH_SYSTEM, detectIntent, ruleBasedAnswer } from "@/server/ai/rules";
import { trackEvent } from "./context";

export async function listConversations(userId: string) {
  return prisma.aIConversation.findMany({ where: { userId }, orderBy: { updatedAt: "desc" }, take: 20 });
}

export async function getConversation(userId: string, id: string) {
  const c = await prisma.aIConversation.findUnique({ where: { id }, include: { messages: { orderBy: { createdAt: "asc" } } } });
  if (!c || c.userId !== userId) throw notFound("Conversation");
  return c;
}

/** Answer with the LLM when configured; otherwise (or on any failure) with the data-driven rule engine. */
export async function askCoach(userId: string, message: string, conversationId?: string | null, allowLLM = true, now = new Date()) {
  const conv = conversationId ? await getConversation(userId, conversationId) : await prisma.aIConversation.create({ data: { userId, title: message.slice(0, 60) }, include: { messages: true } });
  const context = await buildCoachContext(userId, now);
  const { intent } = detectIntent(message);

  let answer: string;
  let provider = "rule-based";
  const ai = allowLLM ? getAIService() : null;
  const ruleAnswer = () => ruleBasedAnswer(message, context, context.language).answer;
  if (ai) {
    try {
      const history: ChatTurn[] = conv.messages.slice(-8).map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));
      // Bounded context: a compact chapter list instead of every per-topic field.
      const { topics, ...rest } = context;
      const compact = { ...rest, chapters: topics.slice(0, 80).map((t) => `${t.subject}: ${t.name} [${t.status}${t.attempts ? `, ${Math.round((t.accuracy ?? 0) * 100)}% of ${t.attempts}` : ""}]`) };
      answer = await ai.complete(`${COACH_SYSTEM}\nThe student's interface language is "${context.language}".\n\nStudent data (JSON):\n${JSON.stringify(compact)}`, [...history, { role: "user", content: message }]);
      provider = ai.name;
    } catch {
      answer = ruleAnswer();
    }
  } else {
    answer = ruleAnswer();
  }

  const sections = Object.keys(context);
  await prisma.aIMessage.createMany({
    data: [
      { conversationId: conv.id, role: "user", content: message, intent },
      { conversationId: conv.id, role: "assistant", content: answer, intent, provider, contextUsed: JSON.stringify(sections) },
    ],
  });
  await prisma.aIConversation.update({ where: { id: conv.id }, data: { updatedAt: new Date() } });
  await trackEvent(userId, "coach_message", { intent, provider });
  return { conversationId: conv.id, answer, provider, intent };
}
