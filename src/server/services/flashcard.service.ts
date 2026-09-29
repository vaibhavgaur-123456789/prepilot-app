import { prisma } from "@/server/db";
import { badRequest, notFound } from "@/server/errors";
import { dayKey } from "@/lib/engine/dates";
import { reviewCard, type CardGrade } from "@/lib/engine/flashcards";
import { trackEvent } from "./context";

const MAX_CARDS = 3000;

async function today(userId: string, now = new Date()) {
  const u = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { timezone: true } });
  return dayKey(now, u.timezone);
}

export async function cardOverview(userId: string, now = new Date()) {
  const t = await today(userId, now);
  const [due, total, decks] = await Promise.all([
    prisma.flashcard.findMany({ where: { userId, dueOn: { lte: t } }, orderBy: [{ dueOn: "asc" }, { createdAt: "asc" }], take: 100 }),
    prisma.flashcard.count({ where: { userId } }),
    prisma.flashcard.groupBy({ by: ["deck"], where: { userId }, _count: { _all: true } }),
  ]);
  return {
    due: due.map((c) => ({ id: c.id, deck: c.deck, front: c.front, back: c.back, reps: c.reps })),
    total,
    decks: decks.map((d) => ({ deck: d.deck, count: d._count._all })).sort((a, b) => a.deck.localeCompare(b.deck)),
  };
}

export async function listCards(userId: string, deck?: string) {
  return prisma.flashcard.findMany({ where: { userId, ...(deck !== undefined ? { deck } : {}) }, orderBy: { createdAt: "desc" }, take: 500, select: { id: true, deck: true, front: true, back: true, dueOn: true } });
}

export async function addCards(userId: string, cards: { deck: string; front: string; back: string }[], now = new Date()) {
  if ((await prisma.flashcard.count({ where: { userId } })) + cards.length > MAX_CARDS) throw badRequest(`You can keep up to ${MAX_CARDS} cards.`);
  const t = await today(userId, now);
  await prisma.flashcard.createMany({ data: cards.map((c) => ({ userId, deck: c.deck, front: c.front, back: c.back, dueOn: t })) });
  await trackEvent(userId, "cards_added", { n: cards.length });
  return { added: cards.length };
}

export async function gradeCard(userId: string, id: string, grade: CardGrade, now = new Date()) {
  const c = await prisma.flashcard.findUnique({ where: { id } });
  if (!c || c.userId !== userId) throw notFound("Card");
  const next = reviewCard(c, grade, await today(userId, now));
  await prisma.flashcard.update({ where: { id }, data: next });
  return { dueOn: next.dueOn, intervalDays: next.intervalDays };
}

export async function updateCard(userId: string, id: string, patch: { deck: string; front: string; back: string }) {
  const r = await prisma.flashcard.updateMany({ where: { id, userId }, data: patch });
  if (r.count === 0) throw notFound("Card");
}

export async function deleteCard(userId: string, id: string) {
  await prisma.flashcard.deleteMany({ where: { id, userId } });
}
