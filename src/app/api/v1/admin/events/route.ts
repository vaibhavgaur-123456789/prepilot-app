import { z } from "zod";
import { api, body } from "@/server/http";
import { adminDeleteEvent, adminListEvents, adminSaveEvent, EVENT_KINDS } from "@/server/services/calendar.service";

export const GET = api(async () => ({ events: await adminListEvents() }), { admin: true });

const schema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("save"),
    event: z.object({
      id: z.string().max(64).optional(),
      title: z.string().trim().min(1).max(160),
      examName: z.string().trim().max(80).default(""),
      kind: z.enum(EVENT_KINDS),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      link: z.string().trim().max(500).refine((v) => v === "" || /^https:\/\//.test(v), "Use a full https:// link to the official notice.").default(""),
    }),
  }),
  z.object({ action: z.literal("delete"), id: z.string().max(64) }),
]);

export const POST = api(async ({ req }) => {
  const input = await body(req, schema);
  if (input.action === "delete") {
    await adminDeleteEvent(input.id);
    return { ok: true };
  }
  return adminSaveEvent(input.event);
}, { admin: true, rate: { limit: 60, windowSec: 60 } });
