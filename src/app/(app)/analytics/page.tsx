import Link from "next/link";
import { requireStudent } from "@/server/auth/guards";
import { getAnalytics } from "@/server/services/analytics.service";
import { formatMinutes } from "@/lib/engine/dates";
import { Badge, Card, CardTitle, cx, EmptyState, PageHeader, Progress, Provenance, Stat } from "@/components/ui";
import { PlannedActualChart, SubjectBars, TrendChart } from "@/components/charts";

export const metadata = { title: "Analytics" };

const pct = (v: number | null | undefined) => (v === null || v === undefined ? "–" : `${Math.round(v * 100)}%`);
const statusTone = { AHEAD: "success", ON_TRACK: "success", SLIGHTLY_BEHIND: "warning", BEHIND: "danger", NOT_ENOUGH_DATA: "neutral" } as const;
const statusText = { AHEAD: "Ahead", ON_TRACK: "On track", SLIGHTLY_BEHIND: "Slightly behind", BEHIND: "Behind", NOT_ENOUGH_DATA: "Not enough data" } as const;

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const user = await requireStudent();
  const days = (await searchParams).days === "7" ? 7 : 30;
  const a = await getAnalytics(user.id, days);
  const short = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Analytics"
        subtitle={`${a.exam.name} · ${a.exam.daysLeft} days to go`}
        action={
          <div className="flex rounded-xl border border-border p-1" role="tablist" aria-label="Range">
            {[7, 30].map((d) => <Link key={d} role="tab" aria-selected={days === d} href={`/analytics?days=${d}`} className={cx("rounded-lg px-3 py-1.5 text-sm font-semibold", days === d ? "bg-primary text-on-primary" : "text-muted")}>{d} days</Link>)}
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <Stat label="Study time" value={formatMinutes(a.totals.minutes)} sub={`${a.totals.activeDays} active days`} />
        <Stat label="Plan completion" value={pct(a.totals.completion)} sub="actual ÷ planned" />
        <Stat label="Questions" value={a.totals.questions.toLocaleString("en-IN")} />
        <Stat label="Accuracy" value={pct(a.totals.accuracy)} />
        <Stat label="Syllabus" value={`${a.coverage.topicsCompleted}/${a.coverage.topicsTotal}`} sub="topics completed" />
      </div>

      <Card>
        <CardTitle>Planned vs actual</CardTitle>
        <PlannedActualChart data={a.series.map((s) => ({ label: short(s.date), planned: s.planned, actual: s.actual }))} />
      </Card>

      <Card id="readiness">
        <CardTitle eyebrow={<span className="inline-flex items-center gap-2">Preparation readiness <Provenance kind="estimate" /></span>} action={<Badge tone={a.readiness.confidence === "HIGH" ? "success" : a.readiness.confidence === "MEDIUM" ? "primary" : "warning"}>Confidence: {a.readiness.confidence.toLowerCase()}</Badge>}>
          <span className="tabular text-3xl font-bold">{a.readiness.score}</span><span className="text-muted"> / 100</span>
        </CardTitle>
        <p className="text-sm text-muted">A transparent summary of your measured preparation. It is <b>not</b> a probability of selection. {a.readiness.confidenceExplanation}</p>
        <div className="mt-4 space-y-3">
          {a.readiness.components.map((c) => (
            <div key={c.key}>
              {c.value === null ? (
                <div className="flex justify-between text-sm"><span>{c.label} <span className="text-xs text-muted">(weight {Math.round(c.weight * 100)}%)</span></span><span className="text-muted">not measured</span></div>
              ) : (
                <Progress value={c.value} label={`${c.label} (weight ${Math.round(c.weight * 100)}%)`} tone={c.value >= 70 ? "success" : c.value >= 50 ? "primary" : "warning"} />
              )}
              <p className="mt-0.5 text-xs text-muted">{c.explanation}</p>
            </div>
          ))}
        </div>
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer font-semibold text-primary">Methodology</summary>
          <p className="mt-2 text-muted">Readiness = weighted average of the measured components above. Components without enough data are left out and the remaining weights are rescaled. That lowers confidence, which is shown. Confidence grows with the number of mocks (up to 10), questions (up to 600) and active days (up to 21). Weights are configurable and every daily snapshot stores the formula version used.</p>
        </details>
        {a.readinessHistory.length >= 2 && <div className="mt-4"><TrendChart data={a.readinessHistory.map((h) => ({ label: short(h.date), value: h.score }))} unit="" label="Readiness over time" height={180} /></div>}
      </Card>

      <Card>
        <CardTitle eyebrow={<span className="inline-flex items-center gap-2">Exam countdown <Provenance kind="projection" /></span>}>{a.pace.daysLeft} days remaining</CardTitle>
        <p className="mb-3 text-sm">{a.pace.summary}</p>
        <div className="grid gap-2 sm:grid-cols-3">
          {[a.pace.syllabus, a.pace.questions, a.pace.mocks].map((m) => (
            <div key={m.label} className="rounded-xl bg-surface-2 p-3">
              <div className="flex items-center justify-between"><p className="text-sm font-semibold">{m.label}</p><Badge tone={statusTone[m.status]}>{statusText[m.status]}</Badge></div>
              <p className="tabular mt-1 text-sm">Current <b>{m.current}</b> · Required <b>{m.required}</b> <span className="text-xs text-muted">{m.unit}</span></p>
              <p className="mt-1 text-xs text-muted">{m.message}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardTitle>Subject performance</CardTitle>
          <SubjectBars data={a.subjectPerformance.map((s) => ({ name: s.name, accuracy: s.accuracy, coverage: s.coverage }))} height={Math.max(180, a.subjectPerformance.length * 56)} />
          <ul className="mt-2 space-y-1 text-xs text-muted">{a.subjectPerformance.map((s) => <li key={s.id}>{s.name}: {s.accuracy === null ? "accuracy not measured yet" : `${s.accuracy}% over ${s.attempts} questions`} · {s.hours}h · {s.weakTopics} weak topic{s.weakTopics === 1 ? "" : "s"}</li>)}</ul>
        </Card>
        <Card>
          <CardTitle>Accuracy trend</CardTitle>
          {a.series.filter((s) => s.accuracy !== null).length < 2 ? <p className="text-sm text-muted">Solve a few questions on more days to see the trend.</p> : <TrendChart data={a.series.map((s) => ({ label: short(s.date), value: s.accuracy }))} unit="%" label="Daily accuracy" />}
          <CardTitle>Mock trend</CardTitle>
          {a.mocks.length < 2 ? <p className="text-sm text-muted">Take at least two tests.</p> : <TrendChart data={a.mocks.map((m) => ({ label: short(new Date(m.submittedAt).toISOString().slice(0, 10)), value: m.percent, name: m.title }))} unit="%" label="Test score" height={160} />}
        </Card>
      </div>

      <Card>
        <CardTitle>Weak topics & recovery pathway</CardTitle>
        {a.weakTopics.length === 0 ? <EmptyState title="No weak topics detected">A topic is judged after at least 10 attempts. Accuracy below 65%, or a clear decline, flags it.</EmptyState> : (
          <ul className="divide-y divide-border">
            {a.weakTopics.map((w) => (
              <li key={w.topicId} className="py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium">{w.subject}: {w.topic}</p>
                  <Badge tone={w.priority === "HIGH" ? "danger" : "warning"}>{w.priority === "HIGH" ? "High priority" : "Medium priority"}</Badge>
                </div>
                <p className="text-xs text-muted">Accuracy {pct(w.accuracy)} · {w.attempts} attempts · trend {w.trend.toLowerCase()}</p>
                <ol className="mt-2 flex flex-wrap gap-1.5 text-xs" aria-label="Recovery pathway">
                  {w.pathway.map((p, i) => (
                    <li key={p} className={cx("rounded-full px-2.5 py-1", i + 1 < w.step ? "bg-success-soft text-success" : i + 1 === w.step ? "bg-primary text-on-primary" : "bg-surface-2 text-muted")}>
                      {i + 1 < w.step ? "✓ " : i + 1 === w.step ? "▶ " : ""}{p}
                    </li>
                  ))}
                </ol>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardTitle action={<Link href="/study/revision" className="text-sm font-semibold text-primary">Revision →</Link>}>Revision health</CardTitle>
          <div className="grid grid-cols-3 gap-2">
            <Stat label="On time (30d)" value={a.revision.due ? `${Math.round((a.revision.onTime / a.revision.due) * 100)}%` : "–"} />
            <Stat label="Due now" value={a.revision.dueNow} />
            <Stat label="Overdue (open)" value={a.revision.overdueOpen} />
          </div>
        </Card>
        <Card>
          <CardTitle action={<Link href="/study/mistakes" className="text-sm font-semibold text-primary">Mistakes →</Link>}>Mistake patterns</CardTitle>
          {a.mistakes.top ? <p className="text-sm">{a.mistakes.top.message}</p> : <p className="text-sm text-muted">No open mistakes.</p>}
          <div className="mt-2 flex flex-wrap gap-2">{a.mistakes.byCategory.filter((c) => c.count).map((c) => <Badge key={c.category}>{c.count} {c.label.toLowerCase()}</Badge>)}</div>
        </Card>
      </div>

      <Card>
        <CardTitle eyebrow={<span className="inline-flex items-center gap-2">Benchmark <Provenance kind="benchmark" /></span>}>How you compare</CardTitle>
        {a.benchmark.optedOut ? <p className="text-sm text-muted">You&apos;ve opted out of benchmarking. Turn it on in Profile → Privacy.</p> : a.benchmark.items.length === 0 ? <p className="text-sm text-muted">Not enough of your own data yet (needs about a week of activity).</p> : (
          <ul className="divide-y divide-border">
            {a.benchmark.items.map((b) => (
              <li key={b.metric} className="py-2.5">
                <div className="flex items-center justify-between text-sm"><span className="font-medium">{b.label}</span><span className="tabular">You <b>{b.you}</b> · Median <b>{b.benchmark}</b></span></div>
                <p className="text-xs text-muted">{b.text} <span className="italic">{b.sourceLabel}</span></p>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-xs text-muted">Benchmarks describe study habits and scores. They never predict selection. Anonymous benchmarks are only published for groups of 20+ students.</p>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardTitle>Personal patterns</CardTitle>
          {a.insights.length === 0 ? <p className="text-sm text-muted">Patterns appear once there&apos;s enough data (at least 5 sessions and 40 questions per comparison), so they&apos;re never guesses.</p> : <ul className="space-y-1.5 text-sm">{a.insights.map((i) => <li key={i.text}>• {i.text} <span className="text-xs text-muted">(n={i.sampleSize})</span></li>)}</ul>}
        </Card>
        <Card>
          <CardTitle>Personal records</CardTitle>
          <ul className="space-y-1.5 text-sm">
            <li>Longest study day: <b>{a.records.longestDay ? `${formatMinutes(a.records.longestDay.minutes)} (${a.records.longestDay.date})` : "–"}</b></li>
            <li>Most questions in a day: <b>{a.records.mostQuestions?.questions ?? "–"}</b></li>
            <li>Best test: <b>{a.records.bestMock ? `${a.records.bestMock.percent}% (${a.records.bestMock.title})` : "–"}</b></li>
            <li>Best streak: <b>{a.records.bestStreak} days</b></li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
