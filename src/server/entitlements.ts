import type { User } from "@prisma/client";

// Free forever: planner, sessions, tracking, XP, basic analytics, mocks, revision, readiness,
// recovery banner, rule-based coach, data export/deletion. Never gate safety, privacy or basic study.
export type Feature = "AI_COACH_LLM" | "ADVANCED_ANALYTICS" | "ADVANCED_MOCK_ANALYSIS" | "DETAILED_READINESS" | "BENCHMARK_DEEP_DIVE";

const PREMIUM: Feature[] = ["AI_COACH_LLM", "ADVANCED_ANALYTICS", "ADVANCED_MOCK_ANALYSIS", "DETAILED_READINESS", "BENCHMARK_DEEP_DIVE"];

export function hasFeature(user: Pick<User, "plan">, f: Feature): boolean {
  if ((process.env.PREMIUM_GATING ?? "off") !== "on") return true;
  return !PREMIUM.includes(f) || user.plan === "PREMIUM";
}

/** Returns whether the premium variant may be used; callers degrade gracefully instead of blocking. */
export function requireFeature(user: Pick<User, "plan">, f: Feature): boolean {
  return hasFeature(user, f);
}
