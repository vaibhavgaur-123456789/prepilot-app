import Link from "next/link";
import { requireStudent } from "@/server/auth/guards";
import { getDayPlan } from "@/server/services/planner.service";
import { revisionQueue } from "@/server/services/revision.service";
import { mistakeSummary } from "@/server/services/mistakes.service";
import { getStudentContext } from "@/server/services/context";
import { Badge, Card, CardTitle, EmptyState, LinkButton, PageHeader } from "@/components/ui";
import { getT } from "@/i18n/server";

export const metadata = { title: "Study" };

export default async function StudyPage() {
  const user = await requireStudent();
  const ctx = await getStudentContext(user.id);
  const [plan, queue, mistakes, { t }] = await Promise.all([getDayPlan(user.id, ctx.today), revisionQueue(user.id, ctx.exam.id, ctx.today), mistakeSummary(user.id), getT()]);
  const open = plan.tasks.filter((t) => ["PENDING", "IN_PROGRESS", "PARTIAL"].includes(t.status) && !["MOCK", "MOCK_ANALYSIS"].includes(t.type));
  const due = queue.filter((q) => q.due);

  return (
    <div className="space-y-4">
      <PageHeader title={t("study.title")} subtitle={t("study.subtitle")} action={<LinkButton href="/study/session/free" variant="secondary">{t("study.free")}</LinkButton>} />
      <Card>
        <CardTitle>{t("study.blocks")}</CardTitle>
        {open.length === 0 ? (
          <EmptyState title="All study blocks are done for today">Revise something due below, or re-solve a mistake.</EmptyState>
        ) : (
          <ul className="divide-y divide-border">
            {open.map((task) => (
              <li key={task.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{task.title}</p>
                  <p className="text-xs text-muted">{task.startTime ?? "–"} · {task.plannedMinutes} {t("common.min")}{task.questionTarget ? ` · ${task.questionTarget} ${t("common.questions")}` : ""}</p>
                </div>
                <LinkButton href={`/study/session/${task.id}`} className="shrink-0">{t("common.start")}</LinkButton>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardTitle action={<Link href="/study/revision" className="text-sm font-semibold text-primary">{t("study.all")}</Link>}>{t("study.revisionDue")}</CardTitle>
          {due.length === 0 ? <p className="text-sm text-muted">Nothing due today. {queue.length > 0 && `Next: ${queue[0].topicName} on ${queue[0].nextRevisionOn}.`}</p> : (
            <ul className="space-y-1.5 text-sm">{due.slice(0, 5).map((q) => <li key={q.topicId} className="flex justify-between gap-2"><span>{q.subjectName}: {q.topicName}</span>{q.overdueDays > 0 ? <Badge tone="warning">{q.overdueDays}d overdue</Badge> : <Badge tone="success">today</Badge>}</li>)}</ul>
          )}
        </Card>
        <Card>
          <CardTitle action={<Link href="/study/mistakes" className="text-sm font-semibold text-primary">{t("study.mistakeBook")}</Link>}>{t("study.mistakes")}</CardTitle>
          <p className="tabular text-2xl font-bold">{mistakes.open}<span className="text-sm font-normal text-muted"> open</span></p>
          {mistakes.top && <p className="mt-1 text-sm">{mistakes.top.message}</p>}
          {mistakes.top && <p className="mt-1 text-xs text-muted">{mistakes.top.fix}</p>}
        </Card>
      </div>
    </div>
  );
}
