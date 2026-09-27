import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/server/db";
import { signup } from "@/server/services/auth.service";
import { completeOnboarding, listExams } from "@/server/services/onboarding.service";
import { ensureDayPlan } from "@/server/services/planner.service";
import { generateNotifications, updatePrefs } from "@/server/services/notifications.service";
import { deleteAccount, exportData } from "@/server/services/account.service";
import { askCoach } from "@/server/services/coach.service";
import { generateWeeklyReport, nightReview, submitNightReview } from "@/server/services/review.service";
import { aggregateBenchmarks, benchmarkComparisons } from "@/server/services/benchmark.service";
import { getHome } from "@/server/services/dashboard.service";
import { getAnalytics } from "@/server/services/analytics.service";
import { detectIntent } from "@/server/ai/rules";
import { dayKey } from "@/lib/engine/dates";

// 09:30 IST
const NOW = new Date("2026-10-12T04:00:00Z");
let userId = "";

beforeAll(async () => {
  delete process.env.ANTHROPIC_API_KEY; // coach must work without any AI key
  const exam = (await listExams()).find((e) => e.shortName === "RRB NTPC")!;
  const u = await signup({ name: "Sneha", email: "sneha@test.dev", password: "sneha-pass-123" });
  userId = u.id;
  await completeOnboarding(userId, { name: "Sneha", examId: exam.id, examDate: "2026-12-20", prepLevel: "BEGINNER", dailyMinutes: 150, preferredSlots: ["MORNING"], completedTopicIds: [], inProgressTopicIds: [], weakSubjectIds: [], strongSubjectIds: [], previousMockScores: [], language: "en", notifications: true, benchmarkOptIn: true }, NOW);
});
afterAll(() => prisma.$disconnect());

describe("notifications", () => {
  it("dedupes per type per day and respects the daily cap", async () => {
    await ensureDayPlan(userId, { now: NOW });
    const first = await generateNotifications(userId, NOW);
    expect(first.length).toBeGreaterThan(0);
    expect(first.length).toBeLessThanOrEqual(4);
    const again = await generateNotifications(userId, new Date(NOW.getTime() + 60_000));
    expect(again).toEqual([]);
  });
  it("stays silent during quiet hours and when disabled", async () => {
    const lateNight = new Date("2026-10-13T17:45:00Z"); // 23:15 IST
    expect(await generateNotifications(userId, lateNight)).toEqual([]);
    await updatePrefs(userId, { enabled: false });
    expect(await generateNotifications(userId, new Date("2026-10-13T05:00:00Z"))).toEqual([]);
    await updatePrefs(userId, { enabled: true });
  });
});

describe("coach without an AI key", () => {
  it("answers from the student's own data", async () => {
    expect(detectIntent("I have only 2 hours today").intent).toBe("LIMITED_TIME");
    expect(detectIntent("Analyze my last mock").intent).toBe("LAST_MOCK");
    const r = await askCoach(userId, "What should I study today?", null, true, NOW);
    expect(r.provider).toBe("rule-based");
    expect(r.answer).toMatch(/block/);
    const plan = await ensureDayPlan(userId, { now: NOW });
    expect(plan.tasks.some((t) => r.answer.includes(t.title))).toBe(true);
    const ready = await askCoach(userId, "Will I clear the exam? What's my chance?", r.conversationId, true, NOW);
    expect(ready.answer).toMatch(/not a probability of selection/);
    const msgs = await prisma.aIMessage.count({ where: { conversationId: r.conversationId } });
    expect(msgs).toBe(4);
  });
});

describe("reviews, dashboard and analytics", () => {
  it("night review stores the blocker and the weekly report builds", async () => {
    const d = dayKey(NOW);
    const nr = await nightReview(userId, d, NOW);
    expect(nr.plannedMinutes).toBeGreaterThan(0);
    const s = await submitNightReview(userId, { date: d, blocker: "PHONE", note: "" }, NOW);
    expect(s.hint).toMatch(/25 minutes/);
    const stat = await prisma.dailyStat.findUniqueOrThrow({ where: { userId_date: { userId, date: d } } });
    expect(stat.blocker).toBe("PHONE");
    const w = await generateWeeklyReport(userId, d, NOW);
    expect(w.weekStart).toBe("2026-10-12");
    expect(w.priorities.length).toBe(3);
  });
  it("home and analytics load for a brand-new student", async () => {
    const h = await getHome(userId, NOW);
    expect(h.next).not.toBeNull();
    expect(h.readiness.confidence).toBe("LOW");
    const a = await getAnalytics(userId, 7, NOW);
    expect(a.series.length).toBe(7);
    expect(a.insights).toEqual([]); // never guesses without data
  });
});

describe("benchmarks", () => {
  it("never publishes aggregates for fewer than 20 students and labels reference values", async () => {
    const published = await aggregateBenchmarks(NOW);
    expect(published).toEqual([]);
    const cmp = await benchmarkComparisons(userId, NOW);
    expect(cmp.optedOut).toBe(false);
    for (const i of cmp.items) expect(i.source).toBe("REFERENCE");
    await prisma.user.update({ where: { id: userId }, data: { benchmarkOptIn: false } });
    expect((await benchmarkComparisons(userId, NOW)).optedOut).toBe(true);
  });
});

describe("privacy", () => {
  it("exports without secrets and deletes everything on request", async () => {
    const data = await exportData(userId);
    const json = JSON.stringify(data);
    expect(json).not.toContain("passwordHash");
    expect(json).toContain("sneha@test.dev");
    await expect(deleteAccount(userId, "wrong-password")).rejects.toThrow(/incorrect/);
    await deleteAccount(userId, "sneha-pass-123");
    expect(await prisma.user.findUnique({ where: { id: userId } })).toBeNull();
    expect(await prisma.task.count({ where: { userId } })).toBe(0);
    expect(await prisma.aIConversation.count({ where: { userId } })).toBe(0);
  });
});
