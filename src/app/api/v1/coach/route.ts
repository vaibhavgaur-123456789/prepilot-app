import { api, body } from "@/server/http";
import { coachMessageSchema } from "@/lib/validation/schemas";
import { askCoach } from "@/server/services/coach.service";
import { requireFeature } from "@/server/entitlements";
import { AppError } from "@/server/errors";

export const POST = api(
  async ({ req, user }) => {
    const input = await body(req, coachMessageSchema);
    try {
      return await askCoach(user.id, input.message, input.conversationId, requireFeature(user, "AI_COACH_LLM"));
    } catch (e) {
      // User hasn't completed onboarding — return a helpful nudge instead of an error.
      if (e instanceof AppError && e.code === "ONBOARDING_REQUIRED") {
        return {
          conversationId: null,
          answer: "To get personalised answers, you need to finish setting up your study profile first. Go to the Onboarding page to add your exam, study hours and topics — it only takes 2 minutes.",
          provider: "rule-based",
          intent: "GENERAL",
        };
      }
      throw e;
    }
  },
  { rate: { limit: 20, windowSec: 3600, key: "coach" } },
);
