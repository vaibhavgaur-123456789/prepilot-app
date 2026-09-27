import { api, body } from "@/server/http";
import { taskUpdateSchema } from "@/lib/validation/schemas";
import { removeTask, updateTask } from "@/server/services/planner.service";

export const PATCH = api<{ id: string }>(async ({ req, user, params }) => updateTask(user.id, params.id, await body(req, taskUpdateSchema)));

export const DELETE = api<{ id: string }>(async ({ user, params }) => {
  await removeTask(user.id, params.id);
  return { ok: true };
});
