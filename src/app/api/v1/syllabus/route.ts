import { z } from "zod";
import { api, body } from "@/server/http";
import { addChapters, addSubject, createCustomSyllabus, deleteChapter, deleteSubject, mySyllabus, PURPOSES, renameChapter, setChapterStatus, updateSubject } from "@/server/services/syllabus.service";

const name = z.string().trim().min(1, "Please enter a name").max(120);
const book = z.string().trim().max(120).nullable().optional();

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create"), data: z.object({ name, purpose: z.enum(PURPOSES), subjects: z.array(z.object({ name, book, chapters: z.array(z.string().max(120)).max(200) })).min(1).max(30) }) }),
  z.object({ action: z.literal("addSubject"), data: z.object({ name, book }) }),
  z.object({ action: z.literal("updateSubject"), id: z.string(), data: z.object({ name: name.optional(), book }) }),
  z.object({ action: z.literal("deleteSubject"), id: z.string() }),
  z.object({ action: z.literal("addChapters"), subjectId: z.string(), names: z.array(z.string().max(120)).min(1).max(100) }),
  z.object({ action: z.literal("renameChapter"), id: z.string(), name }),
  z.object({ action: z.literal("deleteChapter"), id: z.string() }),
  z.object({ action: z.literal("status"), id: z.string(), status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED"]) }),
]);

export const GET = api(async ({ user }) => mySyllabus(user.id));

export const POST = api(async ({ req, user }) => {
  const i = await body(req, schema);
  switch (i.action) {
    case "create": return createCustomSyllabus(user.id, i.data);
    case "addSubject": return addSubject(user.id, i.data);
    case "updateSubject": return updateSubject(user.id, i.id, i.data);
    case "deleteSubject": await deleteSubject(user.id, i.id); return { ok: true };
    case "addChapters": return addChapters(user.id, i.subjectId, i.names);
    case "renameChapter": return renameChapter(user.id, i.id, i.name);
    case "deleteChapter": await deleteChapter(user.id, i.id); return { ok: true };
    case "status": return setChapterStatus(user.id, i.id, i.status);
  }
}, { rate: { limit: 120, windowSec: 60 } });
