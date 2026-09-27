import { z } from "zod";
import { api, body } from "@/server/http";
import { dayKeySchema } from "@/lib/validation/schemas";
import { monthAttendance, setLeave } from "@/server/services/attendance.service";

export const GET = api(async ({ req, user }) => monthAttendance(user.id, new URL(req.url).searchParams.get("month") ?? undefined));

const schema = z.object({ date: dayKeySchema, leave: z.boolean(), note: z.string().trim().max(120).nullable().optional() });

export const POST = api(async ({ req, user }) => {
  const input = await body(req, schema);
  return setLeave(user.id, input.date, input.leave, input.note ?? null);
});
