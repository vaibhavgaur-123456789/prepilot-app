import Link from "next/link";
import { requireStudent } from "@/server/auth/guards";
import { getResult } from "@/server/services/mock.service";
import { MISTAKE_LABELS, type MistakeCategory } from "@/lib/engine/mistakes";
import { Badge, Card, CardTitle, PageHeader, Progress, Provenance, Stat } from "@/components/ui";
import { MarkAnalyzed } from "@/components/MarkAnalyzed";

export const metadata = { title: "Test analysis" };

const pct = (v: number | null | undefined) => (v === null || v === undefined ? "–" : `${Math.round(v * 100)}%`);

export default async function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireStudent();
  const { id } = await params;
  const r = await getResult(user.id, id);
  const a = r.analysis;
  const m = a.confidenceMatrix;
  const wrong = r.questions.filter((q) => !q.isCorrect && !q.skipped);
  const mins = Math.round(r.timeTakenSec / 60);

  return (
    <div className="space-y-4">
      <PageHeader title={r.mock.title} subtitle={`Submitted ${r.submittedAt ? new Date(r.submittedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : ""}`} action={<Provenance kind="measured" />} />
      <Card>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label="Score" value={`${r.score} / ${r.maxScore}`} sub={`${r.percent}%${r.previousPercent !== null ? ` (prev ${r.previousPercent}%)` : ""}`} />
          <Stat label="Accuracy" value={pct(r.accuracy)} sub={`${r.correct} correct · ${r.wrong} wrong`} />
          <Stat label="Attempt rate" value={pct(r.attemptRate)} sub={`${r.skipped} skipped`} />
          <Stat label="Time" value={`${mins} min`} sub={`${a.avgTimePerQuestion ?? 0}s / question`} />
        </div>
        {r.wrong > 0 && <p className="mt-3 text-xs text-muted">Negative marking cost you {Math.round((r.wrong * r.mock.negativeMarking) * 100) / 100} marks. Skipping pure guesses would have kept them.</p>}
        {!r.analyzedAt && <div className="mt-3"><MarkAnalyzed attemptId={r.id} /></div>}
      </Card>

      {a.insights?.length > 0 && (
        <Card className="bg-primary-soft">
          <CardTitle>What this test says</CardTitle>
          <ul className="list-inside list-disc space-y-1 text-sm">{a.insights.map((s) => <li key={s}>{s}</li>)}</ul>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardTitle>By subject</CardTitle>
          <div className="space-y-3">
            {a.bySubject?.map((s) => (
              <div key={s.id}>
                <Progress value={(s.accuracy ?? 0) * 100} label={`${s.name}: ${s.correct}/${s.total} correct, ${s.skipped} skipped, ${Math.round(s.score * 100) / 100} marks`} tone={(s.accuracy ?? 0) >= 0.75 ? "success" : (s.accuracy ?? 0) >= 0.55 ? "primary" : "danger"} />
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <CardTitle>Confidence vs result</CardTitle>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-muted"><th className="py-1">You felt…</th><th>Correct</th><th>Wrong</th></tr></thead>
            <tbody>
              {(["HIGH", "MEDIUM", "LOW", "NONE"] as const).map((k) => (
                <tr key={k} className="border-t border-border">
                  <td className="py-1.5">{k === "HIGH" ? "Certain" : k === "MEDIUM" ? "Fairly sure" : k === "LOW" ? "Guessing" : "Not rated"}</td>
                  <td className="tabular">{m?.[k]?.correct ?? 0}</td>
                  <td className={`tabular ${k === "HIGH" && (m?.[k]?.wrong ?? 0) > 0 ? "font-bold text-danger" : ""}`}>{m?.[k]?.wrong ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-muted"><b>Certain + wrong</b> = overconfidence (concept gaps or traps). <b>Guessing + correct</b> = knowledge that needs strengthening.</p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            <Badge tone="danger">{a.overconfident?.length ?? 0} overconfident</Badge>
            <Badge tone="warning">{a.underconfident?.length ?? 0} underconfident</Badge>
            <Badge>{a.time?.overTime ?? 0} over time</Badge>
            <Badge>{a.time?.fastWrong ?? 0} rushed & wrong</Badge>
          </div>
        </Card>
      </div>

      <Card>
        <CardTitle>By topic</CardTitle>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <thead><tr className="text-left text-xs text-muted"><th className="py-1">Topic</th><th>Correct</th><th>Wrong</th><th>Skipped</th><th>Accuracy</th><th>Time</th></tr></thead>
            <tbody>
              {[...(a.byTopic ?? [])].sort((x, y) => (x.accuracy ?? 1) - (y.accuracy ?? 1)).map((t) => (
                <tr key={t.id} className="border-t border-border">
                  <td className="py-1.5">{t.name}</td><td className="tabular">{t.correct}</td><td className="tabular">{t.wrong}</td><td className="tabular">{t.skipped}</td>
                  <td className="tabular">{pct(t.accuracy)}</td><td className="tabular">{t.timeSec}s</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardTitle action={<Link href="/study/mistakes" className="text-sm font-semibold text-primary">Mistake book →</Link>}>Review wrong answers ({wrong.length})</CardTitle>
        <ul className="space-y-3">
          {r.questions.filter((q) => !q.isCorrect).map((q) => (
            <li key={q.id} className="rounded-xl border border-border p-3">
              <div className="flex flex-wrap gap-2 text-xs text-muted">
                <span>{q.subject} · {q.topic}</span>
                {q.skipped ? <Badge>Skipped</Badge> : <Badge tone="danger">Wrong</Badge>}
                {q.mistakeCategory && <Badge tone="warning">{MISTAKE_LABELS[q.mistakeCategory as MistakeCategory]}</Badge>}
                {q.confidence === "HIGH" && !q.skipped && <Badge tone="danger">Was certain</Badge>}
                <span>{q.timeSpentSec}s (expected ~{q.expectedSeconds}s)</span>
              </div>
              <p className="mt-1 text-sm font-medium">{q.stem}</p>
              <p className="mt-1 text-sm">
                {q.selected !== null && <span className="text-danger">Your answer: {q.options[q.selected]}. </span>}
                <span className="text-success">Correct: {q.options[q.correctIndex]}</span>
              </p>
              <p className="mt-1 text-xs text-muted">{q.explanation}</p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
