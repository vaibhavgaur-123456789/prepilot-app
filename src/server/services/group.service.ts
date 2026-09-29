import { prisma, isUniqueViolation } from "@/server/db";
import { badRequest, notFound } from "@/server/errors";
import { XP } from "@/config/scoring";
import { addDays, dayKey, rangeDays } from "@/lib/engine/dates";
import { currentStreak } from "@/lib/engine/streaks";
import { newCode, normalizeCode } from "./classroom.service";
import { trackEvent } from "./context";

const MAX_MEMBERS = 50;
const MAX_GROUPS_PER_USER = 10;
/** A session still "ACTIVE" after this long was probably forgotten; don't show it as live. */
const LIVE_WINDOW_MS = 4 * 3600_000;

async function ensureRoom(userId: string) {
  if ((await prisma.groupMember.count({ where: { userId } })) >= MAX_GROUPS_PER_USER) throw badRequest(`You can be in up to ${MAX_GROUPS_PER_USER} groups.`);
}

export async function createGroup(userId: string, name: string) {
  await ensureRoom(userId);
  for (let i = 0; i < 5; i++) {
    try {
      const g = await prisma.studyGroup.create({ data: { ownerId: userId, name, code: newCode(), members: { create: { userId } } } });
      await trackEvent(userId, "group_created");
      return g;
    } catch (e) {
      if (!isUniqueViolation(e)) throw e;
    }
  }
  throw badRequest("Couldn't create a unique code. Please try again.");
}

export async function joinGroup(userId: string, rawCode: string) {
  const g = await prisma.studyGroup.findUnique({ where: { code: normalizeCode(rawCode) }, include: { _count: { select: { members: true } } } });
  if (!g) throw badRequest("No group found with this code.");
  if (await prisma.groupMember.findUnique({ where: { groupId_userId: { groupId: g.id, userId } } })) return { groupId: g.id, name: g.name, already: true };
  if (g._count.members >= MAX_MEMBERS) throw badRequest("This group is full.");
  await ensureRoom(userId);
  try {
    await prisma.groupMember.create({ data: { groupId: g.id, userId } });
  } catch (e) {
    if (!isUniqueViolation(e)) throw e;
  }
  await trackEvent(userId, "group_joined");
  return { groupId: g.id, name: g.name, already: false };
}

export async function leaveGroup(userId: string, groupId: string) {
  await prisma.groupMember.deleteMany({ where: { groupId, userId } });
  // An empty group has no purpose; the last one out closes it.
  if ((await prisma.groupMember.count({ where: { groupId } })) === 0) await prisma.studyGroup.deleteMany({ where: { id: groupId } });
}

export async function myGroups(userId: string) {
  const rows = await prisma.groupMember.findMany({ where: { userId }, include: { group: { include: { _count: { select: { members: true } } } } }, orderBy: { joinedAt: "asc" } });
  return rows.map((r) => ({ id: r.groupId, name: r.group.name, code: r.group.code, members: r.group._count.members }));
}

/** Leaderboard for one group. Only members can see it. */
export async function groupBoard(userId: string, groupId: string, now = new Date()) {
  const g = await prisma.studyGroup.findUnique({ where: { id: groupId }, include: { members: { include: { user: { select: { id: true, name: true, timezone: true } } } } } });
  if (!g || !g.members.some((m) => m.userId === userId)) throw notFound("Group");
  const ids = g.members.map((m) => m.userId);
  const since = addDays(dayKey(now, "Asia/Kolkata"), -60);
  const [stats, live] = await Promise.all([
    prisma.dailyStat.findMany({ where: { userId: { in: ids }, date: { gte: since } }, select: { userId: true, date: true, actualMinutes: true, leave: true } }),
    prisma.studySession.findMany({ where: { userId: { in: ids }, status: "ACTIVE", startedAt: { gte: new Date(now.getTime() - LIVE_WINDOW_MS) } }, select: { userId: true, startedAt: true } }),
  ]);
  const liveBy = new Map(live.map((s) => [s.userId, s.startedAt]));
  const members = g.members.map((m) => {
    const today = dayKey(now, m.user.timezone);
    const mine = stats.filter((s) => s.userId === m.userId);
    const byDate = new Map(mine.map((s) => [s.date, s.actualMinutes]));
    const qualifying = new Set(mine.filter((s) => s.actualMinutes >= XP.qualifyingDayMinutes).map((s) => s.date));
    const rest = new Set(mine.filter((s) => s.leave).map((s) => s.date));
    const liveSince = liveBy.get(m.userId);
    return {
      userId: m.userId,
      name: m.user.name,
      isMe: m.userId === userId,
      todayMinutes: byDate.get(today) ?? 0,
      weekMinutes: rangeDays(addDays(today, -6), today).reduce((s, d) => s + (byDate.get(d) ?? 0), 0),
      streak: currentStreak(qualifying, today, rest).streak,
      studyingNowMinutes: liveSince ? Math.max(0, Math.round((now.getTime() - liveSince.getTime()) / 60_000)) : null,
    };
  });
  members.sort((a, b) => b.weekMinutes - a.weekMinutes || b.todayMinutes - a.todayMinutes);
  return { id: g.id, name: g.name, code: g.code, isOwner: g.ownerId === userId, members: members.map((m, i) => ({ ...m, rank: i + 1 })) };
}
export type GroupBoard = Awaited<ReturnType<typeof groupBoard>>;
