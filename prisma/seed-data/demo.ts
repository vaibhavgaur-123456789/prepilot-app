// Demo accounts with ~3 weeks of history, produced by running the REAL services day by day
// (plan → study sessions → mocks → revision → night review), so every number is internally consistent.
//
// Demo credentials (development only):
//   demo@preppilot.app   / demo-pass-2026   (student, SSC CGL)
//   admin@preppilot.app  / admin-pass-2026  (admin)
import type { PrismaClient } from "@prisma/client";
import { mulberry32 } from "./generators";
import { hashPassword } from "../../src/server/auth/password";
import { addDays, dayKey, toMinutes } from "../../src/lib/engine/dates";
import { completeOnboarding, listExams } from "../../src/server/services/onboarding.service";
import { ensureDayPlan } from "../../src/server/services/planner.service";
import { completeSession, startSession } from "../../src/server/services/session.service";
import { startAttempt, submitAttempt } from "../../src/server/services/mock.service";
import { submitNightReview, generateWeeklyReport } from "../../src/server/services/review.service";
import { refreshReadiness } from "../../src/server/services/readiness.service";

const TZ = "Asia/Kolkata";
const DAYS = 21;
const r = mulberry32(20260927);

/** Local IST time on a given day → Date. */
function at(day: string, hhmm: string) {
  return new Date(new Date(`${day}T${hhmm}:00+05:30`).getTime());
}

// "True skill" per subject; Quant improves over the three weeks.
function skill(subject: string, d: number) {
  if (subject.startsWith("Quant")) return 0.5 + d * 0.012;
  if (subject === "Reasoning") return 0.76;
  if (subject === "English") return 0.83;
  if (subject === "General Science") return 0.52;
  return 0.62;
}

// Execution pattern: strong week, a rough patch (triggers recovery mode), then a steady recovery.
function executionFor(d: number) {
  if (d >= 8 && d <= 10) return 0.25;
  if (d === 5) return 0.6;
  return 0.8 + r() * 0.2;
}

