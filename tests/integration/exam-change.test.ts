import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/server/db";
import { signup } from "@/server/services/auth.service";
import { buildMocks, createExam, createSubject, updateExam, upsertQuestion, upsertTopic } from "@/server/services/admin.service";
import { completeOnboarding, listExams } from "@/server/services/onboarding.service";
import { ensureDayPlan } from "@/server/services/planner.service";
import { listMocks } from "@/server/services/mock.service";

const NOW = new Date("2026-10-20T03:00:00Z");
afterAll(() => prisma.$disconnect());

describe("admin adds a new exam and a student switches to it", () => {
  it("works end to end without code changes", async () => {
    const admin = await signup({ name: "Owner", email: "owner2@test.dev", password: "owner-pass-123" });
    const exam = await createExam(admin.id, { slug: "cds-test", name: "CDS (test)", shortName: "CDS", category: "DEFENCE", durationMinutes: 120, totalQuestions: 20, marksPerQuestion: 1, negativeMarking: 0.33 });
    expect(exam.isActive).toBe(false);
    expect((await listExams()).some((e) => e.id === exam.id)).toBe(false); // hidden until activated

    const maths = await createSubject(admin.id, exam.id, { name: "Elementary Maths", slug: "maths", weightage: 50, isQuantitative: true, isMemoryBased: false });
    const topic = await upsertTopic(admin.id, { subjectId: maths.id, name: "Trigonometry", slug: "trig", weightage: 4, difficulty: 3, estimatedMinutes: 120 });
    for (let i = 0; i < 6; i++) {
      await upsertQuestion(admin.id, { topicId: topic.id, stem: `What is ${i} + ${i}?`, options: [`${2 * i}`, `${2 * i + 1}`, `${2 * i + 2}`, `${2 * i + 3}`], correctIndex: 0, explanation: "Addition.", difficulty: 1, expectedSeconds: 20, isActive: true });
    }
    const built = await buildMocks(admin.id, exam.id);
    expect(built.created).toBe(3); // full + 1 sectional + diagnostic
    await updateExam(admin.id, exam.id, { isActive: true });
    expect((await listExams()).some((e) => e.id === exam.id)).toBe(true);

    // A student on SSC switches to the new exam.
    const ssc = (await listExams()).find((e) => e.shortName === "SSC CGL")!;
    const u = await signup({ name: "Arjun", email: "arjun@test.dev", password: "arjun-pass-123" });
    const base = { name: "Arjun", examDate: "2027-01-15", prepLevel: "BEGINNER" as const, dailyMinutes: 120, preferredSlots: ["EVENING" as const], completedTopicIds: [], inProgressTopicIds: [], weakSubjectIds: [], strongSubjectIds: [], previousMockScores: [], language: "en", notifications: true, benchmarkOptIn: true };
    await completeOnboarding(u.id, { ...base, examId: ssc.id }, NOW);
    const later = new Date(NOW.getTime() + 60 * 60_000);
    await completeOnboarding(u.id, { ...base, examId: exam.id }, later);

    const plan = await ensureDayPlan(u.id, { now: later });
    const topics = await prisma.topic.findMany({ where: { id: { in: plan.tasks.map((t) => t.topicId).filter((x): x is string => !!x) } }, include: { subject: true } });
    expect(topics.length).toBeGreaterThan(0);
    expect(topics.every((t) => t.subject.examId === exam.id)).toBe(true); // no SSC tasks left over
    const mocks = await listMocks(u.id);
    expect(mocks.map((m) => m.type).sort()).toEqual(["DIAGNOSTIC", "FULL", "SECTIONAL"]);
    expect(await prisma.productEvent.count({ where: { userId: u.id, name: "exam_changed" } })).toBe(1);
  });
});
