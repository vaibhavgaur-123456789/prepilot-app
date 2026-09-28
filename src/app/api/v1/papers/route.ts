import { z } from "zod";
import { api, body } from "@/server/http";
import { deletePaper, listPapers, savePaper } from "@/server/services/paper.service";

export const GET = api(async ({ user }) => listPapers(user.id));

const num = (max: number) => z.number().min(0).max(max).nullable().default(null);

const schema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("save"),
    paper: z.object({
      clientId: z.string().regex(/^[\w-]{8,64}$/),
      title: z.string().trim().max(120).default(""),
      plannedMinutes: z.number().int().min(1).max(360),
      activeSeconds: z.number().int().min(0).max(6 * 3600 + 600),
      pauseCount: z.number().int().min(0).max(500).default(0),
      laps: z.array(z.number().int().min(0)).max(20).default([]),
      totalQuestions: num(1000),
      attempted: num(1000),
      // Negative marking can push a score below zero.
      marksObtained: z.number().min(-1000).max(5000).nullable().default(null),
      totalMarks: z.number().positive().max(5000).nullable().default(null),
      note: z.string().trim().max(1000).default(""),
      startedAt: z.string().datetime(),
      endedAt: z.string().datetime(),
    }),
  }),
  z.object({ action: z.literal("delete"), id: z.string().max(64) }),
]);

export const POST = api(async ({ req, user }) => {
  const input = await body(req, schema);
  if (input.action === "delete") {
    await deletePaper(user.id, input.id);
    return { ok: true };
  }
  return savePaper(user.id, input.paper);
}, { rate: { limit: 30, windowSec: 60 } });
