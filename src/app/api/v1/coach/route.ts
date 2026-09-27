import { api, body } from "@/server/http";
import { coachMessageSchema } from "@/lib/validation/schemas";
import { askCoach } from "@/server/services/coach.service";
import { requireFeature } from "@/server/entitlements";

export const POST = api(
  async ({ req, user }) => {
    const input = await body(req, coachMessageSchema);
    return askCoach(user.id, input.message, input.conversationId, requireFeature(user, "AI_COACH_LLM"));
  },
  { rate: { limit: 20, windowSec: 3600, key: "coach" } },
);
