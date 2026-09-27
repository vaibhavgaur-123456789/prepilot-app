import { prisma } from "@/server/db";
import { addDays, diffDays, formatMinutes } from "@/lib/engine/dates";
import { topRecurring, type MistakeCategory } from "@/lib/engine/mistakes";
import { scoreTopic } from "@/lib/engine/priority";
import { parseJson } from "@/lib/json";
import { getStudentContext } from "@/server/services/context";
import { loadTopicInsights } from "@/server/services/learning.service";
import { ensureDayPlan, paceFor } from "@/server/services/planner.service";
import { revisionQueue } from "@/server/services/revision.service";
import { xpSummary } from "@/server/services/gamification.service";

/**
 * A compact, bounded summary of the student's measured data. This, not the database, is what the model sees.
 */
export async function buildCoachContext(userId: string, now = new Date()) {
  const ctx = await getStudentContext(userId, now);
  const { today } = ctx;
  const [plan, stats, insights, revisions, lastMock, mistakes, readiness, pace] = await Promise.all([
    ensureDayPlan(userId, { now }),
    prisma.dailyStat.findMany({ where: { userId, date: { gte: addDays(today, -7), lt: today } }, orderBy: { date: "asc" } }),
    loadTopicInsights(userId, ctx.exam.id, today, now),
    revisionQueue(userId, ctx.exam.id, today),
    prisma.mockAttempt.findFirst({ where: { userId, status: "SUBMITTED" }, orderBy: { submittedAt: "desc" }, include: { mock: true } }),
    prisma.mistake.findMany({ where: { userId, resolved: false }, select: { category: true, topic: { select: { name: true } } } }),
    prisma.readinessSnapshot.findFirst({ where: { userId }, orderBy: { date: "desc" } }),
    paceFor(ctx, now),
  ]);

  const priorities = insights
    .filter((i) => i.signals.status !== "COMPLETED" || i.weakness.isWeak)
    .map((i) => ({ i, p: scoreTopic(i.signals, { today, examDate: ctx.profile.examDate }) }))
    .sort((a, b) => b.p.score - a.p.score)
    .slice(0, 6)
    .map((x) => ({ topic: `${x.i.signals.subjectName}: ${x.i.signals.topicName}`, topicId: x.i.signals.topicId, score: x.p.score, reasons: x.p.reasons.slice(0, 3), type: x.i.signals.status === "NOT_STARTED" ? "learn" : "practice" }));

  const weak = insights
    .filter((i) => i.weakness.isWeak)
    .map((i) => ({ topic: i.signals.topicName, subject: i.signals.subjectName, accuracy: i.weakness.accuracy, attempts: i.signals.attempts, trend: i.weakness.trend, step: i.signals.recoveryStep, mistakes: i.signals.recentMistakes }))
    .slice(0, 6);

  const subjects = new Map<string, { a: number; c: number; recentA: number; recentC: number; prevA: number; prevC: number }>();
  for (const i of insights) {
    const s = subjects.get(i.signals.subjectName) ?? { a: 0, c: 0, recentA: 0, recentC: 0, prevA: 0, prevC: 0 };
    s.a += i.signals.attempts;
    s.c += i.signals.correct;
    s.recentA += i.signals.recentAttempts;
    s.recentC += i.signals.recentCorrect;
    s.prevA += i.signals.previousAttempts;
    s.prevC += i.signals.previousCorrect;
    subjects.set(i.signals.subjectName, s);
  }

  const analysis = lastMock ? parseJson<{ bySubject?: { name: string; accuracy: number | null; correct: number; wrong: number; skipped: number }[]; insights?: string[]; overconfident?: string[]; time?: { overTime: number; fastWrong: number } }>(lastMock.analysis, {}) : null;

  const xp = await xpSummary(userId, today);
  const todayStat = await prisma.dailyStat.findUnique({ where: { userId_date: { userId, date: today } } });
  return {
    language: ctx.user.language,
    progress: { streak: xp.streak, bestStreak: xp.bestStreak, level: xp.level, xp: xp.xp, todayMinutes: todayStat?.actualMinutes ?? 0, weekMinutes: stats.reduce((s, d) => s + d.actualMinutes, 0) },
    // Every chapter with its numbers, for topic questions ("percentage kaise sudharu?"). Not sent to the LLM in full.
    topics: insights.map((i) => ({ name: i.signals.topicName, subject: i.signals.subjectName, status: i.signals.status, attempts: i.signals.attempts, accuracy: i.weakness.accuracy, minutes: i.signals.minutesStudied, revisionOn: i.signals.nextRevisionOn, weak: i.weakness.isWeak, step: i.signals.recoveryStep })),
    student: { name: ctx.user.name.split(" ")[0], exam: ctx.exam.name, examDate: ctx.profile.examDate, daysLeft: diffDays(today, ctx.profile.examDate), dailyAvailable: formatMinutes(ctx.profile.dailyMinutes), recoveryMode: ctx.profile.recoveryMode },
    today: {
      date: today,
      tasks: plan.tasks.map((t) => ({ title: t.title, type: t.type, minutes: t.plannedMinutes, status: t.status, reasons: t.reasons.slice(0, 2) })),
      notes: plan.planDay?.notes ?? [],
    },
    last7Days: stats.map((d) => ({ date: d.date, planned: d.plannedMinutes, actual: d.actualMinutes, questions: d.questions, accuracy: d.questions ? Math.round((d.correct / d.questions) * 100) : null, blocker: d.blocker })),
    priorities,
    weakTopics: weak,
    subjects: [...subjects.entries()].map(([name, s]) => ({
      name,
      accuracy: s.a >= 10 ? Math.round((s.c / s.a) * 100) : null,
      recentAccuracy: s.recentA >= 5 ? Math.round((s.recentC / s.recentA) * 100) : null,
      previousAccuracy: s.prevA >= 5 ? Math.round((s.prevC / s.prevA) * 100) : null,
    })),
    revisionsDue: revisions.filter((r) => r.due).map((r) => ({ topic: r.topicName, overdueDays: r.overdueDays })),
    lastMock: lastMock
      ? { title: lastMock.mock.title, percent: lastMock.percent, accuracy: lastMock.accuracy, attemptRate: lastMock.attemptRate, bySubject: analysis?.bySubject ?? [], insights: analysis?.insights ?? [], overconfidentCount: analysis?.overconfident?.length ?? 0, time: analysis?.time ?? null }
      : null,
    mistakes: { open: mistakes.length, top: topRecurring(mistakes.map((m) => m.category as MistakeCategory)), byTopic: Object.entries(mistakes.reduce<Record<string, number>>((a, m) => ({ ...a, [m.topic.name]: (a[m.topic.name] ?? 0) + 1 }), {})).sort((a, b) => b[1] - a[1]).slice(0, 5) },
    readiness: readiness ? { score: readiness.score, confidence: readiness.confidence, components: parseJson<Record<string, number | null>>(readiness.components, {}) } : null,
    pace: { summary: pace.summary, questionsPerDay: { current: pace.questions.current, required: pace.questions.required }, mocksPerWeek: { current: pace.mocks.current, required: pace.mocks.required } },
  };
}
export type CoachContext = Awaited<ReturnType<typeof buildCoachContext>>;