export async function seedDemo(prisma: PrismaClient) {
  const existing = await prisma.user.findUnique({ where: { email: "demo@preppilot.app" } });
  if (existing) {
    console.log("demo user exists, skipping history simulation");
    return;
  }
  if (!(await prisma.user.findUnique({ where: { email: "admin@preppilot.app" } }))) {
    await prisma.user.create({ data: { email: "admin@preppilot.app", name: "Content Admin", role: "ADMIN", passwordHash: await hashPassword("admin-pass-2026"), notificationPrefs: { create: {} } } });
  }
  const user = await prisma.user.create({
    data: { email: "demo@preppilot.app", name: "Aarti Sharma", passwordHash: await hashPassword("demo-pass-2026"), timezone: TZ, createdAt: at(addDays(dayKey(new Date(), TZ), -DAYS), "07:00"), notificationPrefs: { create: {} } },
  });

  const today = dayKey(new Date(), TZ);
  const start = addDays(today, -DAYS);
  const exam = (await listExams()).find((e) => e.shortName === "SSC CGL")!;
  const quant = exam.subjects.find((s) => s.name.startsWith("Quant"))!;
  const english = exam.subjects.find((s) => s.name === "English")!;
  await completeOnboarding(
    user.id,
    {
      name: "Aarti Sharma", ageRange: "22_25", examId: exam.id, examDate: addDays(today, 60), targetScore: 150, prepLevel: "INTERMEDIATE",
      dailyMinutes: 240, preferredSlots: ["MORNING", "EVENING"], dailyGoalMinutes: 240, weeklyGoalMinutes: 1500,
      completedTopicIds: english.topics.slice(0, 4).map((t) => t.id), inProgressTopicIds: [quant.topics[2].id],
      weakSubjectIds: [quant.id], strongSubjectIds: [english.id], previousMockScores: [52, 58], language: "en", notifications: true, benchmarkOptIn: true, timezone: TZ,
    },
    at(start, "07:00"),
  );
  await prisma.studentProfile.update({ where: { userId: user.id }, data: { createdAt: at(start, "07:00") } });

  const subjectOf = new Map<string, string>();
  for (const s of exam.subjects) for (const t of s.topics) subjectOf.set(t.id, s.name);

  let sessionNo = 0;
  for (let d = 0; d < DAYS; d++) {
    const day = addDays(start, d);
    const plan = await ensureDayPlan(user.id, { now: at(day, "06:45") });
    const exec = executionFor(d);
    let planned = 0;
    let done = 0;

    for (const task of plan.tasks) {
      planned += task.plannedMinutes;
      if (task.status === "DONE" || !task.startTime) continue;
      if (r() > exec) continue; // skipped: will be triaged tomorrow
      const begin = at(day, task.startTime);
      const subject = task.topicId ? subjectOf.get(task.topicId) ?? "" : "";

      if (task.type === "MOCK" && task.mockId) {
        const attempt = await startAttempt(user.id, task.mockId, begin);
        const qs = await prisma.question.findMany({ where: { id: { in: attempt.questions.map((q) => q.id) } }, include: { topic: { include: { subject: true } } } });
        const answers: Record<string, { selected: number | null; timeSpentSec: number; confidence: "LOW" | "MEDIUM" | "HIGH" | null }> = {};
        for (const q of qs) {
          const p = skill(q.topic.subject.name, d);
          if (r() < 0.12) {
            answers[q.id] = { selected: null, timeSpentSec: 15, confidence: null };
            continue;
          }
          const correct = r() < p;
          const conf = r() < 0.25 ? "HIGH" : r() < 0.6 ? "MEDIUM" : "LOW";
          answers[q.id] = { selected: correct ? q.correctIndex : (q.correctIndex + 1 + Math.floor(r() * 3)) % 4, timeSpentSec: Math.round(q.expectedSeconds * (0.5 + r())), confidence: conf };
        }
        await submitAttempt(user.id, attempt.id, answers, new Date(begin.getTime() + task.plannedMinutes * 0.9 * 60_000));
        done += task.plannedMinutes;
        continue;
      }

      const ratio = Math.min(1.05, 0.7 + r() * 0.4);
      const active = Math.round(task.plannedMinutes * ratio);
      const qTarget = Math.max(task.questionTarget, task.type === "MOCK_ANALYSIS" ? 0 : 5);
      const attempted = Math.round(qTarget * Math.min(1, ratio));
      const correct = Math.round(attempted * Math.min(0.97, skill(subject, d) + (r() - 0.5) * 0.1));
      const clientId = `demo-session-${String(++sessionNo).padStart(5, "0")}`;
      await startSession(user.id, { clientId, taskId: task.id, mode: "TIMER", plannedMinutes: task.plannedMinutes, startedAt: begin }, begin);
      const end = new Date(begin.getTime() + (active + 5) * 60_000);
      await completeSession(
        user.id,
        {
          clientId, endedAt: end, activeSeconds: active * 60, breakSeconds: 300, pauseCount: r() < 0.3 ? 1 : 0,
          questionsAttempted: attempted, questionsCorrect: correct,
          difficultyRating: 2 + Math.floor(r() * 3), focusRating: 3 + Math.floor(r() * 3), energyRating: 2 + Math.floor(r() * 4), distractionCount: Math.floor(r() * 4),
          completionPct: ratio >= 0.9 ? 100 : 65, notes: "", recall: task.type === "REVISION" ? 2 + Math.floor(r() * 3) : null,
          topicCompleted: task.type === "STUDY" && ratio >= 0.95 && r() < 0.5,
        },
        end,
      );
      done += active;
    }

    const completion = planned > 0 ? done / planned : 1;
    if (d % 2 === 0 || completion < 0.6) {
      const blocker = completion >= 0.9 ? null : d >= 8 && d <= 10 ? (["UNEXPECTED_WORK", "LOW_ENERGY", "TIME"] as const)[d - 8] : completion < 0.7 ? "PHONE" : null;
      await submitNightReview(user.id, { date: day, blocker, note: "" }, at(day, "21:45"));
    }
    await refreshReadiness(user.id, at(day, "22:00"));
    process.stdout.write(`\r  simulated day ${d + 1}/${DAYS}`);
  }
  process.stdout.write("\n");

  // Weekly reports for the completed weeks, and today's plan.
  for (const w of [3, 2, 1]) await generateWeeklyReport(user.id, addDays(today, -7 * w), new Date()).catch(() => undefined);
  await ensureDayPlan(user.id, { now: new Date() });
  await refreshReadiness(user.id, new Date());
  const counts = {
    sessions: await prisma.studySession.count({ where: { userId: user.id } }),
    mocks: await prisma.mockAttempt.count({ where: { userId: user.id, status: "SUBMITTED" } }),
    mistakes: await prisma.mistake.count({ where: { userId: user.id } }),
    revisions: await prisma.revisionEvent.count({ where: { userId: user.id, completedOn: { not: null } } }),
  };
  console.log(`demo: ${counts.sessions} sessions, ${counts.mocks} mocks, ${counts.mistakes} mistakes, ${counts.revisions} revisions`);
  console.log("demo login: demo@preppilot.app / demo-pass-2026   admin: admin@preppilot.app / admin-pass-2026");
  void toMinutes;
}
