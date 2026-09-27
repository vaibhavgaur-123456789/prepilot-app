import { prisma } from "@/server/db";
import { badRequest, notFound } from "@/server/errors";
import { parseJson, toJson } from "@/lib/json";

async function audit(actorId: string, action: string, entity: string, entityId: string, detail: unknown = {}) {
  await prisma.adminAuditLog.create({ data: { actorId, action, entity, entityId, detail: toJson(detail) } });
}

/** Product health, centred on "is measured preparation improving?" rather than app opens. */
export async function productMetrics(now = new Date()) {
  const day = (n: number) => new Date(now.getTime() - n * 86_400_000).toISOString().slice(0, 10);
  const users = await prisma.user.findMany({ where: { onboardedAt: { not: null } }, select: { id: true, createdAt: true } });
  const retention = async (d: number) => {
    const cohort = users.filter((u) => u.createdAt <= new Date(now.getTime() - d * 86_400_000));
    if (!cohort.length) return null;
    let kept = 0;
    for (const u of cohort) {
      const target = new Date(u.createdAt.getTime() + d * 86_400_000).toISOString().slice(0, 10);
      const active = await prisma.productEvent.count({ where: { userId: u.id, date: { gte: target, lte: new Date(u.createdAt.getTime() + (d + 2) * 86_400_000).toISOString().slice(0, 10) } } });
      if (active) kept++;
    }
    return Math.round((kept / cohort.length) * 100);
  };
  const [d1, d7, d30] = await Promise.all([retention(1), retention(7), retention(30)]);
  const week = await prisma.dailyStat.findMany({ where: { date: { gte: day(6) } } });
  const wau = new Set(week.filter((w) => w.actualMinutes > 0).map((w) => w.userId)).size;
  const planned = week.reduce((s, w) => s + w.plannedMinutes, 0);
  const actual = week.reduce((s, w) => s + w.actualMinutes, 0);
  const sessions = await prisma.studySession.count({ where: { status: "COMPLETED", date: { gte: day(6) } } });
  const activeDays = week.filter((w) => w.actualMinutes > 0).length;
  const [mocks, coach, recovery, recoveryExit] = await Promise.all([
    prisma.productEvent.count({ where: { name: "mock_submit", date: { gte: day(6) } } }),
    prisma.productEvent.count({ where: { name: "coach_message", date: { gte: day(6) } } }),
    prisma.productEvent.count({ where: { name: "recovery_enter" } }),
    prisma.productEvent.count({ where: { name: "recovery_exit" } }),
  ]);
  // North star: share of active students whose 4-week readiness trend is positive.
  let improving = 0;
  let measured = 0;
  for (const u of users) {
    const snaps = await prisma.readinessSnapshot.findMany({ where: { userId: u.id, date: { gte: day(28) } }, orderBy: { date: "asc" }, select: { score: true } });
    if (snaps.length < 2) continue;
    measured++;
    if (snaps[snaps.length - 1].score > snaps[0].score) improving++;
  }
  return {
    northStar: { improvingPct: measured ? Math.round((improving / measured) * 100) : null, measured },
    retention: { d1, d7, d30 },
    wau,
    students: users.length,
    planCompletionPct: planned ? Math.round((actual / planned) * 100) : null,
    sessionsPerActiveDay: activeDays ? Math.round((sessions / activeDays) * 10) / 10 : null,
    studyHoursPerWeekPerStudent: wau ? Math.round((actual / 60 / wau) * 10) / 10 : null,
    questionsPerWeek: week.reduce((s, w) => s + w.questions, 0),
    mocksPerWeek: mocks,
    revisionCompletionPct: week.reduce((s, w) => s + w.revisionsDue, 0) ? Math.round((week.reduce((s, w) => s + w.revisionsDone, 0) / week.reduce((s, w) => s + w.revisionsDue, 0)) * 100) : null,
    coachMessagesPerWeek: coach,
    recovery: { entered: recovery, exited: recoveryExit },
  };
}

export async function listExamsAdmin() {
  // Students' personal syllabi are private and not listed here.
  return prisma.exam.findMany({ where: { ownerId: null }, include: { _count: { select: { subjects: true, mocks: true, profiles: true } } }, orderBy: { name: "asc" } });
}

export async function examTree(examId: string) {
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: {
      sections: { orderBy: { order: "asc" } },
      subjects: { orderBy: { order: "asc" }, include: { topics: { orderBy: { order: "asc" }, include: { _count: { select: { questions: true } } } } } },
      benchmarks: { where: { subjectId: null, topicId: null }, orderBy: { metric: "asc" } },
      mocks: { where: { createdById: null }, include: { _count: { select: { questions: true } } }, orderBy: { title: "asc" } },
    },
  });
  if (!exam) throw notFound("Exam");
  return exam;
}

export async function updateExam(actorId: string, id: string, patch: { name?: string; durationMinutes?: number; negativeMarking?: number; marksPerQuestion?: number; isActive?: boolean; description?: string }) {
  const e = await prisma.exam.update({ where: { id }, data: patch });
  await audit(actorId, "update", "Exam", id, patch);
  return e;
}

export async function createExam(actorId: string, input: { slug: string; name: string; shortName: string; category: string; durationMinutes: number; totalQuestions: number; marksPerQuestion: number; negativeMarking: number }) {
  // Starts hidden from students; the admin activates it once subjects, topics and questions are in.
  const e = await prisma.exam.create({ data: { ...input, isActive: false } });
  await audit(actorId, "create", "Exam", e.id, input);
  return e;
}

