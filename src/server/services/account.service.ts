import { prisma } from "@/server/db";
import { AppError, badRequest } from "@/server/errors";
import { verifyPassword } from "@/server/auth/password";
import { dayKey } from "@/lib/engine/dates";
import { toJson } from "@/lib/json";
import { trackEvent } from "./context";

/** Goals with live progress computed from measured data. */
export async function listGoals(userId: string) {
  const goals = await prisma.goal.findMany({ where: { userId, status: { not: "ARCHIVED" } }, orderBy: { createdAt: "asc" } });
  const out = [];
  for (const g of goals) {
    let progress = 0;
    if (g.metric === "MINUTES") {
      const a = await prisma.dailyStat.aggregate({ where: { userId, date: { gte: g.periodStart, lte: g.periodEnd } }, _sum: { actualMinutes: true } });
      progress = a._sum.actualMinutes ?? 0;
    } else if (g.metric === "TOPICS_COMPLETED") {
      progress = await prisma.userTopicState.count({ where: { userId, status: "COMPLETED", completedAt: { gte: new Date(`${g.periodStart}T00:00:00Z`) } } });
    } else if (g.metric === "MOCKS") {
      progress = await prisma.mockAttempt.count({ where: { userId, status: "SUBMITTED", submittedAt: { gte: new Date(`${g.periodStart}T00:00:00Z`) } } });
    } else if (g.metric === "QUESTIONS") {
      const a = await prisma.dailyStat.aggregate({ where: { userId, date: { gte: g.periodStart, lte: g.periodEnd } }, _sum: { questions: true } });
      progress = a._sum.questions ?? 0;
    }
    out.push({ ...g, progress, pct: g.target > 0 ? Math.min(100, Math.round((progress / g.target) * 100)) : 0 });
  }
  return out;
}

export async function updateProfile(userId: string, patch: Record<string, unknown>) {
  const userFields = ["name", "timezone", "language", "theme", "benchmarkOptIn"];
  const profileFields = ["examDate", "targetScore", "dailyMinutes", "dailyGoalMinutes", "weeklyGoalMinutes", "preferredSlots", "preferredBlockMin"];
  const u: Record<string, unknown> = {};
  const p: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined) continue;
    if (userFields.includes(k)) u[k] = v;
    if (profileFields.includes(k)) p[k] = k === "preferredSlots" ? toJson(v) : v;
  }
  if (typeof p.examDate === "string") {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (p.examDate <= dayKey(new Date(), user.timezone)) throw badRequest("The exam date must be in the future.");
  }
  if (Object.keys(u).length) await prisma.user.update({ where: { id: userId }, data: u });
  if (Object.keys(p).length) await prisma.studentProfile.update({ where: { userId }, data: p });
  if (patch.benchmarkOptIn === false) await trackEvent(userId, "benchmark_opt_out");
}

/** Everything we hold about the student, as JSON. Secrets (password hash, sessions) excluded. */
export async function exportData(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: {
      profile: true, notificationPrefs: true, topicStates: true, planDays: true, tasks: true, studySessions: true, questionAttempts: true,
      mockAttempts: true, customMocks: true, mistakes: true, revisionEvents: true, goals: true, xpEvents: true, achievements: { include: { achievement: true } },
      dailyStats: true, readiness: true, weeklyReports: true, notifications: true, conversations: { include: { messages: true } }, events: true, subscriptions: true,
    },
  });
  const { passwordHash: _p, googleId: _g, ...safe } = user;
  void _p;
  void _g;
  return { exportedAt: new Date().toISOString(), format: "PrepPilot export v1", data: safe };
}

/** Permanent deletion. All user-owned rows cascade. */
export async function deleteAccount(userId: string, password?: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (user.passwordHash) {
    if (!password || !(await verifyPassword(password, user.passwordHash))) throw new AppError(401, "INVALID_CREDENTIALS", "Password is incorrect.");
  }
  await prisma.user.delete({ where: { id: userId } });
}
