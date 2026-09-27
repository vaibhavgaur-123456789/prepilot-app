import { api, body } from "@/server/http";
import { mistakeReviewSchema, mistakeUpdateSchema } from "@/lib/validation/schemas";
import { reviewMistake, updateMistake } from "@/server/services/mistakes.service";

export const PATCH = api<{ id: string }>(async ({ req, user, params }) => updateMistake(user.id, params.id, await body(req, mistakeUpdateSchema)));

/** Re-solve the question. */
export const POST = api<{ id: string }>(async ({ req, user, params }) => reviewMistake(user.id, params.id, (await body(req, mistakeReviewSchema)).selectedIndex));
