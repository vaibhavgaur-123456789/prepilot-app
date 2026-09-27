import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/server/db";
import { signup } from "@/server/services/auth.service";
import { completeOnboarding, listExams } from "@/server/services/onboarding.service";
import { addChapters, createCustomSyllabus, mySyllabus, setChapterStatus } from "@/server/services/syllabus.service";
import { ensureDayPlan, paceFor } from "@/server/services/planner.service";
import { getStudentContext } from "@/server/services/context";
import { monthAttendance, setLeave } from "@/server/services/attendance.service";
import { xpSummary } from "@/server/services/gamification.service";
import { fireDueAlarms, saveAlarm } from "@/server/services/alarm.service";
import { askCoach } from "@/server/services/coach.service";
import { currentStreak } from "@/lib/engine/streaks";
import { detectLang } from "@/server/ai/rules";

// 08:00 IST, Tuesday 3 Nov 2026
const NOW = new Date("2026-11-03T02:30:00Z");
let userId = "";
afterAll(() => prisma.$disconnect());

describe("own syllabus (exam not listed / self development)", () => {
  it("builds a plan from the student's own chapters and keeps it private", async () => {
    const u = await signup({ name: "Meera", email: "meera@test.dev", password: "meera-pass-123" });
    userId = u.id;
    const custom = await createCustomSyllabus(userId, {
      name: "Class 12 Boards",
      purpose: "SCHOOL",
      subjects: [
        { name: "Physics", book: "NCERT Class 12", chapters: ["Electric Charges", "Current Electricity", "Magnetism"] },
        { name: "Chemistry", book: null, chapters: [] },
      ],
    });
    expect(custom.subjects[0].topics.map((t) => t.name)).toEqual(["Electric Charges", "Current Electricity", "Magnetism"]);
    expect((await listExams()).some((e) => e.id === custom.id)).toBe(false); // private

    await completeOnboarding(userId, { name: "Meera", examId: custom.id, examDate: "2027-03-01", purpose: "SCHOOL", prepLevel: "BEGINNER", dailyMinutes: 120, preferredSlots: ["EVENING"], completedTopicIds: [], inProgressTopicIds: [], weakSubjectIds: [], strongSubjectIds: [], previousMockScores: [], language: "hi", notifications: true, benchmarkOptIn: false }, NOW);
    await addChapters(userId, custom.subjects[1].id, ["Solutions", "Electrochemistry"]);
    const syl = await mySyllabus(userId);
    expect(syl.exam.editable).toBe(true);
    expect(syl.subjects.find((s) => s.name === "Physics")?.book).toBe("NCERT Class 12");
    expect(syl.subjects.find((s) => s.name === "Chemistry")?.chapters.length).toBe(2);

    const plan = await ensureDayPlan(userId, { now: NOW, force: true });
    expect(plan.tasks.length).toBeGreaterThan(0);
    expect(plan.tasks.every((t) => t.type !== "MOCK")).toBe(true);
    const pace = await paceFor(await getStudentContext(userId, NOW), NOW);
    expect(pace.mocks.status).toBe("NOT_ENOUGH_DATA"); // no mock pressure for a personal syllabus

    await setChapterStatus(userId, custom.subjects[0].topics[0].id, "COMPLETED");
    const st = await prisma.userTopicState.findUniqueOrThrow({ where: { userId_topicId: { userId, topicId: custom.subjects[0].topics[0].id } } });
    expect(st.nextRevisionOn).not.toBeNull();
  });
});

describe("attendance and leave", () => {
  it("a leave day plans nothing and does not break the streak", async () => {
    const tomorrow = "2026-11-04";
    await setLeave(userId, tomorrow, true, "Family function", NOW);
    const plan = await ensureDayPlan(userId, { now: new Date("2026-11-04T02:30:00Z") });
    expect(plan.planDay?.mode).toBe("LEAVE");
    expect(plan.tasks.filter((t) => t.status === "PENDING").length).toBe(0);
    const att = await monthAttendance(userId, "2026-11", NOW);
    expect(att.cells.find((c) => c.date === tomorrow)?.status).toBe("LEAVE");
    expect(att.summary.leave).toBe(1);

    // Engine: studied Mon, leave Tue, studied Wed → a 2-day streak, not broken.
    expect(currentStreak(new Set(["2026-11-02", "2026-11-04"]), "2026-11-04", new Set(["2026-11-03"])).streak).toBe(2);
    expect((await xpSummary(userId, "2026-11-05")).streak).toBeGreaterThanOrEqual(0);
  });
});

describe("study alarms", () => {
  it("fires once, at the student's local time, on the chosen days", async () => {
    await saveAlarm(userId, { time: "08:00", days: [1], label: "Morning Physics", enabled: true }); // Tuesday
    const first = await fireDueAlarms(new Date("2026-11-03T02:33:00Z")); // 08:03 IST Tuesday
    expect(first.fired).toBe(1);
    const again = await fireDueAlarms(new Date("2026-11-03T02:36:00Z"));
    expect(again.fired).toBe(0);
    const wednesday = await fireDueAlarms(new Date("2026-11-04T02:33:00Z"));
    expect(wednesday.fired).toBe(0);
    const note = await prisma.notification.findFirst({ where: { userId, title: { contains: "Morning Physics" } } });
    expect(note?.title).toMatch(/पढ़ाई का समय/); // Hindi interface
  });
});

describe("coach speaks Hindi and gives varied, relevant answers", () => {
  it("answers topic questions in Hindi from the student's data", async () => {
    expect(detectLang("aaj kya padhu?", "en")).toBe("hi");
    expect(detectLang("What should I study?", "en")).toBe("en");
    const r = await askCoach(userId, "Current Electricity kaise padhu?", null, false, NOW);
    expect(r.answer).toMatch(/Current Electricity/);
    expect(r.answer).toMatch(/[ऀ-ॿ]/);
    const m = await askCoach(userId, "padhne ka man nahi kar raha", r.conversationId, false, NOW);
    expect(m.intent).toBe("MOTIVATION");
    const unknown1 = await askCoach(userId, "xyz qwerty", r.conversationId, false, NOW);
    expect(unknown1.intent).toBe("GENERAL");
    expect(unknown1.answer).not.toBe(m.answer);
  });
});
