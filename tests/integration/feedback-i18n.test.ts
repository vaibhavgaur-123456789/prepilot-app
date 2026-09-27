import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/server/db";
import { signup } from "@/server/services/auth.service";
import { listFeedback, openFeedbackCount, submitFeedback, updateFeedback } from "@/server/services/feedback.service";
import { pushEnabled, saveSubscription, sendPush } from "@/server/services/push.service";
import { DICTS, translate } from "@/i18n/dict";

afterAll(() => prisma.$disconnect());

describe("complaints / feedback", () => {
  it("stores reports from signed-in and anonymous users and notifies the student when resolved", async () => {
    const u = await signup({ name: "Kiran", email: "kiran@test.dev", password: "kiran-pass-123" });
    const admin = await signup({ name: "Owner", email: "owner@test.dev", password: "owner-pass-123" });
    const r = await submitFeedback({ id: u.id, email: u.email, name: u.name }, { category: "CONTENT_ERROR", message: "Question 4 answer looks wrong", page: "/tests/result/x" }, "test-agent");
    expect(r.emailed).toBe(false); // no RESEND_API_KEY in tests
    await submitFeedback(null, { category: "BUG", message: "Login button does nothing", contact: "visitor@test.dev" });
    expect(await openFeedbackCount()).toBeGreaterThanOrEqual(2);
    const mine = (await listFeedback()).find((f) => f.id === r.id)!;
    expect(mine.contact).toBe("kiran@test.dev");
    await updateFeedback(admin.id, r.id, { status: "RESOLVED", adminNote: "Fixed the answer key." });
    const note = await prisma.notification.findFirst({ where: { userId: u.id, title: "Your report was resolved" } });
    expect(note?.body).toBe("Fixed the answer key.");
    expect(await prisma.adminAuditLog.count({ where: { entity: "Feedback", entityId: r.id } })).toBe(1);
  });
});

describe("push notifications", () => {
  it("is a safe no-op when VAPID keys are not configured", async () => {
    delete process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const u = await signup({ name: "Push", email: "push@test.dev", password: "push-pass-123" });
    await saveSubscription(u.id, { endpoint: "https://push.example.com/abc", keys: { p256dh: "k", auth: "a" } });
    expect(pushEnabled()).toBe(false);
    expect(await sendPush(u.id, { title: "x", body: "y" })).toBe(0);
  });
});

describe("Hindi interface", () => {
  it("has a Hindi string for every English key, with variables filled in", () => {
    const en = Object.keys(DICTS.en);
    const hi = Object.keys(DICTS.hi);
    expect(hi.sort()).toEqual(en.sort());
    expect(translate("hi", "home.streak", { n: 7 })).toBe("7 दिन लगातार");
    expect(translate("en", "home.preparation", { exam: "SSC CGL" })).toBe("SSC CGL preparation");
  });
});
