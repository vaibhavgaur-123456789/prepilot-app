import { z } from "zod";
import { api, body } from "@/server/http";
import { mockAnswersSchema } from "@/lib/validation/schemas";
import { getAttemptForPlayer, getResult, markAnalyzed, saveAnswers, submitAttempt } from "@/server/services/mock.service";

export const GET = api<{ id: string }>(async ({ req, user, params }) => {
  if (new URL(req.url).searchParams.get("view") === "result") return getResult(user.id, params.id);
  return getAttemptForPlayer(user.id, params.id);
});

/** Autosave while the test runs. */
export const PATCH = api<{ id: string }>(async ({ req, user, params }) => saveAnswers(user.id, params.id, (await body(req, mockAnswersSchema)).answers), { rate: { limit: 240, windowSec: 60 } });

const postSchema = z.object({ action: z.enum(["submit", "analyzed"]), answers: mockAnswersSchema.shape.answers.optional() });

export const POST = api<{ id: string }>(async ({ req, user, params }) => {
  const input = await body(req, postSchema);
  if (input.action === "analyzed") {
    await markAnalyzed(user.id, params.id);
    return { ok: true };
  }
  return submitAttempt(user.id, params.id, input.answers ?? {});
});
