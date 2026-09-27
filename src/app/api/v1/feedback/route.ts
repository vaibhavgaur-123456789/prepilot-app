import { z } from "zod";
import type { NextRequest } from "next/server";
import { api, body } from "@/server/http";
import { resolveSession, SESSION_COOKIE } from "@/server/auth/session";
import { FEEDBACK_CATEGORIES, submitFeedback, updateFeedback } from "@/server/services/feedback.service";

const submitSchema = z.object({
  category: z.enum(FEEDBACK_CATEGORIES),
  message: z.string().trim().min(5, "Please describe the problem in a few words.").max(3000),
  page: z.string().max(300).nullable().optional(),
  contact: z.string().trim().email().max(200).optional().or(z.literal("")),
});

/** Anyone (signed in or not) can report a problem. Rate-limited per user/IP. */
export const POST = api(
  async ({ req }) => {
    const input = await body(req, submitSchema);
    const s = await resolveSession((req as NextRequest).cookies.get(SESSION_COOKIE)?.value);
    return submitFeedback(s ? { id: s.user.id, email: s.user.email, name: s.user.name } : null, { ...input, contact: input.contact || null }, req.headers.get("user-agent"));
  },
  { auth: false, rate: { limit: 5, windowSec: 600, key: "feedback" } },
);

const updateSchema = z.object({ id: z.string(), status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED"]).optional(), adminNote: z.string().max(1000).optional() });

export const PATCH = api(async ({ req, user }) => {
  const { id, ...patch } = await body(req, updateSchema);
  return updateFeedback(user.id, id, patch);
}, { admin: true });
