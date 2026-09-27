import Link from "next/link";
import { listExamsAdmin, productMetrics, recentAudit } from "@/server/services/admin.service";
import { Badge, Card, CardTitle, PageHeader, Stat } from "@/components/ui";

export const metadata = { title: "Admin" };

const v = (x: number | null, suffix = "") => (x === null ? "–" : `${x}${suffix}`);

export default async function AdminPage() {
  const [m, exams, audit] = await Promise.all([productMetrics(), listExamsAdmin(), recentAudit()]);
  return (
    <div className="space-y-4">
      <PageHeader title="Admin" subtitle="Content and product health. Individual student data is never shown here." />
      <Card>
        <CardTitle>North star: is measured preparation improving?</CardTitle>
        <p className="tabular text-3xl font-bold">{v(m.northStar.improvingPct, "%")}</p>
        <p className="text-sm text-muted">of {m.northStar.measured} students with ≥2 readiness snapshots in 28 days show a rising readiness trend.</p>
      </Card>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Students" value={m.students} />
        <Stat label="Weekly active" value={m.wau} />
        <Stat label="D1 / D7 / D30 retention" value={`${v(m.retention.d1, "%")} / ${v(m.retention.d7, "%")} / ${v(m.retention.d30, "%")}`} />
        <Stat label="Plan completion (7d)" value={v(m.planCompletionPct, "%")} />
        <Stat label="Sessions / active day" value={v(m.sessionsPerActiveDay)} />
        <Stat label="Study h / week / student" value={v(m.studyHoursPerWeekPerStudent)} />
        <Stat label="Questions (7d)" value={m.questionsPerWeek} />
        <Stat label="Mocks (7d)" value={m.mocksPerWeek} />
        <Stat label="Revision completion" value={v(m.revisionCompletionPct, "%")} />
        <Stat label="Coach messages (7d)" value={m.coachMessagesPerWeek} />
        <Stat label="Recovery entered / exited" value={`${m.recovery.entered} / ${m.recovery.exited}`} />
      </div>
      <Card>
        <CardTitle>Exams</CardTitle>
        <ul className="divide-y divide-border">
          {exams.map((e) => (
            <li key={e.id} className="flex items-center justify-between py-2.5">
              <div>
                <Link href={`/admin/exams/${e.id}`} className="font-semibold text-primary">{e.name}</Link>
                <p className="text-xs text-muted">{e._count.subjects} subjects · {e._count.mocks} mocks · {e._count.profiles} students</p>
              </div>
              {e.isActive ? <Badge tone="success">Active</Badge> : <Badge>Inactive</Badge>}
            </li>
          ))}
        </ul>
      </Card>
      <Card>
        <CardTitle>Recent content changes</CardTitle>
        {audit.length === 0 ? <p className="text-sm text-muted">No changes yet.</p> : <ul className="space-y-1 text-xs text-muted">{audit.map((a) => <li key={a.id}>{a.createdAt.toISOString().slice(0, 16).replace("T", " ")} · {a.action} {a.entity} {a.entityId.slice(0, 8)}</li>)}</ul>}
      </Card>
    </div>
  );
}
