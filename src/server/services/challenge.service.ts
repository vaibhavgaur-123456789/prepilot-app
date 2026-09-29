import { prisma } from "@/server/db";
import { badRequest } from "@/server/errors";
import { addDays, dayKey, diffDays, rangeDays } from "@/lib/engine/dates";
import { awardXp } from "./gamification.service";
import { trackEvent } from "./context";

const CHALLENGE_XP = 300;

/** The student's current (or most recent) challenge with day-by-day progress. */
export async function currentChallenge(userId: string, now = new Date()) {
  const [c, user] = await Promise.all([
    prisma.studyChallenge.findFirst({ where: { userId }, orderBy: { createdAt: "desc" } }),
    prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { timezone: true } }),
  ]);
  if (!c) return null;
  const today = dayKey(now, user.timezone);
  const end = addDays(c.startDate, c.days - 1);
  const stats = await prisma.dailyStat.findMany({ where: { userId, date: { gte: c.startDate, lte: end } }, select: { date: true, actualMinutes: true, leave: true } });
  const by = new Map(stats.map((s) => [s.date, s]));
  const days = rangeDays(c.startDate, end).map((d) => {
    const s = by.get(d);
    const hit = (s?.actualMinutes ?? 0) >= c.dailyMinutes;
    // Leave days are paused, not failed.
    const state = d > today ? "future" : hit ? "hit" : s?.leave ? "leave" : d === today ? "today" : "miss";
    return { date: d, minutes: s?.actualMinutes ?? 0, state };
  });
  const hit = days.filter((d) => d.state === "hit").length;
  const leave = days.filter((d) => d.state === "leave").length;
  const missed = days.filter((d) => d.state === "miss").length;
  const finished = !!c.endedAt || today > end;
  const won = hit + leave >= c.days;
  if (won) await awardXp(userId, today, [{ type: "CHALLENGE", amount: CHALLENGE_XP, reason: `${c.days}-day challenge completed`, dedupeKey: `challenge:${c.id}` }]);
  return {
    id: c.id,
    dailyMinutes: c.dailyMinutes,
    days: c.days,
    startDate: c.startDate,
    endDate: end,
    dayNumber: Math.min(c.days, Math.max(1, diffDays(c.startDate, today) + 1)),
    hit,
    leave,
    missed,
    won,
    finished,
    gaveUp: !!c.endedAt,
    calendar: days,
  };
}

export async function startChallenge(userId: string, dailyMinutes: number, days = 30, now = new Date()) {
  const cur = await currentChallenge(userId, now);
  if (cur && !cur.finished) throw badRequest("You already have a challenge running. Finish or stop it first.");
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { timezone: true } });
  const c = await prisma.studyChallenge.create({ data: { userId, dailyMinutes, days, startDate: dayKey(now, user.timezone) } });
  await trackEvent(userId, "challenge_started", { dailyMinutes, days });
  return c;
}

export async function stopChallenge(userId: string) {
  await prisma.studyChallenge.updateMany({ where: { userId, endedAt: null }, data: { endedAt: new Date() } });
}
