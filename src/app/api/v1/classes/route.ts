import { z } from "zod";
import { api, body } from "@/server/http";
import { joinClass, leaveClass, myClasses } from "@/server/services/classroom.service";

/** Student side: the classes I've joined (my study time is shared with those teachers). */
export const GET = api(async ({ user }) => ({ classes: await myClasses(user.id) }));

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("join"), code: z.string().trim().min(4).max(20) }),
  z.object({ action: z.literal("leave"), classId: z.string().max(64) }),
]);

export const POST = api(async ({ req, user }) => {
  const input = await body(req, schema);
  if (input.action === "join") return joinClass(user.id, input.code);
  await leaveClass(user.id, input.classId);
  return { ok: true };
}, { rate: { limit: 20, windowSec: 60 } });
