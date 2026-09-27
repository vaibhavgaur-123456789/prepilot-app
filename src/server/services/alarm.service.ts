import { prisma, isUniqueViolation } from "@/server/db";
import { badRequest, notFound } from "@/server/errors";
import { dayKey, localMinutes, toMinutes, weekdayIndex } from "@/lib/engine/dates";
import { parseJson, toJson } from "@/lib/json";
import { deviceCount, sendPush } from "./push.service";

const MAX_ALARMS = 10;
/** Alarms fire if their time fell within this many minutes before the sweep (sweeps run every ~5 min). */
const WINDOW_MIN = 10;

export async function listAlarms(userId: string) {
  const [alarms, devices] = await Promise.all([prisma.studyAlarm.findMany({ where: { userId }, orderBy: { time: "asc" } }), deviceCount(userId)]);
  return { alarms: alarms.map((a) => ({ ...a, days: parseJson<number[]>(a.days, []) })), devices };
}

export async function saveAlarm(userId: string, input: { id?: string; time: string; days: number[]; label: string; enabled: boolean }) {
  const days = [...new Set(input.days)].filter((d) => d >= 0 && d <= 6).sort();
  if (days.length === 0) throw badRequest("Pick at least one day.");
  if (input.id) {
    const a = await prisma.studyAlarm.findUnique({ where: { id: input.id } });
    if (!a || a.userId !== userId) throw notFound("Alarm");
    return prisma.studyAlarm.update({ where: { id: a.id }, data: { time: input.time, days: toJson(days), label: input.label, enabled: input.enabled, lastFiredOn: null } });
  }
  if ((await prisma.studyAlarm.count({ where: { userId } })) >= MAX_ALARMS) throw badRequest(`You can set up to ${MAX_ALARMS} alarms.`);
  return prisma.studyAlarm.create({ data: { userId, time: input.time, days: toJson(days), label: input.label, enabled: input.enabled } });
}

export async function deleteAlarm(userId: string, id: string) {
  await prisma.studyAlarm.deleteMany({ where: { id, userId } });
}

/** Called by the scheduler every few minutes: fire each alarm once on its day, at its local time. */
export async function fireDueAlarms(now = new Date()) {
  const alarms = await prisma.studyAlarm.findMany({ where: { enabled: true }, include: { user: { select: { id: true, timezone: true, language: true } } } });
  let fired = 0;
  for (const a of alarms) {
    const tz = a.user.timezone;
    const today = dayKey(now, tz);
    if (a.lastFiredOn === today) continue;
    if (!parseJson<number[]>(a.days, []).includes(weekdayIndex(today))) continue;
    const late = localMinutes(now, tz) - toMinutes(a.time);
    if (late < 0 || late > WINDOW_MIN) continue;

    const hi = a.user.language === "hi";
    const title = hi ? `⏰ पढ़ाई का समय${a.label ? `: ${a.label}` : ""}` : `⏰ Study time${a.label ? `: ${a.label}` : ""}`;
    const body = hi ? "टाइमर शुरू करें। आज का प्लान तैयार है।" : "Start your timer. Today's plan is ready.";
    try {
      await prisma.notification.create({ data: { userId: a.userId, type: "STUDY", title, body, href: "/study/session/free?quick=1", dedupeKey: `${a.userId}:ALARM:${a.id}:${today}`, scheduledFor: now, deliveredAt: now } });
    } catch (e) {
      if (!isUniqueViolation(e)) throw e;
    }
    await prisma.studyAlarm.update({ where: { id: a.id }, data: { lastFiredOn: today } });
    await sendPush(a.userId, { title, body, href: "/study/session/free?quick=1", tag: `alarm-${a.id}` }).catch(() => 0);
    fired++;
  }
  return { checked: alarms.length, fired };
}
