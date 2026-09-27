import { z } from "zod";
import { api, body } from "@/server/http";
import { sessionCompleteSchema, sessionStartSchema } from "@/lib/validation/schemas";
import { abandonSession, activeSession, completeSession, startSession } from "@/server/services/session.service";

export const GET = api(async ({ user }) => ({ active: await activeSession(user.id) }));

const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("start"), data: sessionStartSchema }),
  z.object({ action: z.literal("complete"), data: sessionCompleteSchema }),
  z.object({ action: z.literal("abandon"), data: z.object({ clientId: z.string().min(8).max(64) }) }),
]);

/** One endpoint so the offline outbox can replay any session event in order. All actions are idempotent by clientId. */
export const POST = api(
  async ({ req, user }) => {
    const input = await body(req, actionSchema);
    if (input.action === "start") return { session: await startSession(user.id, { ...input.data, taskId: input.data.taskId ?? null, topicId: input.data.topicId ?? null }) };
    if (input.action === "abandon") return { session: await abandonSession(user.id, input.data.clientId) };
    return completeSession(user.id, input.data);
  },
  { rate: { limit: 60, windowSec: 60 } },
);
