import { api, body } from "@/server/http";
import { onboardingSchema } from "@/lib/validation/schemas";
import { completeOnboarding, listExams } from "@/server/services/onboarding.service";

export const GET = api(async () => ({ exams: await listExams() }));

export const POST = api(async ({ req, user }) => {
  const input = await body(req, onboardingSchema);
  const res = await completeOnboarding(user.id, input);
  return { baseline: res.baseline, readiness: { score: res.readiness.score, confidence: res.readiness.confidence } };
});
