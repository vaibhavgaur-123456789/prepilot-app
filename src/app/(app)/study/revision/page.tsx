import { requireStudent } from "@/server/auth/guards";
import { getStudentContext } from "@/server/services/context";
import { revisionHealth, revisionQueue } from "@/server/services/revision.service";
import { RevisionList } from "@/components/RevisionList";
import { Card, PageHeader, Stat } from "@/components/ui";

export const metadata = { title: "Revision" };

export default async function RevisionPage() {
  const user = await requireStudent();
  const ctx = await getStudentContext(user.id);
  const [queue, health] = await Promise.all([revisionQueue(user.id, ctx.exam.id, ctx.today), revisionHealth(user.id, ctx.today)]);
  return (
    <div className="space-y-4">
      <PageHeader title="Spaced revision" subtitle="Topics return after 1 → 3 → 7 → 14 → 30 → 60 days, sooner if you forget them." />
      <Card>
        <div className="grid grid-cols-3 gap-2">
          <Stat label="Due now" value={queue.filter((q) => q.due).length} />
          <Stat label="Next 7 days" value={queue.filter((q) => !q.due).length} />
          <Stat label="On time (30d)" value={health.due ? `${Math.round((health.onTime / health.due) * 100)}%` : "–"} sub={`${health.onTime}/${health.due}`} />
        </div>
      </Card>
      <RevisionList items={queue} />
    </div>
  );
}
