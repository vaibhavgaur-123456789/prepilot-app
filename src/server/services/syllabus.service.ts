import { prisma } from "@/server/db";
import { badRequest, forbidden, notFound } from "@/server/errors";
import { dayKey } from "@/lib/engine/dates";
import { scheduleInitialRevision } from "./revision.service";

export const PURPOSES = ["EXAM", "SCHOOL", "SELF", "SKILL"] as const;
export type Purpose = (typeof PURPOSES)[number];

const slug = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "item";
const uniq = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

export interface CustomSubjectInput {
  name: string;
  book?: string | null;
  chapters: string[];
}

/** A student's own private syllabus: their goal, their subjects, their book, their chapters. */
export async function createCustomSyllabus(userId: string, input: { name: string; purpose: Purpose; subjects: CustomSubjectInput[] }) {
  if (!input.subjects.length) throw badRequest("Add at least one subject.");
  const exam = await prisma.exam.create({
    data: {
      slug: `my-${userId.slice(-8)}-${uniq()}`,
      name: input.name,
      shortName: input.name.slice(0, 30),
      category: input.purpose === "EXAM" ? "CUSTOM" : input.purpose,
      description: "Personal syllabus",
      durationMinutes: 60,
      totalQuestions: 0,
      isActive: false,
      ownerId: userId,
    },
  });
  for (const [i, s] of input.subjects.entries()) {
    const subject = await prisma.subject.create({ data: { examId: exam.id, slug: `${slug(s.name)}-${uniq()}`, name: s.name, book: s.book || null, order: i, weightage: 1 } });
    const chapters = s.chapters.map((c) => c.trim()).filter(Boolean).slice(0, 200);
    for (const [j, c] of chapters.entries()) {
      await prisma.topic.create({ data: { subjectId: subject.id, slug: `${slug(c)}-${uniq()}`, name: c.slice(0, 120), order: j, weightage: 3, difficulty: 3, estimatedMinutes: 120 } });
    }
  }
  return syllabusForExam(exam.id);
}

/** Same shape as listExams() items, so onboarding can use it directly. */
export async function syllabusForExam(examId: string) {
  const e = await prisma.exam.findUniqueOrThrow({
    where: { id: examId },
    include: { subjects: { orderBy: { order: "asc" }, include: { topics: { orderBy: { order: "asc" }, include: { _count: { select: { children: true } } } } } } },
  });
  return {
    id: e.id, name: e.name, shortName: e.shortName, category: e.category, description: e.description, durationMinutes: e.durationMinutes,
    totalQuestions: e.totalQuestions, negativeMarking: e.negativeMarking, marksPerQuestion: e.marksPerQuestion, custom: true,
    subjects: e.subjects.map((s) => ({ id: s.id, name: s.name, topics: s.topics.filter((t) => t._count.children === 0).map((t) => ({ id: t.id, name: t.name, weightage: t.weightage, parentId: t.parentId })) })),
  };
}

/** The student's current syllabus with their progress on every chapter. */
export async function mySyllabus(userId: string) {
  const profile = await prisma.studentProfile.findUnique({ where: { userId }, include: { exam: true } });
  if (!profile) throw notFound("Profile");
  const [subjects, states] = await Promise.all([
    prisma.subject.findMany({ where: { examId: profile.examId }, orderBy: { order: "asc" }, include: { topics: { where: { children: { none: {} } }, orderBy: { order: "asc" }, include: { _count: { select: { questions: true } } } } } }),
    prisma.userTopicState.findMany({ where: { userId, topic: { subject: { examId: profile.examId } } }, select: { topicId: true, status: true, minutesStudied: true } }),
  ]);
  const st = new Map(states.map((s) => [s.topicId, s]));
  return {
    exam: { id: profile.exam.id, name: profile.exam.name, editable: profile.exam.ownerId === userId },
    purpose: profile.purpose,
    subjects: subjects.map((s) => ({
      id: s.id, name: s.name, book: s.book,
      chapters: s.topics.map((t) => ({ id: t.id, name: t.name, status: (st.get(t.id)?.status ?? "NOT_STARTED") as "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED", minutes: st.get(t.id)?.minutesStudied ?? 0, questions: t._count.questions })),
    })),
  };
}

async function ownExam(userId: string) {
  const profile = await prisma.studentProfile.findUnique({ where: { userId }, include: { exam: true } });
  if (!profile) throw notFound("Profile");
  if (profile.exam.ownerId !== userId) throw forbidden();
  return profile.exam;
}
async function ownSubject(userId: string, subjectId: string) {
  const exam = await ownExam(userId);
  const s = await prisma.subject.findUnique({ where: { id: subjectId } });
  if (!s || s.examId !== exam.id) throw notFound("Subject");
  return s;
}
async function ownTopic(userId: string, topicId: string) {
  const exam = await ownExam(userId);
  const t = await prisma.topic.findUnique({ where: { id: topicId }, include: { subject: true } });
  if (!t || t.subject.examId !== exam.id) throw notFound("Chapter");
  return t;
}

export async function addSubject(userId: string, input: { name: string; book?: string | null }) {
  const exam = await ownExam(userId);
  const order = await prisma.subject.count({ where: { examId: exam.id } });
  return prisma.subject.create({ data: { examId: exam.id, slug: `${slug(input.name)}-${uniq()}`, name: input.name, book: input.book || null, order, weightage: 1 } });
}
export async function updateSubject(userId: string, subjectId: string, input: { name?: string; book?: string | null }) {
  await ownSubject(userId, subjectId);
  return prisma.subject.update({ where: { id: subjectId }, data: { ...(input.name ? { name: input.name } : {}), ...(input.book !== undefined ? { book: input.book || null } : {}) } });
}
export async function deleteSubject(userId: string, subjectId: string) {
  await ownSubject(userId, subjectId);
  await prisma.subject.delete({ where: { id: subjectId } });
}
export async function addChapters(userId: string, subjectId: string, names: string[]) {
  await ownSubject(userId, subjectId);
  const start = await prisma.topic.count({ where: { subjectId } });
  const clean = names.map((n) => n.trim()).filter(Boolean).slice(0, 100);
  for (const [i, n] of clean.entries()) {
    await prisma.topic.create({ data: { subjectId, slug: `${slug(n)}-${uniq()}`, name: n.slice(0, 120), order: start + i, weightage: 3, difficulty: 3, estimatedMinutes: 120 } });
  }
  return { added: clean.length };
}
export async function renameChapter(userId: string, topicId: string, name: string) {
  await ownTopic(userId, topicId);
  return prisma.topic.update({ where: { id: topicId }, data: { name } });
}
export async function deleteChapter(userId: string, topicId: string) {
  await ownTopic(userId, topicId);
  await prisma.topic.delete({ where: { id: topicId } });
}

/** Any student (ready-made or own syllabus) can mark where they stand on a chapter. */
export async function setChapterStatus(userId: string, topicId: string, status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED") {
  const profile = await prisma.studentProfile.findUnique({ where: { userId }, include: { user: true } });
  const topic = await prisma.topic.findUnique({ where: { id: topicId }, include: { subject: true } });
  if (!profile || !topic || topic.subject.examId !== profile.examId) throw notFound("Chapter");
  await prisma.userTopicState.upsert({
    where: { userId_topicId: { userId, topicId } },
    create: { userId, topicId, status, completedAt: status === "COMPLETED" ? new Date() : null },
    update: { status, completedAt: status === "COMPLETED" ? new Date() : null },
  });
  if (status === "COMPLETED") await scheduleInitialRevision(userId, topicId, dayKey(new Date(), profile.user.timezone));
  return { ok: true };
}
