import { z } from "zod";
import { api, body } from "@/server/http";
import { createExam, createSubject, updateBenchmark, updateExam, upsertQuestion, upsertTopic } from "@/server/services/admin.service";

const schema = z.discriminatedUnion("op", [
  z.object({ op: z.literal("exam.create"), data: z.object({ slug: z.string().regex(/^[a-z0-9-]{2,60}$/), name: z.string().min(2).max(100), shortName: z.string().min(2).max(30), category: z.string().max(20), durationMinutes: z.number().int().min(5).max(600), totalQuestions: z.number().int().min(1).max(500), marksPerQuestion: z.number().min(0.1).max(10), negativeMarking: z.number().min(0).max(10) }) }),
  z.object({ op: z.literal("exam.update"), id: z.string(), data: z.object({ name: z.string().min(2).max(100).optional(), description: z.string().max(500).optional(), durationMinutes: z.number().int().min(5).max(600).optional(), negativeMarking: z.number().min(0).max(10).optional(), marksPerQuestion: z.number().min(0.1).max(10).optional(), isActive: z.boolean().optional() }) }),
  z.object({ op: z.literal("subject.create"), examId: z.string(), data: z.object({ name: z.string().min(2).max(80), slug: z.string().regex(/^[a-z0-9-]{2,60}$/), weightage: z.number().min(0).max(100), isQuantitative: z.boolean(), isMemoryBased: z.boolean() }) }),
  z.object({ op: z.literal("topic.upsert"), data: z.object({ id: z.string().optional(), subjectId: z.string(), name: z.string().min(2).max(80), slug: z.string().regex(/^[a-z0-9-]{2,60}$/), weightage: z.number().int(), difficulty: z.number().int(), estimatedMinutes: z.number().int().min(15).max(3000), parentId: z.string().nullable().optional() }) }),
  z.object({ op: z.literal("question.upsert"), data: z.object({ id: z.string().optional(), topicId: z.string(), stem: z.string().min(5).max(3000), options: z.array(z.string().min(1).max(300)), correctIndex: z.number().int(), explanation: z.string().max(3000), difficulty: z.number().int().min(1).max(5), expectedSeconds: z.number().int().min(10).max(600), isActive: z.boolean() }) }),
  z.object({ op: z.literal("benchmark.update"), id: z.string(), data: z.object({ value: z.number(), p25: z.number().nullable(), p75: z.number().nullable() }) }),
]);

export const POST = api(async ({ req, user }) => {
  const input = await body(req, schema);
  switch (input.op) {
    case "exam.create": return createExam(user.id, input.data);
    case "exam.update": return updateExam(user.id, input.id, input.data);
    case "subject.create": return createSubject(user.id, input.examId, input.data);
    case "topic.upsert": return upsertTopic(user.id, input.data);
    case "question.upsert": return upsertQuestion(user.id, input.data);
    case "benchmark.update": return updateBenchmark(user.id, input.id, input.data);
  }
}, { admin: true, rate: { limit: 120, windowSec: 60 } });
