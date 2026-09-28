import { prisma } from "@/server/db";
import { notFound } from "@/server/errors";
import { trackEvent } from "./context";

export const FEEDBACK_CATEGORIES = ["BUG", "CONTENT_ERROR", "SUGGESTION", "ACCOUNT", "OTHER"] as const;

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/** Email the owner via Resend when configured. Failures never block saving the report. */
async function emailOwner(subject: string, html: string, replyTo?: string | null) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.FEEDBACK_EMAIL;
  if (!key || !to) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({ from: process.env.RESEND_FROM || "RozPadh <onboarding@resend.dev>", to: to.split(",").map((s) => s.trim()), subject, html, ...(replyTo ? { reply_to: replyTo } : {}) }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function submitFeedback(
  user: { id: string; email: string; name: string } | null,
  input: { category: string; message: string; page?: string | null; contact?: string | null },
  userAgent?: string | null,
) {
  const fb = await prisma.feedback.create({
    data: { userId: user?.id ?? null, category: input.category, message: input.message, page: input.page ?? null, contact: input.contact || user?.email || null, userAgent: userAgent?.slice(0, 300) ?? null },
  });
  const emailed = await emailOwner(
    `[RozPadh] ${input.category.replace("_", " ").toLowerCase()} from ${user?.name ?? "a visitor"}`,
    `<p><b>Category:</b> ${escapeHtml(input.category)}</p><p><b>From:</b> ${escapeHtml(user ? `${user.name} (${user.email})` : input.contact ?? "anonymous")}</p><p><b>Page:</b> ${escapeHtml(input.page ?? "-")}</p><p style="white-space:pre-wrap">${escapeHtml(input.message)}</p><p>Open Admin → Complaints to respond.</p>`,
    fb.contact,
  );
  if (user) await trackEvent(user.id, "feedback_submit", { category: input.category });
  return { id: fb.id, emailed };
}

export async function listFeedback(status?: string) {
  return prisma.feedback.findMany({ where: status ? { status } : {}, include: { user: { select: { name: true, email: true } } }, orderBy: { createdAt: "desc" }, take: 200 });
}

export async function updateFeedback(actorId: string, id: string, patch: { status?: string; adminNote?: string }) {
  const fb = await prisma.feedback.findUnique({ where: { id } });
  if (!fb) throw notFound("Report");
  const updated = await prisma.feedback.update({ where: { id }, data: patch });
  await prisma.adminAuditLog.create({ data: { actorId, action: "update", entity: "Feedback", entityId: id, detail: JSON.stringify(patch) } });
  // Let the student know when their report is resolved.
  if (patch.status === "RESOLVED" && fb.status !== "RESOLVED" && fb.userId) {
    await prisma.notification.create({
      data: { userId: fb.userId, type: "SYSTEM", title: "Your report was resolved", body: patch.adminNote || "Thanks for reporting it. The issue has been fixed.", href: "/", dedupeKey: `${fb.userId}:FEEDBACK:${id}`, scheduledFor: new Date() },
    }).catch(() => undefined);
  }
  return updated;
}

export async function openFeedbackCount() {
  return prisma.feedback.count({ where: { status: { not: "RESOLVED" } } });
}
