import { randomInt } from "node:crypto";
import { prisma, isUniqueViolation } from "@/server/db";
import { badRequest, notFound } from "@/server/errors";
import { XP } from "@/config/scoring";
import { addDays, dayKey, rangeDays } from "@/lib/engine/dates";
import { currentStreak } from "@/lib/engine/streaks";
import { trackEvent } from "./context";

const MAX_CLASSES_PER_TEACHER = 20;
const MAX_STUDENTS_PER_CLASS = 300;
const MAX_CLASSES_PER_STUDENT = 5;
// No 0/O or 1/I/L, so codes are easy to read out in class.
const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function newCode() {
  return Array.from({ length: 6 }, () => CODE_CHARS[randomInt(CODE_CHARS.length)]).join("");
}
export const normalizeCode = (c: string) => c.toUpperCase().replace(/[^A-Z0-9]/g, "");

async function ownClass(teacherId: string, classId: string) {
  const c = await prisma.classroom.findUnique({ where: { id: classId } });
  if (!c || c.teacherId !== teacherId) throw notFound("Class");
  return c;
}

// ───────────── Teacher ─────────────

export async function createClass(teacherId: string, name: string) {
  if ((await prisma.classroom.count({ where: { teacherId } })) >= MAX_CLASSES_PER_TEACHER) throw badRequest(`You can create up to ${MAX_CLASSES_PER_TEACHER} classes.`);
  for (let i = 0; i < 5; i++) {
    try {
      const c = await prisma.classroom.create({ data: { teacherId, name, code: newCode() } });
      await trackEvent(teacherId, "class_created");
      return c;
    } catch (e) {
      if (!isUniqueViolation(e)) throw e;
    }
  }
  throw badRequest("Couldn't create a unique code. Please try again.");
}

export async function teacherClasses(teacherId: string) {
  const rows = await prisma.classroom.findMany({ where: { teacherId }, orderBy: { createdAt: "asc" }, include: { _count: { select: { members: true } } } });
  return rows.map((c) => ({ id: c.id, name: c.name, code: c.code, students: c._count.members, createdAt: c.createdAt.toISOString() }));
}

export async function renameClass(teacherId: string, classId: string, name: string) {
  await ownClass(teacherId, classId);
  return prisma.classroom.update({ where: { id: classId }, data: { name } });
}

export async function newClassCode(teacherId: string, classId: string) {
  await ownClass(teacherId, classId);
  for (let i = 0; i < 5; i++) {
    try {
      return await prisma.classroom.update({ where: { id: classId }, data: { code: newCode() } });
    } catch (e) {
      if (!isUniqueViolation(e)) throw e;
    }
  }
  throw badRequest("Couldn't create a unique code. Please try again.");
}

export async function deleteClass(teacherId: string, classId: string) {
  await ownClass(teacherId, classId);
  await prisma.classroom.delete({ where: { id: classId } });
}

export async function removeStudent(teacherId: string, classId: string, userId: string) {
  await ownClass(teacherId, classId);
  await prisma.classMember.deleteMany({ where: { classroomId: classId, userId } });
}

/**
 * What the teacher sees: study time, days studied, streak and number of papers timed.
 * Every number is measured from the student's own timer; nothing is estimated.
 */
