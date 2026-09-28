import { z } from "zod";
import { api, body } from "@/server/http";
import { badRequest } from "@/server/errors";
import { pushEnabled, removeSubscription, saveSubscription, sendPush } from "@/server/services/push.service";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("subscribe"), subscription: z.object({ endpoint: z.string().url().max(1000), keys: z.object({ p256dh: z.string().max(200), auth: z.string().max(100) }) }) }),
  z.object({ action: z.literal("unsubscribe"), endpoint: z.string().url().max(1000) }),
  z.object({ action: z.literal("test") }),
]);

export const POST = api(
  async ({ req, user }) => {
    if (!pushEnabled()) throw badRequest("Push notifications aren't configured on this server.");
    const input = await body(req, schema);
    if (input.action === "subscribe") {
      await saveSubscription(user.id, input.subscription, req.headers.get("user-agent"));
      return { ok: true };
    }
    if (input.action === "unsubscribe") {
      await removeSubscription(user.id, input.endpoint);
      return { ok: true };
    }
    const sent = await sendPush(user.id, { title: "RozPadh notifications are on ✅", body: "You'll get your daily briefing, study and revision reminders here.", href: "/" });
    return { sent };
  },
  { rate: { limit: 20, windowSec: 60 } },
);
