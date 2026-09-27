import { prisma } from "@/server/db";
import { api, body } from "@/server/http";
import { dayKey } from "@/lib/engine/dates";
import { revisionCompleteSchema } from "@/lib/validation/schemas";
import { completeRevision } from "@/server/services/revision.service";
import { recomputeDailyStat } from "@/server/services/stats.service";

/** Quick "I revised this" with a recall rating (revision done outside a timed session). */
export const POST = api(async ({ req, user }) => {
  const input = await body(req, revisionCompleteSchema);
  const today = dayKey(new Date(), user.timezone);
  const res = await completeRevision(user.id, input.topicId, { accuracy: input.accuracy ?? null, recall: input.recall }, today);
  await prisma.task.updateMany({ where: { userId: user.id, date: today, type: "REVISION", topicId: input.topicId, status: { in: ["PENDING", "PARTIAL", "IN_PROGRESS"] } }, data: { status: "DONE", completionPct: 100, completedAt: new Date() } });
  await recomputeDailyStat(user.id, today, user.timezone);
  return res;
});
