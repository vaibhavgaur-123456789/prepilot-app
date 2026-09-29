import Link from "next/link";
import { parentReport } from "@/server/services/parent.service";
import { getT } from "@/i18n/server";
import { Logo } from "@/components/Logo";
import { Card, Stat } from "@/components/ui";

export const metadata = { title: "Weekly study report", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const hm = (min: number) => (min >= 60 ? `${Math.floor(min / 60)}h ${min % 60}m` : `${min}m`);

/** Read-only report a student shares with parents. No login. */
export default async function ParentReportPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [r, { t, lang }] = await Promise.all([parentReport(token), getT()]);
  if (!r) {
    return (
      <main className="mx-auto max-w-md px-4 py-16 text-center">
        <Logo size={40} />
        <p className="mt-6 text-lg font-semibold">{t("parent.invalid")}</p>
      </main>
    );
  }
  const max = Math.max(60, ...r.days.map((d) => d.minutes));
  const diff = r.weekMinutes - r.lastWeekMinutes;
  const day = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", { weekday: "short" });
  return (
    <main className="mx-auto w-full max-w-lg space-y-4 px-4 py-6">
      <Logo size={32} />
      <div>
        <p className="text-sm text-muted">{t("parent.reportFor")}</p>
        <h1 className="text-2xl font-bold">{r.name}</h1>
        {r.exam && <p className="text-sm text-muted">{r.exam}</p>}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Stat label={t("parent.thisWeek")} value={hm(r.weekMinutes)} sub={r.lastWeekMinutes || r.weekMinutes ? `${diff >= 0 ? "↑" : "↓"} ${hm(Math.abs(diff))} ${t("parent.vsLast")}` : undefined} />
        <Stat label={t("parent.daysStudied")} value={`${r.daysStudied}/7`} sub={r.leaveDays ? t("parent.leaveN", { n: r.leaveDays }) : undefined} />
        <Stat label={t("parent.streak")} value={`🔥 ${r.streak}`} />
        <Stat label={t("parent.papers")} value={r.papers} />
      </div>
      <Card>
        <p className="mb-3 text-sm font-semibold">{t("parent.daily")}</p>
        <div className="flex h-36 items-end justify-between gap-2">
          {r.days.map((d) => (
            <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-[10px] text-muted">{d.leave ? "☾" : d.minutes ? hm(d.minutes) : "–"}</span>
              <span className={`w-full rounded-t-lg ${d.leave ? "bg-warm-soft" : d.minutes ? "bg-grad" : "bg-surface-2"}`} style={{ height: `${d.leave ? 20 : Math.max(6, (d.minutes / max) * 100)}%` }} />
              <span className="text-[11px] text-muted">{day(d.date)}</span>
            </div>
          ))}
        </div>
      </Card>
      <p className="text-xs text-muted">{t("parent.note")}</p>
      <p className="text-center text-xs"><Link href="/welcome" className="font-semibold text-primary">RozPadh</Link></p>
    </main>
  );
}
