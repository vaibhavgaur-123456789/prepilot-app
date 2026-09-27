import Link from "next/link";
import { requireStudent } from "@/server/auth/guards";
import { getHome } from "@/server/services/dashboard.service";
import { formatMinutes } from "@/lib/engine/dates";
import { Alert, Badge, Card, CardTitle, LinkButton, Progress, Provenance, Stat } from "@/components/ui";
import { FlameIcon } from "@/components/icons";

export const metadata = { title: "Home" };

const typeLabel: Record<string, string> = { STUDY: "Learn", PRACTICE: "Practice", REVISION: "Revision", MOCK: "Mock test", MOCK_ANALYSIS: "Mock analysis", MISTAKE_REVIEW: "Mistake review", CUSTOM: "Task" };

export default async function HomePage() {
  const user = await requireStudent();
  const h = await getHome(user.id);
  const pct = h.progress.plannedMinutes > 0 ? Math.min(100, Math.round((h.progress.actualMinutes / h.progress.plannedMinutes) * 100)) : 0;
  const nextHref = h.next ? (h.next.type === "MOCK" && h.next.mockId ? `/tests/start/${h.next.mockId}` : h.next.type === "MOCK_ANALYSIS" ? "/tests" : `/study/session/${h.next.id}`) : "/study";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-sm text-muted">{h.briefing.greeting}, {h.user.firstName} 👋</p>
          <h1 className="text-2xl font-bold tracking-tight">{h.exam.shortName} preparation</h1>
        </div>
        <div className="text-right">
          <p className="tabular text-2xl font-bold">{h.exam.daysLeft}</p>
          <p className="text-xs text-muted">days left</p>
        </div>
      </div>

      {h.recovery && (
        <Alert tone="warning" title="Recovery mode">
          You are behind your original plan. We will not try to complete everything at once. Today focuses on high-value topics, weak areas and due revision. <Link href="/plan" className="font-semibold underline">See plan</Link>
        </Alert>
      )}
      {h.nightReviewDue && (
        <Alert tone="primary" title="Evening review">
          Two minutes to close the day: what went well, what got in the way. <Link href="/review/night" className="font-semibold underline">Review today</Link>
        </Alert>
      )}

      {/* NEXT ACTION: the answer to "what should I do now?" */}
      <Card className="border-primary/30">
        <CardTitle eyebrow="Next action">{h.next ? h.next.title : "Today's plan is complete 🎉"}</CardTitle>
        {h.next ? (
          <>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
              <Badge tone="primary">{typeLabel[h.next.type] ?? h.next.type}</Badge>
              <span>{h.next.plannedMinutes} min</span>
              {h.next.questionTarget > 0 && <span>· {h.next.questionTarget} questions</span>}
              {h.next.startTime && <span>· planned {h.next.startTime}</span>}
            </div>
            {h.next.objective && <p className="mt-2 text-sm">{h.next.objective}</p>}
            {h.next.reasons.length > 0 && (
              <details className="mt-2 text-sm">
                <summary className="cursor-pointer text-muted">Why this?</summary>
                <ul className="mt-1 list-inside list-disc text-muted">{h.next.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
              </details>
            )}
            <LinkButton href={nextHref} className="mt-4 w-full sm:w-auto">▶ Start study</LinkButton>
          </>
        ) : (
          <p className="text-sm text-muted">Great work. If you still have energy, clear a due revision or re-solve a mistake. Otherwise, rest well.</p>
        )}
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardTitle action={<Link href="/plan" className="text-sm font-semibold text-primary">Plan →</Link>}>Today&apos;s progress</CardTitle>
          <Progress value={pct} label={`${formatMinutes(h.progress.actualMinutes)} of ${formatMinutes(h.progress.plannedMinutes)} planned`} tone={pct >= 80 ? "success" : "primary"} />
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Stat label="Tasks done" value={`${h.progress.tasksDone}/${h.progress.tasksTotal}`} />
            <Stat label="Daily score" value={h.progress.dailyScore ?? "–"} sub={h.progress.dailyScore === null ? "after your first session" : "/100"} />
          </div>
          {h.briefing.yesterday && <p className="mt-3 text-sm text-muted">Yesterday: {h.briefing.yesterday}</p>}
          {h.briefing.improve && <p className="mt-1 text-sm"><b>One thing to improve:</b> {h.briefing.improve}</p>}
        </Card>

        <Card>
          <CardTitle action={<Link href="/analytics#readiness" className="text-sm font-semibold text-primary">How it&apos;s calculated →</Link>} eyebrow={<span className="inline-flex items-center gap-2">Readiness <Provenance kind="estimate" /></span>}>
            <span className="tabular text-3xl font-bold">{h.readiness.score}</span>
            <span className="text-muted"> / 100</span>
            {h.readiness.delta !== null && <span className={`ml-2 text-sm font-semibold ${h.readiness.delta >= 0 ? "text-success" : "text-danger"}`}>{h.readiness.delta >= 0 ? "↑" : "↓"} {Math.abs(h.readiness.delta)} this week</span>}
          </CardTitle>
          <div className="space-y-2">
            {Object.entries(h.readiness.components).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between text-sm">
                <span className="text-muted">{h.readiness.labels[k as keyof typeof h.readiness.labels] ?? k}</span>
                <span className="tabular font-medium">{v === null ? <span className="text-muted">not measured yet</span> : v}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted">Confidence: <b>{h.readiness.confidence.toLowerCase()}</b>. A preparation estimate, not a probability of selection.</p>
        </Card>
      </div>

      <Card>
        <CardTitle>You need attention</CardTitle>
        {h.attention.length === 0 ? (
          <p className="text-sm text-muted">No weak topics or overdue revisions detected right now. Weak topics appear after about 10 attempts per topic.</p>
        ) : (
          <ul className="divide-y divide-border">
            {h.attention.map((a) => (
              <li key={a.title + a.kind} className="flex items-center justify-between gap-3 py-2.5">
                <div>
                  <p className="text-sm font-medium">{a.title}</p>
                  <p className="text-xs text-muted">{a.detail}</p>
                </div>
                <Badge tone={a.priority === "HIGH" ? "danger" : "warning"}>{a.kind === "WEAK" ? `${a.priority === "HIGH" ? "High" : "Medium"} priority` : "Revision"}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardTitle action={<Link href="/review/weekly" className="text-sm font-semibold text-primary">Weekly report →</Link>}>This week</CardTitle>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <Stat label="Study" value={formatMinutes(h.week.minutes)} />
            <Stat label="Questions" value={h.week.questions.toLocaleString("en-IN")} />
            <Stat label="Accuracy" value={h.week.accuracy === null ? "–" : `${Math.round(h.week.accuracy * 100)}%`} />
            <Stat label="Mocks" value={h.week.mocks} />
            <Stat label="Consistency" value={`${h.week.consistencyPct}%`} />
            <Stat label="Level" value={h.xp.level} sub={`${h.xp.xp} XP`} />
          </div>
          <p className="mt-3 text-sm text-muted">{h.pace.summary}</p>
        </Card>
        <Card>
          <CardTitle>Momentum</CardTitle>
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-warning-soft text-warning"><FlameIcon /></span>
            <div>
              <p className="text-lg font-semibold">{h.xp.streak}-day streak</p>
              <p className="text-xs text-muted">Best: {h.xp.bestStreak} days. One rest day a week doesn&apos;t break it.</p>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            <Progress value={h.nextMilestone.progress} max={h.nextMilestone.at} label={`Next milestone: ${h.nextMilestone.label}`} showValue={false} />
            <Progress value={h.challenge.progress} max={h.challenge.target} label={`Weekly challenge: ${h.challenge.title} (${h.challenge.progress}/${h.challenge.target})${h.challenge.done ? " ✓" : ""}`} tone="success" showValue={false} />
            <Progress value={h.xp.progress * 100} label={`Level ${h.xp.level} → ${h.xp.level + 1}`} tone="neutral" />
          </div>
        </Card>
      </div>
    </div>
  );
}
