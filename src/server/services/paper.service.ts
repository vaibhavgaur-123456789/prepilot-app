import { prisma } from "@/server/db";
import { badRequest } from "@/server/errors";
import { dayKey } from "@/lib/engine/dates";
import { parseJson, toJson } from "@/lib/json";
import type { XpAward } from "@/lib/engine/xp";
import { awardXp } from "./gamification.service";
import { recomputeDailyStat } from "./stats.service";
import { trackEvent } from "./context";

/** Papers are solved on paper; the app only times them. Anything shorter than this is not rewarded. */
const MIN_REWARD_SECONDS = 10 * 60;
const MAX_PAPER_SECONDS = 6 * 3600;

export interface PaperInput {
  clientId: string;
  title: string;
  plannedMinutes: number;
  activeSeconds: number;
  pauseCount: number;
  laps: number[];
  totalQuestions: number | null;
  attempted: number | null;
  marksObtained: number | null;
  totalMarks: number | null;
  note: string;
  startedAt: string;
  endedAt: string;
}

const percentOf = (p: { marksObtained: number | null; totalMarks: number | null }) =>
  p.marksObtained !== null && p.totalMarks ? Math.round((p.marksObtained / p.totalMarks) * 1000) / 10 : null;

export async function savePaper(userId: string, input: PaperInput, now = new Date()) {
  const startedAt = new Date(input.startedAt);
  const endedAt = new Date(input.endedAt);
  if (!(startedAt < endedAt)) throw badRequest("The paper must end after it started.");
  if (endedAt.getTime() > now.getTime() + 5 * 60_000) throw badRequest("The end time is in the future.");
  const wall = (endedAt.getTime() - startedAt.getTime()) / 1000;
  // The timer cannot have run for longer than the wall-clock time between start and end.
  const activeSeconds = Math.round(Math.min(input.activeSeconds, wall + 60, MAX_PAPER_SECONDS));
  if (input.totalQuestions !== null && input.attempted !== null && input.attempted > input.totalQuestions) throw badRequest("Attempted questions can't be more than the total.");
  if (input.marksObtained !== null && input.totalMarks !== null && input.marksObtained > input.totalMarks) throw badRequest("Marks obtained can't be more than the total marks.");

  const existing = await prisma.paperLog.findFirst({ where: { userId, id: input.clientId } });
  if (existing) return { paper: shape(existing), xp: [] as XpAward[] }; // offline retry: already saved

  const paper = await prisma.paperLog.create({
    data: {
      id: input.clientId,
      userId,
      title: input.title || "Paper",
      plannedMinutes: input.plannedMinutes,
      activeSeconds,
      pauseCount: input.pauseCount,
      laps: toJson(input.laps.filter((s) => s >= 0 && s <= activeSeconds + 60).slice(0, 20)),
      totalQuestions: input.totalQuestions,
      attempted: input.attempted,
      marksObtained: input.marksObtained,
      totalMarks: input.totalMarks,
      note: input.note,
      startedAt,
      endedAt,
    },
  });

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { timezone: true } });
  const date = dayKey(endedAt, user.timezone);
  const xp =
    activeSeconds >= MIN_REWARD_SECONDS
      ? await awardXp(userId, date, [{ type: "MOCK", amount: Math.min(40, Math.round(activeSeconds / 180)), reason: "Paper solved with the timer", dedupeKey: `paper:${paper.id}` }])
      : [];
  await recomputeDailyStat(userId, date, user.timezone);
  await trackEvent(userId, "paper_logged", { minutes: Math.round(activeSeconds / 60), scored: paper.marksObtained !== null });
  return { paper: shape(paper), xp };
}

function shape(p: Awaited<ReturnType<typeof prisma.paperLog.findFirstOrThrow>>) {
  return {
    id: p.id,
    title: p.title,
    plannedMinutes: p.plannedMinutes,
    activeSeconds: p.activeSeconds,
    pauseCount: p.pauseCount,
    laps: parseJson<number[]>(p.laps, []),
    totalQuestions: p.totalQuestions,
    attempted: p.attempted,
    marksObtained: p.marksObtained,
    totalMarks: p.totalMarks,
    percent: percentOf(p),
    note: p.note,
    endedAt: p.endedAt.toISOString(),
  };
}
export type PaperView = ReturnType<typeof shape>;

export async function listPapers(userId: string, take = 50) {
  const rows = await prisma.paperLog.findMany({ where: { userId }, orderBy: { endedAt: "desc" }, take });
  const papers = rows.map(shape);
  const scored = papers.filter((p) => p.percent !== null);
  const onTime = papers.filter((p) => p.activeSeconds <= p.plannedMinutes * 60);
  return {
    papers,
    records: {
      count: papers.length,
      bestPercent: scored.length ? Math.max(...scored.map((p) => p.percent!)) : null,
      fastestOnTime: onTime.length ? onTime.reduce((a, b) => (b.activeSeconds / b.plannedMinutes < a.activeSeconds / a.plannedMinutes ? b : a)) : null,
      totalMinutes: Math.round(papers.reduce((s, p) => s + p.activeSeconds, 0) / 60),
    },
  };
}

export async function deletePaper(userId: string, id: string) {
  const p = await prisma.paperLog.findFirst({ where: { id, userId } });
  if (!p) return;
  await prisma.paperLog.delete({ where: { id } });
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { timezone: true } });
  await recomputeDailyStat(userId, dayKey(p.endedAt, user.timezone), user.timezone);
}
