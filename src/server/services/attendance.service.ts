import { prisma } from "@/server/db";
import { badRequest } from "@/server/errors";
import { XP } from "@/config/scoring";
import { addDays, dayKey } from "@/lib/engine/dates";

export type DayStatus = "PRESENT" | "LOW" | "LEAVE" | "ABSENT" | "TODAY" | "FUTURE" | "BEFORE_START";

/** "Hazri": a month calendar of study days, leave days and missed days. */
export async function monthAttendance(userId: string, month?: string, now = new Date()) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, include: { profile: true } });
  const today = dayKey(now, user.timezone);
  const ym = month && /^\d{4}-\d{2}$/.test(month) ? month : today.slice(0, 7);
  const first = `${ym}-01`;
  const days: string[] = [];
  for (let d = first; d.startsWith(ym); d = addDays(d, 1)) days.push(d);
  const last = days[days.length - 1];
  const start = user.profile ? dayKey(user.profile.createdAt, user.timezone) : dayKey(user.createdAt, user.timezone);

  const [stats, sessions] = await Promise.all([
    prisma.dailyStat.findMany({ where: { userId, date: { gte: first, lte: last } } }),
    prisma.studySession.groupBy({ by: ["date"], where: { userId, status: "COMPLETED", date: { gte: first, lte: last } }, _count: { _all: true } }),
  ]);
  const byDate = new Map(stats.map((s) => [s.date, s]));
  const sessionsBy = new Map(sessions.map((s) => [s.date, s._count._all]));

  const cells = days.map((date) => {
    const s = byDate.get(date);
    const minutes = s?.actualMinutes ?? 0;
    let status: DayStatus;
    if (s?.leave) status = "LEAVE";
    else if (date > today) status = "FUTURE";
    else if (minutes >= XP.qualifyingDayMinutes) status = "PRESENT";
    else if (date === today) status = "TODAY";
    else if (minutes > 0) status = "LOW";
    else if (date < start) status = "BEFORE_START";
    else status = "ABSENT";
    return { date, status, minutes, planned: s?.plannedMinutes ?? 0, sessions: sessionsBy.get(date) ?? 0, questions: s?.questions ?? 0, note: s?.leaveNote ?? null };
  });

  const counted = cells.filter((c) => c.status !== "FUTURE" && c.status !== "BEFORE_START");
  const best = cells.reduce((b, c) => (c.minutes > b.minutes ? c : b), cells[0]);
  return {
    month: ym,
    today,
    prevMonth: addDays(first, -1).slice(0, 7),
    nextMonth: addDays(last, 1).slice(0, 7),
    cells,
    summary: {
      present: cells.filter((c) => c.status === "PRESENT").length,
      low: cells.filter((c) => c.status === "LOW").length,
      leave: cells.filter((c) => c.status === "LEAVE").length,
      absent: cells.filter((c) => c.status === "ABSENT").length,
      trackedDays: counted.length,
      totalMinutes: cells.reduce((s, c) => s + c.minutes, 0),
      bestDay: best && best.minutes > 0 ? { date: best.date, minutes: best.minutes } : null,
    },
  };
}

/** Mark (or unmark) a day as leave. Unstarted tasks for that day are released back to the planner. */
export async function setLeave(userId: string, date: string, leave: boolean, note: string | null, now = new Date()) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const today = dayKey(now, user.timezone);
  if (date < addDays(today, -7) || date > addDays(today, 60)) throw badRequest("You can mark leave for the last 7 days or the next 60 days.");
  const stat = await prisma.dailyStat.findUnique({ where: { userId_date: { userId, date } } });
  if (leave && stat && stat.actualMinutes >= XP.qualifyingDayMinutes) throw badRequest("You already studied that day, so it counts as present.");
  await prisma.dailyStat.upsert({
    where: { userId_date: { userId, date } },
    create: { userId, date, leave, leaveNote: leave ? note : null },
    update: { leave, leaveNote: leave ? note : null },
  });
  if (date >= today) {
    // Drop the unstarted plan for that day; carried-over work returns to the backlog.
    const pending = await prisma.task.findMany({ where: { userId, date, status: "PENDING", actualMinutes: 0 } });
    const carriedFrom = pending.map((t) => t.carriedFromId).filter((x): x is string => !!x);
    await prisma.$transaction([
      prisma.task.updateMany({ where: { id: { in: carriedFrom } }, data: { carryConsumed: false, carryOn: addDays(date, 1) } }),
      prisma.task.deleteMany({ where: { id: { in: pending.map((t) => t.id) } } }),
      prisma.planDay.deleteMany({ where: { userId, date } }),
    ]);
  }
  return { ok: true };
}
