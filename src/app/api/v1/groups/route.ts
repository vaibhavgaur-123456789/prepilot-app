import { z } from "zod";
import { api, body } from "@/server/http";
import { createGroup, joinGroup, leaveGroup, myGroups } from "@/server/services/group.service";

export const GET = api(async ({ user }) => ({ groups: await myGroups(user.id) }));

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create"), name: z.string().trim().min(1, "Give the group a name.").max(60) }),
  z.object({ action: z.literal("join"), code: z.string().trim().min(4).max(20) }),
  z.object({ action: z.literal("leave"), groupId: z.string().max(64) }),
]);

export const POST = api(async ({ req, user }) => {
  const input = await body(req, schema);
  if (input.action === "create") return createGroup(user.id, input.name);
  if (input.action === "join") return joinGroup(user.id, input.code);
  await leaveGroup(user.id, input.groupId);
  return { ok: true };
}, { rate: { limit: 30, windowSec: 60 } });
