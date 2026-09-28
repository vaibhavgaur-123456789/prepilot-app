import { prisma } from "@/server/db";
import { addDays, diffDays, localHour, rangeDays, weekdayIndex } from "@/lib/engine/dates";
import { listPapers } from "./paper.service";
import { computeInsights } from "@/lib/engine/insights";
import { PATHWAY } from "@/lib/engine/weakness";
import { getStudentContext } from "./context";
import { personalRecords } from "./gamification.service";
import { loadTopicInsights } from "./learning.service";
import { mistakeSummary } from "./mistakes.service";
import { mockHistory } from "./mock.service";
import { paceFor } from "./planner.service";
import { readinessHistory, refreshReadiness, syllabusCoverage } from "./readiness.service";
import { revisionHealth, revisionQueue } from "./revision.service";
import { benchmarkComparisons } from "./benchmark.service";

export async function getAnalytics(userId: string, days: 7 | 30 = 30, now = new Date()) {
  const ctx = await getStudentContext(userId, now);
  const from = addDays(ctx.today, -(days - 1));
  const [stats, insights, readiness, rHistory, mocks, rev, queue, cov, pace, mistakes, records, sessions, benchmark] = await Promise.all([
    prisma.dailyStat.findMany({ where: { userId, date: { gte: from, lte: ctx.today } }, orderBy: { date: "asc" } }),
    loadTopicInsights(userId, ctx.exam.id, ctx.today, now),
    refreshReadiness(userId, now),
    readinessHistory(userId, 90),
    mockHistory(userId, 20),
    revisionHealth(userId, ctx.today),
    revisionQueue(userId, ctx.exam.id, ctx.today),
    syllabusCoverage(userId, ctx.exam.id),
    paceFor(ctx, now),
    mistakeSummary(userId),
    personalRecords(userId),
    prisma.studySession.findMany({ where: { userId, status: "COMPLETED", validated: true, startedAt: { gte: new Date(now.getTime() - 60 * 86_400_000) } }, include: { task: { include: { topic: { include: { subject: true } } } } } }),
    benchmarkComparisons(userId, now),
  ]);

  // Fitness-tracker style heatmap: the last 16 weeks, Monday first.
  const heatFrom = addDays(ctx.today, -(7 * 15 + weekdayIndex(ctx.today)));
  const [heatRows, papers] = await Promise.all([
    prisma.dailyStat.findMany({ where: { userId, date: { gte: heatFrom, lte: ctx.today } }, select: { date: true, actualMinutes: true, leave: true } }),
    listPapers(userId, 30),
  ]);
  const heatBy = new Map(heatRows.map((r) => [r.date, r]));
  const heatmap = rangeDays(heatFrom, ctx.today).map((date) => ({ date, minutes: heatBy.get(date)?.actualMinutes ?? 0, leave: heatBy.get(date)?.leave ?? false }));

  const byDate = new Map(stats.map((s) => [s.date, s]));
  const series = rangeDays(from, ctx.today).map((date) => {
    const s = byDate.get(date);
    return {
      date,
      planned: s?.plannedMinutes ?? 0,
      actual: s?.actualMinutes ?? 0,
      questions: s?.questions ?? 0,
      accuracy: s && s.questions >= 5 ? Math.round((s.correct / s.questions) * 100) : null,
      score: s?.dailyScore ?? null,
    };
  });

  // Subject performance.
  const subjects = new Map<string, { name: string; attempts: number; correct: number; units: number; doneUnits: number; minutes: number; weak: number }>();
  for (const i of insights) {
    const s = subjects.get(i.signals.subjectId) ?? { name: i.signals.subjectName, attempts: 0, correct: 0, units: 0, doneUnits: 0, minutes: 0, weak: 0 };
    s.attempts += i.signals.attempts;
    s.correct += i.signals.correct;
    s.units += i.signals.weightage;
    s.doneUnits += i.signals.status === "COMPLETED" ? i.signals.weightage : i.signals.status === "IN_PROGRESS" ? i.signals.weightage / 2 : 0;
    s.minutes += i.signals.minutesStudied;
    if (i.weakness.isWeak) s.weak++;
    subjects.set(i.signals.subjectId, s);
  }
  const subjectPerformance = [...subjects.entries()].map(([id, s]) => ({
    id,
    name: s.name,
    accuracy: s.attempts >= 10 ? Math.round((s.correct / s.attempts) * 100) : null,
    attempts: s.attempts,
    coverage: s.units > 0 ? Math.round((s.doneUnits / s.units) * 100) : 0,
    hours: Math.round((s.minutes / 60) * 10) / 10,
    weakTopics: s.weak,
  }));

  const weakTopics = insights
    .filter((i) => i.weakness.isWeak || i.signals.recoveryStep > 0)
    .map((i) => ({
      topicId: i.signals.topicId,
      topic: i.signals.topicName,
      subject: i.signals.subjectName,
      accuracy: i.weakness.accuracy,
      attempts: i.signals.attempts,
      trend: i.weakness.trend,
      priority: i.weakness.priority ?? "MEDIUM",
      step: i.signals.recoveryStep,
      pathway: PATHWAY.map((p) => p.name),
      reasons: i.weakness.reasons,
    }))
    .sort((a, b) => (a.priority === b.priority ? (a.accuracy ?? 1) - (b.accuracy ?? 1) : a.priority === "HIGH" ? -1 : 1));

  const facts = sessions.map((s) => ({
    localHour: localHour(s.startedAt, ctx.tz),
    subjectName: s.task?.topic?.subject.name ?? null,
    activeMinutes: s.activeSeconds / 60,
    questions: s.questionsAttempted,
    correct: s.questionsCorrect,
    focusRating: s.focusRating,
    distractions: s.distractionCount,
  }));

  const totals = {
    minutes: series.reduce((s, d) => s + d.actual, 0),
    planned: series.reduce((s, d) => s + d.planned, 0),
    questions: stats.reduce((s, d) => s + d.questions, 0),
    correct: stats.reduce((s, d) => s + d.correct, 0),
    activeDays: stats.filter((d) => d.actualMinutes >= 25).length,
  };

  return {
    days,
    exam: { name: ctx.exam.name, date: ctx.profile.examDate, daysLeft: Math.max(0, diffDays(ctx.today, ctx.profile.examDate)) },
    totals: { ...totals, accuracy: totals.questions > 0 ? totals.correct / totals.questions : null, completion: totals.planned > 0 ? Math.min(1, totals.minutes / totals.planned) : null },
    series,
    readiness,
    readinessHistory: rHistory,
    mocks,
    papers,
    heatmap,
    subjectPerformance,
    weakTopics,
    revision: { ...rev, dueNow: queue.filter((q) => q.due).length, upcoming: queue.filter((q) => !q.due).length, queue: queue.slice(0, 10) },
    coverage: cov,
    pace,
    mistakes,
    records,
    insights: computeInsights(facts),
    benchmark,
  };
}
export type AnalyticsData = Awaited<ReturnType<typeof getAnalytics>>;
