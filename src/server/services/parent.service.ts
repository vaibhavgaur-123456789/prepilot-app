import { randomBytes } from "node:crypto";
import { prisma } from "@/server/db";
import { XP } from "@/config/scoring";
import { addDays, dayKey, rangeDays } from "@/lib/engine/dates";
import { currentStreak } from "@/lib/engine/streaks";
import { trackEvent } from "./context";

const newToken = () => randomBytes(16).toString("base64url");

export async function getParentLink(userId: string) {
  return prisma.parentLink.findUnique({ where: { userId } });
}

/** Create the link, or replace it with a new one (the old link stops working). */
export async function resetParentLink(userId: string) {
  const token = newToken();
  const link = await prisma.parentLink.upsert({ where: { userId }, create: { userId, token }, update: { token, createdAt: new Date() } });
  await trackEvent(userId, "parent_link_created");
  return link;
}

export async function removeParentLink(userId: string) {
  await prisma.parentLink.deleteMany({ where: { userId } });
}

/**
 * What a parent sees through the link: only the last 14 days of study time, days studied, streak and papers.
 * No login, no notes, no marks, no email.
 */
export async function parentReport(token: string, now = new Date()) {
  if (!/^[\w-]{10,64}$/.test(token)) return null;
  const link = await prisma.parentLink.findUnique({ where: { token }, include: { user: { select: { id: true, name: true, timezone: true, profile: { include: { exam: { select: { name: true } } } } } } } });
  if (!link) return null;
  const u = link.user;
  const today = dayKey(now, u.timezone);
  const from = addDays(today, -13);
  const [stats, qualifyingRows, papers] = await Promise.all([
    prisma.dailyStat.findMany({ where: { userId: u.id, date: { gte: from, lte: today } }, select: { date: true, actualMinutes: true, leave: true } }),
    prisma.dailyStat.findMany({ where: { userId: u.id, date: { gte: addDays(today, -120) } }, select: { date: true, actualMinutes: true, leave: true } }),
    prisma.paperLog.count({ where: { userId: u.id, endedAt: { gte: new Date(now.getTime() - 7 * 86_400_000) } } }),
  ]);
  const by = new Map(stats.map((s) => [s.date, s]));
  const days = rangeDays(from, today).map((d) => ({ date: d, minutes: by.get(d)?.actualMinutes ?? 0, leave: by.get(d)?.leave ?? false }));
  const thisWeek = days.slice(7);
  const lastWeek = days.slice(0, 7);
  const qualifying = new Set(qualifyingRows.filter((s) => s.actualMinutes >= XP.qualifyingDayMinutes).map((s) => s.date));
  const rest = new Set(qualifyingRows.filter((s) => s.leave).map((s) => s.date));
  return {
    name: u.name,
    exam: u.profile?.exam.name ?? null,
    days: thisWeek,
    weekMinutes: thisWeek.reduce((s, d) => s + d.minutes, 0),
    lastWeekMinutes: lastWeek.reduce((s, d) => s + d.minutes, 0),
    daysStudied: thisWeek.filter((d) => qualifying.has(d.date)).length,
    leaveDays: thisWeek.filter((d) => d.leave).length,
    streak: currentStreak(qualifying, today, rest).streak,
    papers,
    updatedAt: now.toISOString(),
  };
}
