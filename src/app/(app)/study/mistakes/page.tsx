import { requireStudent } from "@/server/auth/guards";
import { listMistakes, mistakeSummary } from "@/server/services/mistakes.service";
import { MistakeBook } from "@/components/MistakeBook";
import { Card, CardTitle, PageHeader } from "@/components/ui";

export const metadata = { title: "Mistake book" };

export default async function MistakesPage() {
  const user = await requireStudent();
  const [items, summary] = await Promise.all([listMistakes(user.id), mistakeSummary(user.id)]);
  return (
    <div className="space-y-4">
      <PageHeader title="Mistake book" subtitle="Every wrong answer from tests lands here with a likely cause. Correct the cause if it's wrong." />
      <Card>
        <CardTitle>Patterns</CardTitle>
        {summary.top ? (
          <>
            <p className="font-medium">{summary.top.message}</p>
            <p className="mt-1 text-sm text-muted"><b>Targeted fix:</b> {summary.top.fix}</p>
          </>
        ) : <p className="text-sm text-muted">No open mistakes. Take a test to find gaps.</p>}
        <div className="mt-3 flex flex-wrap gap-2">
          {summary.byCategory.filter((c) => c.count > 0).map((c) => <span key={c.category} className="rounded-full bg-surface-2 px-3 py-1 text-xs"><b>{c.count}</b> {c.label}</span>)}
        </div>
        {summary.topTopics.length > 0 && <p className="mt-2 text-xs text-muted">Most mistakes: {summary.topTopics.map((t) => `${t.name} (${t.count})`).join(", ")}</p>}
      </Card>
      <MistakeBook items={JSON.parse(JSON.stringify(items))} />
    </div>
  );
}
