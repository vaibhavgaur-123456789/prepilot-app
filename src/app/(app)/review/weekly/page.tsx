import { requireStudent } from "@/server/auth/guards";
import { generateWeeklyReport, listWeeklyReports } from "@/server/services/review.service";
import { formatMinutes } from "@/lib/engine/dates";
import { Card, CardTitle, EmptyState, PageHeader, Stat } from "@/components/ui";

export const metadata = { title: "Weekly report" };

const pct = (v: number | null) => (v === null ? "–" : `${Math.round(v * 100)}%`);

export default async function WeeklyPage() {
  const user = await requireStudent();
  let reports = await listWeeklyReports(user.id);
  if (reports.length === 0) {
    await generateWeeklyReport(user.id).catch(() => undefined);
    reports = await listWeeklyReports(user.id);
  }
  // Keep the current week's report fresh.
  const current = await generateWeeklyReport(user.id, new Date().toISOString().slice(0, 10)).catch(() => null);
  const all = current ? [current, ...reports.filter((r) => r.weekStart !== current.weekStart)] : reports;

  return (
    <div className="space-y-4">
      <PageHeader title="Weekly reports" subtitle="Generated from your measured activity each week." />
      {all.length === 0 && <EmptyState title="No reports yet">Your first report appears after a week of study.</EmptyState>}
      {all.map((r, i) => (
        <Card key={r.weekStart}>
          <CardTitle eyebrow={i === 0 && current ? "This week (so far)" : "Week"}>{r.weekStart} → {r.weekEnd}</CardTitle>
          <p className="mb-3 text-sm">{r.headline}</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="Study hours" value={formatMinutes(r.studyMinutes)} sub={`of ${formatMinutes(r.plannedMinutes)} planned`} />
            <Stat label="Questions" value={r.questions.toLocaleString("en-IN")} />
            <Stat label="Accuracy" value={`${pct(r.prevAccuracy)} → ${pct(r.accuracy)}`} />
            <Stat label="Consistency" value={`${r.consistencyPct}%`} sub={`${r.activeDays}/7 days`} />
            <Stat label="Best subject" value={r.bestSubject?.name ?? "–"} sub={r.bestSubject ? pct(r.bestSubject.accuracy) : ""} />
            <Stat label="Weakest" value={r.weakestSubject?.name ?? "–"} sub={r.weakestSubject ? pct(r.weakestSubject.accuracy) : ""} />
            <Stat label="Most improved" value={r.mostImproved?.topic ?? "–"} sub={r.mostImproved ? `${pct(r.mostImproved.from)} → ${pct(r.mostImproved.to)}` : ""} />
            <Stat label="Mocks · revisions" value={`${r.mocks} · ${r.revisionsDone}/${r.revisionsDue}`} />
          </div>
          {r.priorities?.length > 0 && (
            <>
              <p className="mt-4 text-sm font-semibold">Next week&apos;s priorities</p>
              <ol className="mt-1 list-inside list-decimal space-y-1 text-sm">{r.priorities.map((p) => <li key={p.title}>{p.title} <span className="text-xs text-muted">({p.reasons.join(", ")})</span></li>)}</ol>
            </>
          )}
        </Card>
      ))}
    </div>
  );
}
