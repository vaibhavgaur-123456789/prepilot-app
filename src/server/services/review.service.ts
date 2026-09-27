import { prisma } from "@/server/db";
import { badRequest } from "@/server/errors";
import { addDays, dayKey, formatMinutes, localHour, weekStart } from "@/lib/engine/dates";
import { scoreTopic } from "@/lib/engine/priority";
import { completionMessage } from "@/lib/engine/triage";
import { parseJson, toJson } from "@/lib/json";
import { getStudentContext } from "./context";
import { checkAchievements } from "./gamification.service";
import { loadTopicInsights, topicWindows } from "./learning.service";
import { recomputeDailyStat } from "./stats.service";

const BLOCKER_LABELS: Record<string, string> = {
  TIME: "Time problem",
  LOW_ENERGY: "Low energy",
  PHONE: "Phone distraction",
  DIFFICULT_TOPIC: "Difficult topic",
  UNEXPECTED_WORK: "Unexpected work",
  OTHER: "Other",
};
export { BLOCKER_LABELS };

/** Morning briefing: today's target, priorities, yesterday's result, one thing to improve. */
export async function dailyBriefing(userId: string, now = new Date()) {
  const ctx = await getStudentContext(userId, now);
  const yesterday = addDays(ctx.today, -1);
  const [tasks, ystat, planDay] = await Promise.all([
    prisma.task.findMany({ where: { userId, date: ctx.today, status: { not: "SKIPPED" }, isOptional: false }, orderBy: { order: "asc" } }),
    prisma.dailyStat.findUnique({ where: { userId_date: { userId, date: yesterday } } }),
    prisma.planDay.findUnique({ where: { userId_date: { userId, date: ctx.today } } }),
  ]);
  const h = localHour(now, ctx.tz);
  const greeting = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  const priorities = [...tasks].sort((a, b) => b.priorityScore - a.priorityScore).slice(0, 4).map((t) => t.title);

  let yesterdayText: string | null = null;
  let improve: string | null = null;
  if (ystat && ystat.plannedMinutes > 0) {
    const pct = Math.round((ystat.actualMinutes / ystat.plannedMinutes) * 100);
    yesterdayText = `${Math.min(pct, 100)}% completed (${formatMinutes(ystat.actualMinutes)} of ${formatMinutes(ystat.plannedMinutes)})`;
    const parts = [
      { v: ystat.revisionScore, t: "Complete your revision block. Spaced revision only works when it's on time." },
      { v: ystat.focusScore, t: "Protect your focus: phone in another room and a single tab open." },
      { v: ystat.executionScore, t: "Start your first block on time. The first 30 minutes set the day." },
      { v: ystat.testingScore, t: "Keep practice accuracy up: slow down on the last read of each question." },
    ].filter((p) => p.v !== null) as { v: number; t: string }[];
    const low = parts.sort((a, b) => a.v - b.v)[0];
    if (low && low.v < 80) improve = low.t;
  }
  return {
    greeting,
    name: ctx.user.name.split(" ")[0],
    targetMinutes: planDay?.plannedMinutes ?? tasks.reduce((s, t) => s + t.plannedMinutes, 0),
    priorities,
    yesterday: yesterdayText,
    improve,
  };
}

/** Evening review: plan vs actual for the day, and the question "what stopped you?". */
export async function nightReview(userId: string, date?: string, now = new Date()) {
  const ctx = await getStudentContext(userId, now);
  const d = date ?? ctx.today;
  const stat = await recomputeDailyStat(userId, d, ctx.tz);
  const tasks = await prisma.task.findMany({ where: { userId, date: d, status: { not: "SKIPPED" }, isOptional: false } });
  const rev = tasks.filter((t) => t.type === "REVISION");
  const remaining = Math.max(0, stat.plannedMinutes - stat.actualMinutes);
  const pct = stat.plannedMinutes > 0 ? Math.min(100, Math.round((stat.actualMinutes / stat.plannedMinutes) * 100)) : 0;
  return {
    date: d,
    plannedMinutes: stat.plannedMinutes,
    actualMinutes: stat.actualMinutes,
    completionPct: pct,
    questions: stat.questions,
    accuracy: stat.questions > 0 ? stat.correct / stat.questions : null,
    revision: rev.length === 0 ? "None due" : rev.every((t) => t.status === "DONE") ? "Completed" : `${rev.filter((t) => t.status === "DONE").length} of ${rev.length} done`,
    remainingMinutes: remaining,
    dailyScore: stat.dailyScore,
    breakdown: { execution: stat.executionScore, focus: stat.focusScore, revision: stat.revisionScore, testing: stat.testingScore },
    message: stat.plannedMinutes > 0 ? completionMessage(pct) : "No plan today.",
    question: remaining > 0 ? `What stopped you from completing the remaining ${formatMinutes(remaining)}?` : null,
    blocker: stat.blocker,
    reviewed: !!stat.reviewedAt,
    blockers: BLOCKER_LABELS,
  };
}

