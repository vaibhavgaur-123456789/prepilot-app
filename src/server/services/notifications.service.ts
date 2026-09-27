import { prisma, isUniqueViolation } from "@/server/db";
import { addDays, dayKey, diffDays, localMinutes, toMinutes, weekdayIndex } from "@/lib/engine/dates";

function inQuiet(nowMin: number, start: string, end: string) {
  const s = toMinutes(start);
  const e = toMinutes(end);
  return s <= e ? nowMin >= s && nowMin < e : nowMin >= s || nowMin < e;
}

const COUNTDOWN_MILESTONES = [60, 30, 14, 7, 3, 1];

/**
 * Create due in-app notifications for one student. Idempotent (dedupe key per type/day),
 * respects per-type switches, quiet hours and the daily cap, so it can run as often as needed.
 */
export async function generateNotifications(userId: string, now = new Date()) {
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { profile: true, notificationPrefs: true } });
  if (!user?.profile) return [];
  const prefs = user.notificationPrefs ?? (await prisma.notificationPrefs.create({ data: { userId } }));
  if (!prefs.enabled) return [];
  const tz = user.timezone;
  const today = dayKey(now, tz);
  const nowMin = localMinutes(now, tz);
  if (inQuiet(nowMin, prefs.quietStart, prefs.quietEnd)) return [];

  const sentToday = await prisma.notification.count({ where: { userId, dedupeKey: { contains: `:${today}` } } });
  let budget = prefs.maxPerDay - sentToday;
  if (budget <= 0) return [];

  const candidates: { type: string; title: string; body: string; href: string; enabled: boolean }[] = [];
  const [tasks, dueRevisions, yesterdayMissed] = await Promise.all([
    prisma.task.findMany({ where: { userId, date: today, status: { in: ["PENDING", "PARTIAL"] }, isOptional: false }, orderBy: { order: "asc" } }),
    prisma.userTopicState.count({ where: { userId, nextRevisionOn: { lte: today } } }),
    prisma.task.count({ where: { userId, date: addDays(today, -1), status: { in: ["MISSED", "PARTIAL"] } } }),
  ]);
  const daysLeft = diffDays(today, user.profile.examDate);

  if (nowMin >= 6 * 60) {
    const minutes = tasks.reduce((s, t) => s + t.plannedMinutes, 0);
    candidates.push({ type: "BRIEFING", title: "Today's plan is ready", body: `${tasks.length} blocks, about ${Math.round(minutes / 6) / 10}h. Open to see your first task.`, href: "/", enabled: prefs.dailyBriefing });
  }
  const upcoming = tasks.find((t) => t.startTime && toMinutes(t.startTime) - nowMin <= 15 && toMinutes(t.startTime) - nowMin >= -10);
  if (upcoming) candidates.push({ type: "STUDY", title: `Up next: ${upcoming.title}`, body: `${upcoming.plannedMinutes} min${upcoming.questionTarget ? ` · ${upcoming.questionTarget} questions` : ""}. Start when you're ready.`, href: `/study/session/${upcoming.id}`, enabled: prefs.studyReminder });
  if (dueRevisions > 0 && nowMin >= 9 * 60) candidates.push({ type: "REVISION", title: `${dueRevisions} revision${dueRevisions === 1 ? "" : "s"} due`, body: "Short, on-time revisions keep what you've learned.", href: "/study/revision", enabled: prefs.revisionReminder });
  if (tasks.some((t) => t.type === "MOCK")) candidates.push({ type: "MOCK", title: "Mock test scheduled today", body: "Pick a quiet slot and attempt it under exam conditions.", href: "/tests", enabled: prefs.mockReminder });
  if (yesterdayMissed > 0) candidates.push({ type: "MISSED_TASK", title: "Yesterday's unfinished work is handled", body: `${yesterdayMissed} task${yesterdayMissed === 1 ? " was" : "s were"} rescheduled or reduced, with nothing dropped silently. See what changed.`, href: "/plan", enabled: prefs.missedTask });
  if (COUNTDOWN_MILESTONES.includes(daysLeft)) candidates.push({ type: "COUNTDOWN", title: `${daysLeft} day${daysLeft === 1 ? "" : "s"} to your exam`, body: "Your plan is shifting towards revision and mocks.", href: "/analytics", enabled: prefs.examCountdown });
  if (weekdayIndex(today) === 0 && nowMin >= 8 * 60) candidates.push({ type: "WEEKLY", title: "Your weekly report is ready", body: "See last week's hours, accuracy and next week's priorities.", href: "/review/weekly", enabled: prefs.weeklyReview });

  const keyOf = (type: string) => `${userId}:${type}:${today}`;
  const existing = new Set((await prisma.notification.findMany({ where: { dedupeKey: { in: candidates.map((c) => keyOf(c.type)) } }, select: { dedupeKey: true } })).map((n) => n.dedupeKey));
  const created = [];
  for (const c of candidates) {
    if (!c.enabled || budget <= 0 || existing.has(keyOf(c.type))) continue;
    try {
      created.push(await prisma.notification.create({ data: { userId, type: c.type, title: c.title, body: c.body, href: c.href, dedupeKey: `${userId}:${c.type}:${today}`, scheduledFor: now, deliveredAt: now } }));
      budget--;
    } catch (e) {
      if (!isUniqueViolation(e)) throw e;
    }
  }
  return created;
}

export async function runNotificationSweep(now = new Date()) {
  const users = await prisma.user.findMany({ where: { onboardedAt: { not: null } }, select: { id: true } });
  let created = 0;
  for (const u of users) created += (await generateNotifications(u.id, now)).length;
  return { users: users.length, created };
}

export async function listNotifications(userId: string) {
  return prisma.notification.findMany({ where: { userId, scheduledFor: { lte: new Date() } }, orderBy: { scheduledFor: "desc" }, take: 50 });
}

export async function markAllRead(userId: string) {
  await prisma.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } });
}

export async function getPrefs(userId: string) {
  return (await prisma.notificationPrefs.findUnique({ where: { userId } })) ?? prisma.notificationPrefs.create({ data: { userId } });
}

export async function updatePrefs(userId: string, patch: Record<string, unknown>) {
  await getPrefs(userId);
  return prisma.notificationPrefs.update({ where: { userId }, data: patch });
}
