import { prisma } from "@/server/db";
import { addDays, dayKey } from "@/lib/engine/dates";

export const EVENT_KINDS = ["FORM_START", "LAST_DATE", "ADMIT_CARD", "EXAM", "RESULT", "OTHER"] as const;
export type EventKind = (typeof EVENT_KINDS)[number];

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

/** An event is for a student if it has no exam name, or its exam name matches the student's exam. */
export function eventMatches(eventExam: string, studentExam: { name: string; shortName: string } | null) {
  if (!eventExam.trim()) return true;
  if (!studentExam) return false;
  const e = norm(eventExam);
  return [studentExam.name, studentExam.shortName].some((x) => {
    const s = norm(x);
    return s.length > 0 && (s.includes(e) || e.includes(s));
  });
}

/** Upcoming events (next 180 days), the student's own exam first. */
export async function upcomingEvents(userId: string | null, now = new Date()) {
  const user = userId ? await prisma.user.findUnique({ where: { id: userId }, select: { timezone: true, profile: { select: { exam: { select: { name: true, shortName: true } } } } } }) : null;
  const today = dayKey(now, user?.timezone ?? "Asia/Kolkata");
  const rows = await prisma.examEvent.findMany({ where: { date: { gte: today, lte: addDays(today, 180) } }, orderBy: { date: "asc" }, take: 200 });
  const exam = user?.profile?.exam ?? null;
  return rows.map((r) => ({ id: r.id, title: r.title, examName: r.examName, kind: r.kind as EventKind, date: r.date, link: r.link, mine: !!r.examName && eventMatches(r.examName, exam) }));
}

export async function adminListEvents() {
  return prisma.examEvent.findMany({ orderBy: { date: "asc" } });
}

export async function adminSaveEvent(input: { id?: string; title: string; examName: string; kind: EventKind; date: string; link: string }) {
  const data = { title: input.title, examName: input.examName, kind: input.kind, date: input.date, link: input.link };
  return input.id ? prisma.examEvent.update({ where: { id: input.id }, data }) : prisma.examEvent.create({ data });
}

export async function adminDeleteEvent(id: string) {
  await prisma.examEvent.deleteMany({ where: { id } });
}
