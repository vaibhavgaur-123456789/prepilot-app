import { z } from "zod";
import { api, body } from "@/server/http";
import { createClass, deleteClass, newClassCode, removeStudent, renameClass, teacherClasses } from "@/server/services/classroom.service";

/** Teacher side: any signed-in user can run classes; they only ever see their own classes. */
export const GET = api(async ({ user }) => ({ classes: await teacherClasses(user.id) }));

const name = z.string().trim().min(1, "Give the class a name.").max(80);
const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create"), name }),
  z.object({ action: z.literal("rename"), classId: z.string().max(64), name }),
  z.object({ action: z.literal("newCode"), classId: z.string().max(64) }),
  z.object({ action: z.literal("delete"), classId: z.string().max(64) }),
  z.object({ action: z.literal("remove"), classId: z.string().max(64), userId: z.string().max(64) }),
]);

export const POST = api(async ({ req, user }) => {
  const input = await body(req, schema);
  switch (input.action) {
    case "create":
      return createClass(user.id, input.name);
    case "rename":
      return renameClass(user.id, input.classId, input.name);
    case "newCode":
      return newClassCode(user.id, input.classId);
    case "delete":
      await deleteClass(user.id, input.classId);
      return { ok: true };
    case "remove":
      await removeStudent(user.id, input.classId, input.userId);
      return { ok: true };
  }
}, { rate: { limit: 60, windowSec: 60 } });
