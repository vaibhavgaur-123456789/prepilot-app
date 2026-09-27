import { z } from "zod";
import { api, body } from "@/server/http";
import { dayKeySchema } from "@/lib/validation/schemas";
import { ensureDayPlan, getDayPlan, setRecoveryMode, weekOutline } from "@/server/services/planner.service";

export const GET = api(async ({ req, user }) => {
  const url = new URL(req.url);
  if (url.searchParams.get("view") === "week") return weekOutline(user.id);
  const date = url.searchParams.get("date");
  return date ? getDayPlan(user.id, dayKeySchema.parse(date)) : ensureDayPlan(user.id);
});

const postSchema = z.object({ action: z.enum(["regenerate", "recovery"]), date: dayKeySchema.optional(), on: z.boolean().optional() });

export const POST = api(
  async ({ req, user }) => {
    const input = await body(req, postSchema);
    if (input.action === "recovery") {
      await setRecoveryMode(user.id, !!input.on);
      return ensureDayPlan(user.id, { force: true });
    }
    return ensureDayPlan(user.id, { date: input.date, force: true });
  },
  { rate: { limit: 20, windowSec: 60 } },
);