export async function createSubject(actorId: string, examId: string, input: { name: string; slug: string; weightage: number; isQuantitative: boolean; isMemoryBased: boolean }) {
  const count = await prisma.subject.count({ where: { examId } });
  const s = await prisma.subject.create({ data: { examId, ...input, order: count } });
  await audit(actorId, "create", "Subject", s.id, input);
  return s;
}

export async function upsertTopic(actorId: string, input: { id?: string; subjectId: string; name: string; slug: string; weightage: number; difficulty: number; estimatedMinutes: number; parentId?: string | null }) {
  if (input.weightage < 1 || input.weightage > 5 || input.difficulty < 1 || input.difficulty > 5) throw badRequest("Weightage and difficulty must be 1–5.");
  const { id, ...data } = input;
  const t = id ? await prisma.topic.update({ where: { id }, data }) : await prisma.topic.create({ data: { ...data, order: await prisma.topic.count({ where: { subjectId: input.subjectId } }) } });
  await audit(actorId, id ? "update" : "create", "Topic", t.id, data);
  return t;
}

export async function listQuestions(topicId: string) {
  const qs = await prisma.question.findMany({ where: { topicId }, orderBy: { createdAt: "asc" } });
  return qs.map((q) => ({ ...q, options: parseJson<string[]>(q.options, []) }));
}

export async function upsertQuestion(actorId: string, input: { id?: string; topicId: string; stem: string; options: string[]; correctIndex: number; explanation: string; difficulty: number; expectedSeconds: number; isActive: boolean }) {
  if (input.options.length < 2 || input.options.length > 6) throw badRequest("A question needs 2–6 options.");
  if (input.correctIndex < 0 || input.correctIndex >= input.options.length) throw badRequest("Correct answer must be one of the options.");
  if (new Set(input.options.map((o) => o.trim())).size !== input.options.length) throw badRequest("Options must be distinct.");
  const { id, options, ...rest } = input;
  const data = { ...rest, options: toJson(options.map((o) => o.trim())) };
  const q = id ? await prisma.question.update({ where: { id }, data }) : await prisma.question.create({ data: { ...data, source: "Admin" } });
  await audit(actorId, id ? "update" : "create", "Question", q.id, { topicId: input.topicId });
  return q;
}

export async function updateBenchmark(actorId: string, id: string, patch: { value: number; p25: number | null; p75: number | null }) {
  const b = await prisma.benchmarkStat.findUnique({ where: { id } });
  if (!b) throw notFound("Benchmark");
  if (b.source !== "REFERENCE") throw badRequest("Aggregated benchmarks are computed from students and can't be edited.");
  const r = await prisma.benchmarkStat.update({ where: { id }, data: { ...patch, computedAt: new Date() } });
  await audit(actorId, "update", "BenchmarkStat", id, patch);
  return r;
}

/**
 * (Re)build an exam's official tests from its question bank: one full mock sized to the exam pattern
 * (split across subjects by weightage), one sectional test per subject, and a short diagnostic.
 * Tests that students already attempted are kept; unattempted official tests are replaced.
 */
export async function buildMocks(actorId: string, examId: string) {
  const exam = await prisma.exam.findUnique({ where: { id: examId }, include: { subjects: { orderBy: { order: "asc" }, include: { topics: { include: { questions: { where: { isActive: true }, select: { id: true } } } } } } } });
  if (!exam) throw notFound("Exam");
  const pools = exam.subjects
    .map((s) => {
      // Interleave topics so each test mixes them evenly.
      const lists = s.topics.map((t) => t.questions.map((q) => q.id));
      const out: string[] = [];
      for (let i = 0; i < Math.max(0, ...lists.map((l) => l.length)); i++) for (const l of lists) if (i < l.length) out.push(l[i]);
      return { subject: s, ids: out };
    })
    .filter((p) => p.ids.length > 0);
  const total = pools.reduce((s, p) => s + p.ids.length, 0);
  if (total < 5) throw badRequest("Add at least 5 questions to this exam before building tests.");

  await prisma.mock.deleteMany({ where: { examId, createdById: null, attempts: { none: {} } } });
  const make = async (title: string, type: string, durationMinutes: number, ids: string[]) => {
    const unique = [...new Set(ids)];
    if (!unique.length) return 0;
    const m = await prisma.mock.create({ data: { examId, title, type, durationMinutes: Math.max(5, durationMinutes) } });
    await prisma.mockQuestion.createMany({ data: unique.map((questionId, order) => ({ mockId: m.id, questionId, order, marks: exam.marksPerQuestion })) });
    return 1;
  };
  const weightSum = pools.reduce((s, p) => s + (p.subject.weightage || 1), 0);
  const target = Math.min(exam.totalQuestions, total);
  const full = pools.flatMap((p) => p.ids.slice(0, Math.max(1, Math.round((target * (p.subject.weightage || 1)) / weightSum))));
  let created = await make(`${exam.shortName} Full Mock`, "FULL", Math.round((exam.durationMinutes * full.length) / Math.max(1, exam.totalQuestions)), full);
  for (const p of pools) {
    const ids = p.ids.slice(0, 25);
    created += await make(`${exam.shortName} Sectional: ${p.subject.name}`, "SECTIONAL", Math.round((exam.durationMinutes * ids.length) / Math.max(1, exam.totalQuestions)), ids);
  }
  const diag = pools.flatMap((p) => p.ids.slice(0, 4));
  created += await make(`${exam.shortName} Baseline Diagnostic`, "DIAGNOSTIC", diag.length, diag);
  await audit(actorId, "build", "Mocks", examId, { created, questions: total });
  return { created, questions: total };
}

export async function recentAudit() {
  return prisma.adminAuditLog.findMany({ orderBy: { createdAt: "desc" }, take: 30 });
}
