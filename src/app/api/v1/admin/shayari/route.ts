import { z } from "zod";
import { api, body } from "@/server/http";
import { adminAddShayari, adminDeleteShayari, adminListShayari, adminSetShayari } from "@/server/services/shayari.service";

export const GET = api(async () => ({ items: await adminListShayari() }), { admin: true });

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("add"), raw: z.string().max(500_000), lang: z.enum(["hi", "ur", "sa", "en", "bn"]) }),
  z.object({ action: z.literal("toggle"), id: z.string().max(64), active: z.boolean() }),
  z.object({ action: z.literal("delete"), id: z.string().max(64) }),
]);

export const POST = api(async ({ req }) => {
  const input = await body(req, schema);
  if (input.action === "add") return adminAddShayari(input.raw, input.lang);
  if (input.action === "toggle") await adminSetShayari(input.id, input.active);
  else await adminDeleteShayari(input.id);
  return { ok: true };
}, { admin: true, rate: { limit: 30, windowSec: 60 } });
