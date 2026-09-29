import Link from "next/link";
import { requireStudent } from "@/server/auth/guards";
import { monthGarden } from "@/server/services/garden.service";
import { getT } from "@/i18n/server";
import { Card, EmptyState, PageHeader, Stat } from "@/components/ui";

export const metadata = { title: "My garden" };

const EMOJI = { tree: "🌳", sapling: "🌱", wilted: "🥀" } as const;

function shift(month: string, by: number) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + by, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export default async function GardenPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const user = await requireStudent();
  const [g, { t, lang }] = await Promise.all([monthGarden(user.id, (await searchParams).month), getT()]);
  const label = new Date(`${g.month}-15T12:00:00`).toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", { month: "long", year: "numeric" });
  return (
    <div className="space-y-4">
      <PageHeader title={`🌳 ${t("garden.title")}`} subtitle={t("garden.subtitle")} />
      <div className="flex items-center justify-between">
        <Link href={`/garden?month=${shift(g.month, -1)}`} className="rounded-xl border border-border px-3 py-2 text-sm font-semibold">←</Link>
        <p className="font-semibold">{label}</p>
        <Link href={`/garden?month=${shift(g.month, 1)}`} className="rounded-xl border border-border px-3 py-2 text-sm font-semibold">→</Link>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Stat label={`🌳 ${t("garden.trees")}`} value={g.trees} sub={t("garden.treesSub")} />
        <Stat label={`🌱 ${t("garden.saplings")}`} value={g.saplings} sub={t("garden.saplingsSub")} />
        <Stat label={`🥀 ${t("garden.wilted")}`} value={g.wilted} sub={t("garden.wiltedSub")} />
      </div>
      <Card>
        {g.plants.length === 0 ? (
          <EmptyState title={t("garden.empty")}>{t("garden.emptyText")}</EmptyState>
        ) : (
          <div className="flex flex-wrap gap-1 rounded-2xl bg-[color-mix(in_srgb,var(--success)_10%,var(--surface))] p-3 text-3xl leading-none" role="img" aria-label={`${g.trees} trees, ${g.saplings} saplings, ${g.wilted} wilted`}>
            {g.plants.map((p, i) => <span key={i} title={`${p.date} · ${p.minutes} min`} className="animate-pop">{EMOJI[p.plant]}</span>)}
          </div>
        )}
        <Link href="/study/session/free?quick=1" className="press mt-3 inline-flex min-h-11 items-center rounded-xl bg-grad px-4 text-sm font-bold text-white">⏱ {t("garden.plant")}</Link>
      </Card>
    </div>
  );
}