export async function submitNightReview(userId: string, input: { date: string; blocker: string | null; note: string }, now = new Date()) {
  const ctx = await getStudentContext(userId, now);
  if (input.date > ctx.today || input.date < addDays(ctx.today, -2)) throw badRequest("You can review today or the last two days.");
  await recomputeDailyStat(userId, input.date, ctx.tz);
  await prisma.dailyStat.update({ where: { userId_date: { userId, date: input.date } }, data: { blocker: input.blocker, blockerNote: input.note || null, reviewedAt: now } });
  const achievements = await checkAchievements(userId, ctx.today);
  const hint =
    input.blocker === "LOW_ENERGY" ? "If this repeats, tomorrow's blocks get shorter with more breaks." :
    input.blocker === "PHONE" ? "If this repeats, blocks drop to 25 minutes. Try Focus Mode." :
    input.blocker === "DIFFICULT_TOPIC" ? "If this repeats, weak topics start with a concept recap." :
    input.blocker === "TIME" || input.blocker === "UNEXPECTED_WORK" ? "If this repeats, your plan leaves more buffer." :
    "Thanks. This helps the planner learn your patterns.";
  return { ok: true, hint, achievements };
}

export interface WeeklyReportData {
  weekStart: string;
  weekEnd: string;
  studyMinutes: number;
  plannedMinutes: number;
  questions: number;
  accuracy: number | null;
  prevAccuracy: number | null;
  mocks: number;
  bestSubject: { name: string; accuracy: number } | null;
  weakestSubject: { name: string; accuracy: number } | null;
  mostImproved: { topic: string; from: number; to: number } | null;
  consistencyPct: number;
  activeDays: number;
  revisionsDone: number;
  revisionsDue: number;
  priorities: { title: string; reasons: string[] }[];
  headline: string;
}

