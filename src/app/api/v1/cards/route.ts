import { z } from "zod";
import { api, body } from "@/server/http";
import { addCards, cardOverview, deleteCard, gradeCard, updateCard } from "@/server/services/flashcard.service";

export const GET = api(async ({ user }) => cardOverview(user.id));

const card = z.object({ deck: z.string().trim().max(60).default(""), front: z.string().trim().min(1, "Write the question side.").max(500), back: z.string().trim().min(1, "Write the answer side.").max(1000) });
const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("add"), cards: z.array(card).min(1).max(500) }),
  z.object({ action: z.literal("grade"), id: z.string().max(64), grade: z.enum(["AGAIN", "HARD", "GOOD", "EASY"]) }),
  z.object({ action: z.literal("update"), id: z.string().max(64), card }),
  z.object({ action: z.literal("delete"), id: z.string().max(64) }),
]);

export const POST = api(async ({ req, user }) => {
  const input = await body(req, schema);
  switch (input.action) {
    case "add":
      return addCards(user.id, input.cards);
    case "grade":
      return gradeCard(user.id, input.id, input.grade);
    case "update":
      await updateCard(user.id, input.id, input.card);
      return { ok: true };
    case "delete":
      await deleteCard(user.id, input.id);
      return { ok: true };
  }
}, { rate: { limit: 240, windowSec: 60 } });
