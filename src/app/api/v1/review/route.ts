import { z } from "zod";
import { api, body } from "@/server/http";
import { nightReviewSchema } from "@/lib/validation/schemas";
import { generateWeeklyReport, submitNightReview } from "@/server/services/review.service";

const schema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("night"), data: nightReviewSchema }),
  z.object({ kind: z.literal("weekly"), weekOf: z.string().optional() }),
]);

export const POST = api(async ({ req, user }) => {
  const input = await body(req, schema);
  if (input.kind === "night") return submitNightReview(user.id, input.data);
  return generateWeeklyReport(user.id, input.weekOf);
});
