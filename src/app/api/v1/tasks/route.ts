import { api, body } from "@/server/http";
import { reorderSchema, taskCreateSchema } from "@/lib/validation/schemas";
import { addTask, reorderTasks } from "@/server/services/planner.service";

export const POST = api(async ({ req, user }) => addTask(user.id, await body(req, taskCreateSchema)), { rate: { limit: 60, windowSec: 60 } });

/** Reorder (drag and drop): re-times pending blocks in the new order and validates the day. */
export const PUT = api(async ({ req, user }) => {
  const { date, orderedIds } = await body(req, reorderSchema);
  return reorderTasks(user.id, date, orderedIds);
});
