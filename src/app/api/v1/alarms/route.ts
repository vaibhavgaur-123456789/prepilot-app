import { z } from "zod";
import { api, body } from "@/server/http";
import { hhmm } from "@/lib/validation/schemas";
import { deleteAlarm, listAlarms, saveAlarm } from "@/server/services/alarm.service";

export const GET = api(async ({ user }) => listAlarms(user.id));

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("save"), alarm: z.object({ id: z.string().optional(), time: hhmm, days: z.array(z.number().int().min(0).max(6)).max(7), label: z.string().trim().max(60).default(""), enabled: z.boolean().default(true) }) }),
  z.object({ action: z.literal("delete"), id: z.string() }),
]);

export const POST = api(async ({ req, user }) => {
  const input = await body(req, schema);
  if (input.action === "delete") {
    await deleteAlarm(user.id, input.id);
    return { ok: true };
  }
  return saveAlarm(user.id, input.alarm);
}, { rate: { limit: 60, windowSec: 60 } });
