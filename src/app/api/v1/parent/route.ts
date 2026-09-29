import { z } from "zod";
import { api, body } from "@/server/http";
import { getParentLink, removeParentLink, resetParentLink } from "@/server/services/parent.service";

export const GET = api(async ({ user }) => ({ link: await getParentLink(user.id) }));

const schema = z.object({ action: z.enum(["create", "remove"]) });

export const POST = api(async ({ req, user }) => {
  const { action } = await body(req, schema);
  if (action === "remove") {
    await removeParentLink(user.id);
    return { link: null };
  }
  return { link: await resetParentLink(user.id) };
}, { rate: { limit: 10, windowSec: 60 } });
