import { prisma } from "@/server/db";
import { dayKey } from "@/lib/engine/dates";

export type Plant = "tree" | "sapling" | "wilted";

/** Forest-style garden: every focus session plants something. Nothing is stored; it's read from sessions. */
export function plantFor(s: { status: string; activeSeconds: number }): Plant | null {
  if (s.status === "ABANDONED") return "wilted";
  if (s.status !== "COMPLETED") return null;
  if (s.activeSeconds >= 25 * 60) return "tree";
  if (s.activeSeconds >= 10 * 60) return "sapling";
  return null;
}

export async function monthGarden(userId: string, month?: string, now = new Date()) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { timezone: true } });
  const m = month && /^\d{4}-\d{2}$/.test(month) ? month : dayKey(now, user.timezone).slice(0, 7);
  const sessions = await prisma.studySession.findMany({
    where: { userId, date: { gte: `${m}-01`, lte: `${m}-31` }, status: { in: ["COMPLETED", "ABANDONED"] } },
    select: { date: true, status: true, activeSeconds: true },
    orderBy: { startedAt: "asc" },
  });
  const plants = sessions.map((s) => ({ date: s.date, plant: plantFor(s), minutes: Math.round(s.activeSeconds / 60) })).filter((p): p is { date: string; plant: Plant; minutes: number } => p.plant !== null);
  return {
    month: m,
    plants,
    trees: plants.filter((p) => p.plant === "tree").length,
    saplings: plants.filter((p) => p.plant === "sapling").length,
    wilted: plants.filter((p) => p.plant === "wilted").length,
  };
}
