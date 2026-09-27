import { prisma } from "@/server/db";
import { addDays, diffDays, localHour, localMinutes, toMinutes } from "@/lib/engine/dates";
import { READINESS_LABELS } from "@/lib/engine/readiness";
import { parseJson } from "@/lib/json";
import { getStudentContext } from "./context";
import { weeklyChallenge, xpSummary } from "./gamification.service";
import { loadTopicInsights } from "./learning.service";
import { ensureDayPlan, paceFor } from "./planner.service";
import { refreshReadiness } from "./readiness.service";
import { revisionQueue } from "./revision.service";
import { dailyBriefing } from "./review.service";
import { generateNotifications } from "./notifications.service";

/** Everything the Home screen needs, built to answer "what should I do now?" first. */
export async function getHome(userId: string, now = new Date()) {
  const plan = await ensureDayPlan(userId, { now });
  const ctx = await getStudentContext(userId, now);
  const today = ctx.today;

  const [todayStat, weekStats, snapshot, weekAgoSnap, insights, revisions, xp, briefing, unread, challenge, pace] = await Promise.all([
    prisma.dailyStat.findUnique({ where: { userId_date: { userId, date: today } } }),
    prisma.dailyStat.findMany({ where: { userId, date: { gte: addDays(today, -6), lte: today } } }),
    prisma.readinessSnapshot.findUnique({ where: { userId_date: { userId, date: today } } }),
    prisma.readinessSnapshot.findFirst({ where: { userId, date: { lte: addDays(today, -7) } }, orderBy: { date: "desc" } }),
    loadTopicInsights(userId, ctx.exam.id, today, now),
    revisionQueue(userId, ctx.exam.id, today),
    xpSummary(userId, today),
    dailyBriefing(userId, now),
    prisma.notification.count({ where: { userId, readAt: null, scheduledFor: { lte: now } } }),
    weeklyChallenge(userId, today),
    paceFor(ctx, now),
  ]);
  const readiness = snapshot ? { score: snapshot.score, confidence: snapshot.confidence, components: parseJson<Record<string, number | null>>(snapshot.components, {}) } : await refreshReadiness(userId, now).then((r) => ({ score: r.score, confidence: r.confidence, components: Object.fromEntries(r.components.map((c) => [c.key, c.value])) }));

  // Next action: the first unfinished required task, preferring the one whose time has come.
  const nowMin = localMinutes(now, ctx.tz);
  const open = plan.tasks.filter((t) => ["PENDING", "IN_PROGRESS", "PARTIAL"].includes(t.status) && !t.isOptional);
  const next = open.find((t) => t.status === "IN_PROGRESS") ?? open.find((t) => t.startTime && toMinutes(t.startTime) + t.plannedMinutes >= nowMin) ?? open[0] ?? null;

  const attention = [
    ...insights
      .filter((i) => i.weakness.isWeak)
      .sort((a, b) => (a.weakness.priority === "HIGH" ? -1 : 1) - (b.weakness.priority === "HIGH" ? -1 : 1) || (a.weakness.smoothed - b.weakness.smoothed))
      .slice(0, 3)
      .map((i) => ({ kind: "WEAK" as const, title: `${i.signals.subjectName}: ${i.signals.topicName}`, detail: `Accuracy ${Math.round((i.weakness.accuracy ?? 0) * 100)}% over ${i.signals.attempts} questions${i.weakness.trend === "DECLINING" ? ", declining" : ""}`, priority: i.weakness.priority })),
    ...revisions.filter((r) => r.overdueDays > 0).slice(0, 2).map((r) => ({ kind: "REVISION" as const, title: `${r.subjectName}: ${r.topicName}`, detail: `Revision overdue by ${r.overdueDays} day${r.overdueDays === 1 ? "" : "s"}`, priority: "MEDIUM" as const })),
  ];

  const wMinutes = weekStats.reduce((s, d) => s + d.actualMinutes, 0);
  const wQ = weekStats.reduce((s, d) => s + d.questions, 0);
  const wC = weekStats.reduce((s, d) => s + d.correct, 0);
  const milestones = [
    { at: 3, label: "3-day consistency" }, { at: 7, label: "7-day consistency" }, { at: 10, label: "10-day consistency" }, { at: 14, label: "14-day consistency" }, { at: 30, label: "30-day consistency" },
  ];
  const nextMilestone = milestones.find((m) => m.at > xp.streak) ?? { at: xp.streak + 10, label: `${xp.streak + 10}-day consistency` };

  // Fire due in-app notifications lazily (the cron endpoint does the same for inactive users).
  await generateNotifications(userId, now).catch(() => undefined);

  return {
    user: { name: ctx.user.name, firstName: ctx.user.name.split(" ")[0] },
    exam: { name: ctx.exam.name, shortName: ctx.exam.shortName, date: ctx.profile.examDate, daysLeft: Math.max(0, diffDays(today, ctx.profile.examDate)) },
    today,
    briefing,
    recovery: plan.planDay?.mode === "RECOVERY",
    notes: plan.planDay?.notes ?? [],
    progress: {
      plannedMinutes: todayStat?.plannedMinutes ?? plan.planDay?.plannedMinutes ?? 0,
      actualMinutes: todayStat?.actualMinutes ?? 0,
      tasksDone: plan.tasks.filter((t) => t.status === "DONE").length,
      tasksTotal: plan.tasks.filter((t) => t.status !== "SKIPPED" && !t.isOptional).length,
      dailyScore: todayStat?.dailyScore ?? null,
    },
    next: next ? { id: next.id, mockId: next.mockId, type: next.type, title: next.title, plannedMinutes: next.plannedMinutes, questionTarget: next.questionTarget, startTime: next.startTime, objective: next.objective, reasons: next.reasons } : null,
    readiness: {
      ...readiness,
      delta: weekAgoSnap ? readiness.score - weekAgoSnap.score : null,
      labels: READINESS_LABELS,
    },
    attention,
    week: {
      minutes: wMinutes,
      questions: wQ,
      accuracy: wQ > 0 ? wC / wQ : null,
      mocks: weekStats.reduce((s, d) => s + d.mocksTaken, 0),
      consistencyPct: Math.round((weekStats.filter((d) => d.actualMinutes >= 25).length / 7) * 100),
    },
    xp,
    challenge,
    nextMilestone: { ...nextMilestone, progress: xp.streak },
    pace: { summary: pace.summary, questions: pace.questions, mocks: pace.mocks, syllabus: pace.syllabus },
    unreadNotifications: unread,
    nightReviewDue: localHour(now, ctx.tz) >= 19 && !todayStat?.reviewedAt && (todayStat?.plannedMinutes ?? 0) > 0,
  };
}
export type HomeData = Awaited<ReturnType<typeof getHome>>;
