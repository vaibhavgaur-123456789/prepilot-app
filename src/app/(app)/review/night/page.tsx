import { requireStudent } from "@/server/auth/guards";
import { nightReview } from "@/server/services/review.service";
import { formatMinutes } from "@/lib/engine/dates";
import { Card, CardTitle, PageHeader, Stat } from "@/components/ui";
import { NightReviewForm } from "@/components/NightReviewForm";

export const metadata = { title: "Night review" };

export default async function NightReviewPage() {
  const user = await requireStudent();
  const r = await nightReview(user.id);
  return (
    <div className="space-y-4">
      <PageHeader title="Night review" subtitle="Two minutes to close the day. This is how tomorrow's plan learns." />
      <Card>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label="Planned" value={formatMinutes(r.plannedMinutes)} />
          <Stat label="Completed" value={formatMinutes(r.actualMinutes)} sub={`${r.completionPct}%`} />
          <Stat label="Questions" value={r.questions} sub={r.accuracy === null ? "" : `${Math.round(r.accuracy * 100)}% accuracy`} />
          <Stat label="Revision" value={r.revision} />
        </div>
        <p className="mt-3 text-sm">{r.message}</p>
      </Card>
      {r.dailyScore !== null && (
        <Card>
          <CardTitle>Daily preparation score: <span className="tabular">{r.dailyScore}/100</span></CardTitle>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {Object.entries(r.breakdown).map(([k, v]) => <Stat key={k} label={k[0].toUpperCase() + k.slice(1)} value={v ?? "n/a"} />)}
          </div>
        </Card>
      )}
      <NightReviewForm date={r.date} question={r.question} blockers={r.blockers} current={r.blocker} reviewed={r.reviewed} />
    </div>
  );
}
