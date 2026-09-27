import { prisma } from "@/server/db";
import { BENCHMARK } from "@/config/scoring";
import { addDays, dayKey } from "@/lib/engine/dates";
import { aggregateValues, compareToBenchmark, type BenchmarkValue } from "@/lib/engine/benchmark";

type Metric = "MOCK_PERCENT" | "ACCURACY" | "WEEKLY_MINUTES" | "QUESTIONS_PER_DAY" | "CONSISTENCY";

/** Per-student values for the last 30 days (null = not enough data). */
async function userMetrics(userId: string, today: string): Promise<Record<Metric, number | null>> {
  const [stats, mocks] = await Promise.all([
    prisma.dailyStat.findMany({ where: { userId, date: { gte: addDays(today, -29), lte: today } } }),
    prisma.mockAttempt.findMany({ where: { userId, status: "SUBMITTED", mock: { type: { in: ["FULL", "SECTIONAL"] } } }, orderBy: { submittedAt: "desc" }, take: 3 }),
  ]);
  const q = stats.reduce((s, d) => s + d.questions, 0);
  const c = stats.reduce((s, d) => s + d.correct, 0);
  const minutes = stats.reduce((s, d) => s + d.actualMinutes, 0);
  const active = stats.filter((d) => d.actualMinutes >= 25).length;
  return {
    MOCK_PERCENT: mocks.length ? mocks.reduce((s, m) => s + (m.percent ?? 0), 0) / mocks.length : null,
    ACCURACY: q >= 50 ? (c / q) * 100 : null,
    WEEKLY_MINUTES: stats.length >= 7 ? (minutes / 30) * 7 : null,
    QUESTIONS_PER_DAY: stats.length >= 7 ? q / 30 : null,
    CONSISTENCY: stats.length >= 7 ? (active / 30) * 100 : null,
  };
}

/** Aggregate anonymized benchmarks from opted-in students. Only publishes groups with ≥ k students. */
export async function aggregateBenchmarks(now = new Date()) {
  const exams = await prisma.exam.findMany({ where: { isActive: true } });
  const published: { exam: string; metric: string; n: number }[] = [];
  for (const exam of exams) {
    const users = await prisma.user.findMany({ where: { benchmarkOptIn: true, profile: { examId: exam.id } }, select: { id: true, timezone: true } });
    if (users.length < BENCHMARK.minSampleSize) continue;
    const values: Record<Metric, number[]> = { MOCK_PERCENT: [], ACCURACY: [], WEEKLY_MINUTES: [], QUESTIONS_PER_DAY: [], CONSISTENCY: [] };
    for (const u of users) {
      const m = await userMetrics(u.id, dayKey(now, u.timezone));
      for (const k of Object.keys(values) as Metric[]) if (m[k] !== null) values[k].push(m[k]!);
    }
    for (const metric of Object.keys(values) as Metric[]) {
      const agg = aggregateValues(values[metric]);
      if (!agg) continue;
      await prisma.benchmarkStat.deleteMany({ where: { examId: exam.id, metric, source: "AGGREGATE", subjectId: null, topicId: null } });
      await prisma.benchmarkStat.create({ data: { examId: exam.id, metric, value: agg.value, p25: agg.p25, p75: agg.p75, sampleSize: agg.sampleSize, source: "AGGREGATE", computedAt: now } });
      published.push({ exam: exam.shortName, metric, n: agg.sampleSize });
    }
  }
  return published;
}

const LABELS: Record<Metric, { label: string; unit: "pp" | "min" | "q"; fmt: (v: number) => string }> = {
  MOCK_PERCENT: { label: "Mock score", unit: "pp", fmt: (v) => `${Math.round(v)}%` },
  ACCURACY: { label: "Practice accuracy", unit: "pp", fmt: (v) => `${Math.round(v)}%` },
  WEEKLY_MINUTES: { label: "Study time / week", unit: "min", fmt: (v) => `${Math.round(v / 60)}h` },
  QUESTIONS_PER_DAY: { label: "Questions / day", unit: "q", fmt: (v) => `${Math.round(v)}` },
  CONSISTENCY: { label: "Consistency", unit: "pp", fmt: (v) => `${Math.round(v)}%` },
};

/** Compare the student with real aggregates when available, else clearly-labelled reference values. */
export async function benchmarkComparisons(userId: string, now = new Date()) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, include: { profile: true } });
  if (!user.benchmarkOptIn) return { optedOut: true as const, items: [] };
  if (!user.profile) return { optedOut: false as const, items: [] };
  const [rows, mine] = await Promise.all([
    prisma.benchmarkStat.findMany({ where: { examId: user.profile.examId, subjectId: null, topicId: null } }),
    userMetrics(userId, dayKey(now, user.timezone)),
  ]);
  const items = (Object.keys(LABELS) as Metric[]).flatMap((metric) => {
    const agg = rows.find((r) => r.metric === metric && r.source === "AGGREGATE" && r.sampleSize >= BENCHMARK.minSampleSize);
    const b = agg ?? rows.find((r) => r.metric === metric && r.source === "REFERENCE");
    const v = mine[metric];
    if (!b || v === null) return [];
    const bv: BenchmarkValue = { metric, value: b.value, p25: b.p25, p75: b.p75, sampleSize: b.sampleSize, source: b.source as "AGGREGATE" | "REFERENCE" };
    const cmp = compareToBenchmark(v, bv, LABELS[metric].unit);
    return [{ ...cmp, metric, label: LABELS[metric].label, sourceLabel: cmp.label, you: LABELS[metric].fmt(v), benchmark: LABELS[metric].fmt(b.value), youRaw: v, benchmarkRaw: b.value, source: bv.source }];
  });
  return { optedOut: false as const, items };
}