/** Build (or rebuild) the weekly report for the week containing `anyDay`. */
export async function generateWeeklyReport(userId: string, anyDay?: string, now = new Date()): Promise<WeeklyReportData> {
  const ctx = await getStudentContext(userId, now);
  const ws = weekStart(anyDay ?? addDays(ctx.today, -7));
  const we = addDays(ws, 6);
  const [stats, prev] = await Promise.all([
    prisma.dailyStat.findMany({ where: { userId, date: { gte: ws, lte: we } } }),
    prisma.dailyStat.findMany({ where: { userId, date: { gte: addDays(ws, -7), lt: ws } } }),
  ]);
  const sum = (xs: typeof stats, k: "actualMinutes" | "plannedMinutes" | "questions" | "correct" | "mocksTaken" | "revisionsDone" | "revisionsDue") => xs.reduce((s, d) => s + d[k], 0);
  const q = sum(stats, "questions");
  const pq = sum(prev, "questions");

  // Subject accuracy for the week from question attempts + practice sessions.
  const from = new Date(`${ws}T00:00:00Z`);
  const to = new Date(`${addDays(we, 1)}T00:00:00Z`);
  const [qa, sessions] = await Promise.all([
    prisma.questionAttempt.findMany({ where: { userId, decision: "ATTEMPTED", createdAt: { gte: from, lt: to } }, select: { isCorrect: true, question: { select: { topic: { select: { subject: { select: { name: true } } } } } } } }),
    prisma.studySession.findMany({ where: { userId, status: "COMPLETED", date: { gte: ws, lte: we }, topicId: { not: null } }, select: { questionsAttempted: true, questionsCorrect: true, task: { select: { topic: { select: { subject: { select: { name: true } } } } } } } }),
  ]);
  const subj = new Map<string, { a: number; c: number }>();
  for (const x of qa) {
    const n = x.question.topic.subject.name;
    const s = subj.get(n) ?? { a: 0, c: 0 };
    s.a++;
    if (x.isCorrect) s.c++;
    subj.set(n, s);
  }
  for (const x of sessions) {
    const n = x.task?.topic?.subject.name;
    if (!n) continue;
    const s = subj.get(n) ?? { a: 0, c: 0 };
    s.a += x.questionsAttempted;
    s.c += x.questionsCorrect;
    subj.set(n, s);
  }
  const ranked = [...subj.entries()].filter(([, v]) => v.a >= 10).map(([name, v]) => ({ name, accuracy: v.c / v.a })).sort((a, b) => b.accuracy - a.accuracy);

  const windows = await topicWindows(userId, we, to);
  const topics = await prisma.topic.findMany({ where: { id: { in: [...windows.recent.keys()] } }, select: { id: true, name: true } });
  let mostImproved: WeeklyReportData["mostImproved"] = null;
  for (const t of topics) {
    const r = windows.recent.get(t.id)!;
    const p = windows.prev.get(t.id);
    if (!p || r.attempts < 8 || p.attempts < 8) continue;
    const gain = r.correct / r.attempts - p.correct / p.attempts;
    if (gain > 0.05 && (!mostImproved || gain > mostImproved.to - mostImproved.from)) mostImproved = { topic: t.name, from: p.correct / p.attempts, to: r.correct / r.attempts };
  }

  const insights = await loadTopicInsights(userId, ctx.exam.id, ctx.today, now);
  const priorities = insights
    .filter((i) => i.signals.status !== "COMPLETED" || i.weakness.isWeak)
    .map((i) => ({ i, p: scoreTopic(i.signals, { today: ctx.today, examDate: ctx.profile.examDate }) }))
    .sort((a, b) => b.p.score - a.p.score)
    .slice(0, 3)
    .map((x) => ({ title: `${x.i.signals.subjectName}: ${x.i.signals.topicName}`, reasons: x.p.reasons.slice(0, 2) }));

  const activeDays = stats.filter((d) => d.actualMinutes >= 25).length;
  const accuracy = q > 0 ? sum(stats, "correct") / q : null;
  const prevAccuracy = pq > 0 ? sum(prev, "correct") / pq : null;
  const data: WeeklyReportData = {
    weekStart: ws,
    weekEnd: we,
    studyMinutes: sum(stats, "actualMinutes"),
    plannedMinutes: sum(stats, "plannedMinutes"),
    questions: q,
    accuracy,
    prevAccuracy,
    mocks: sum(stats, "mocksTaken"),
    bestSubject: ranked[0] ?? null,
    weakestSubject: ranked.length > 1 ? ranked[ranked.length - 1] : null,
    mostImproved,
    consistencyPct: Math.round((activeDays / 7) * 100),
    activeDays,
    revisionsDone: sum(stats, "revisionsDone"),
    revisionsDue: sum(stats, "revisionsDue"),
    priorities,
    headline:
      accuracy !== null && prevAccuracy !== null
        ? `Accuracy ${Math.round(prevAccuracy * 100)}% → ${Math.round(accuracy * 100)}% with ${formatMinutes(sum(stats, "actualMinutes"))} of study.`
        : `${formatMinutes(sum(stats, "actualMinutes"))} of study across ${activeDays} day${activeDays === 1 ? "" : "s"}.`,
  };
  await prisma.weeklyReport.upsert({ where: { userId_weekStart: { userId, weekStart: ws } }, create: { userId, weekStart: ws, data: toJson(data) }, update: { data: toJson(data) } });
  return data;
}

export async function listWeeklyReports(userId: string) {
  const rows = await prisma.weeklyReport.findMany({ where: { userId }, orderBy: { weekStart: "desc" }, take: 12 });
  return rows.map((r) => parseJson<WeeklyReportData>(r.data, {} as WeeklyReportData));
}

export function isEvening(now: Date, tz: string) {
  return localHour(now, tz) >= 19;
}
export { dayKey };
