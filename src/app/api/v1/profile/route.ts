import { z } from "zod";
import { api, body } from "@/server/http";
import { deleteAccountSchema, notificationPrefsSchema, profileUpdateSchema } from "@/lib/validation/schemas";
import { deleteAccount, exportData, updateProfile } from "@/server/services/account.service";
import { markAllRead, updatePrefs } from "@/server/services/notifications.service";
import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/server/auth/session";

export const PATCH = api(async ({ req, user }) => {
  const input = await body(req, z.object({ profile: profileUpdateSchema.optional(), notifications: notificationPrefsSchema.optional() }));
  if (input.profile) await updateProfile(user.id, input.profile);
  if (input.notifications) await updatePrefs(user.id, input.notifications);
  return { ok: true };
});

/** Data export: a downloadable JSON file of everything we hold about the student. */
export const GET = api(async ({ user }) => {
  const data = await exportData(user.id);
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: { "content-type": "application/json", "content-disposition": `attachment; filename="preppilot-export-${new Date().toISOString().slice(0, 10)}.json"` },
  });
}, { rate: { limit: 5, windowSec: 3600, key: "export" } });

const postSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("delete-account"), data: deleteAccountSchema }),
  z.object({ action: z.literal("read-notifications") }),
]);

export const POST = api(async ({ req, user }) => {
  const input = await body(req, postSchema);
  if (input.action === "read-notifications") {
    await markAllRead(user.id);
    return { ok: true };
  }
  await deleteAccount(user.id, input.data.password);
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SESSION_COOKIE);
  return res;
}, { rate: { limit: 10, windowSec: 60 } });
