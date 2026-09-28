import { api } from "@/server/http";
import { randomShayari } from "@/server/services/shayari.service";

/** A random famous line, avoiding the ones the student saw recently (`?skip=id1,id2`). */
export const GET = api(async ({ req }) => {
  const skip = (new URL(req.url).searchParams.get("skip") ?? "").split(",").filter(Boolean).slice(0, 50);
  return { line: await randomShayari(skip) };
});