export async function classDashboard(teacherId: string, classId: string, now = new Date()) {
  const c = await ownClass(teacherId, classId);
  const members = await prisma.classMember.findMany({
    where: { classroomId: classId },
    include: { user: { select: { id: true, name: true, timezone: true, lastActiveAt: true } } },
    orderBy: { joinedAt: "asc" },
  });
  const ids = members.map((m) => m.userId);
  const since = addDays(dayKey(now, "Asia/Kolkata"), -90);
  const [stats, papers] = await Promise.all([
    prisma.dailyStat.findMany({ where: { userId: { in: ids }, date: { gte: since } }, select: { userId: true, date: true, actualMinutes: true, leave: true } }),
    prisma.paperLog.groupBy({ by: ["userId"], where: { userId: { in: ids }, endedAt: { gte: new Date(now.getTime() - 7 * 86_400_000) } }, _count: { _all: true } }),
  ]);
  const paperCount = new Map(papers.map((p) => [p.userId, p._count._all]));

  const students = members.map((m) => {
    const today = dayKey(now, m.user.timezone);
    const week = rangeDays(addDays(today, -6), today);
    const mine = stats.filter((s) => s.userId === m.userId);
    const byDate = new Map(mine.map((s) => [s.date, s]));
    const qualifying = new Set(mine.filter((s) => s.actualMinutes >= XP.qualifyingDayMinutes).map((s) => s.date));
    const rest = new Set(mine.filter((s) => s.leave).map((s) => s.date));
    const last7 = week.map((d) => ({ date: d, minutes: byDate.get(d)?.actualMinutes ?? 0, leave: byDate.get(d)?.leave ?? false }));
    return {
      userId: m.userId,
      name: m.user.name,
      joinedAt: m.joinedAt.toISOString(),
      lastActiveAt: m.user.lastActiveAt?.toISOString() ?? null,
      todayMinutes: byDate.get(today)?.actualMinutes ?? 0,
      onLeaveToday: byDate.get(today)?.leave ?? false,
      weekMinutes: last7.reduce((s, d) => s + d.minutes, 0),
      daysStudied: last7.filter((d) => qualifying.has(d.date)).length,
      streak: currentStreak(qualifying, today, rest).streak,
      papersThisWeek: paperCount.get(m.userId) ?? 0,
      last7,
    };
  });

  const n = students.length || 1;
  return {
    id: c.id,
    name: c.name,
    code: c.code,
    students,
    summary: {
      count: students.length,
      studiedToday: students.filter((s) => s.todayMinutes >= XP.qualifyingDayMinutes).length,
      avgWeekMinutes: Math.round(students.reduce((s, x) => s + x.weekMinutes, 0) / n),
      totalWeekMinutes: students.reduce((s, x) => s + x.weekMinutes, 0),
    },
  };
}
export type ClassDashboard = Awaited<ReturnType<typeof classDashboard>>;

// ───────────── Student ─────────────

export async function myClasses(userId: string) {
  const rows = await prisma.classMember.findMany({ where: { userId }, include: { classroom: { include: { teacher: { select: { name: true } } } } }, orderBy: { joinedAt: "asc" } });
  return rows.map((r) => ({ classId: r.classroomId, name: r.classroom.name, teacher: r.classroom.teacher.name, joinedAt: r.joinedAt.toISOString() }));
}

export async function joinClass(userId: string, rawCode: string) {
  const code = normalizeCode(rawCode);
  const c = await prisma.classroom.findUnique({ where: { code }, include: { teacher: { select: { name: true } }, _count: { select: { members: true } } } });
  if (!c) throw badRequest("No class found with this code. Check it with your teacher.");
  if (await prisma.classMember.findUnique({ where: { classroomId_userId: { classroomId: c.id, userId } } })) return { classId: c.id, name: c.name, teacher: c.teacher.name, already: true };
  if (c._count.members >= MAX_STUDENTS_PER_CLASS) throw badRequest("This class is full.");
  if ((await prisma.classMember.count({ where: { userId } })) >= MAX_CLASSES_PER_STUDENT) throw badRequest(`You can be in up to ${MAX_CLASSES_PER_STUDENT} classes.`);
  try {
    await prisma.classMember.create({ data: { classroomId: c.id, userId } });
  } catch (e) {
    if (!isUniqueViolation(e)) throw e;
  }
  await trackEvent(userId, "class_joined");
  return { classId: c.id, name: c.name, teacher: c.teacher.name, already: false };
}

export async function leaveClass(userId: string, classId: string) {
  await prisma.classMember.deleteMany({ where: { classroomId: classId, userId } });
}
