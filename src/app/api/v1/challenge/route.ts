import { z } from "zod";
import { api, body } from "@/server/http";
import { currentChallenge, startChallenge, stopChallenge } from "@/server/services/challenge.service";

export const GET = api(async ({ user }) => ({ challenge: await currentChallenge(user.id) }));

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("start"), dailyMinutes: z.number().int().min(15).max(720), days: z.union([z.literal(7), z.literal(21), z.literal(30)]).default(30) }),
  z.object({ action: z.literal("stop") }),
]);

export const POST = api(async ({ req, user }) => {
  const input = await body(req, schema);
  if (input.action === "stop") {
    await stopChallenge(user.id);
    return { ok: true };
  }
  return startChallenge(user.id, input.dailyMinutes, input.days);
}, { rate: { limit: 20, windowSec: 60 } });
