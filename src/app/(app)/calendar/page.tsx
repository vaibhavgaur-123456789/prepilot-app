import { requireStudent } from "@/server/auth/guards";
import { upcomingEvents } from "@/server/services/calendar.service";
import { getT } from "@/i18n/server";
import { diffDays, dayKey } from "@/lib/engine/dates";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";

export const metadata = { title: "Exam calendar" };

const ICON: Record<string, string> = { FORM_START: "📝", LAST_DATE: "⏰", ADMIT_CARD: "🎫", EXAM: "✍️", RESULT: "🏁", OTHER: "📌" };

export default async function CalendarPage() {
  const user = await requireStudent();
  const [events, { t, lang }] = await Promise.all([upcomingEvents(user.id), getT()]);
  const today = dayKey(new Date(), user.timezone);
  const sorted = [...events.filter((e) => e.mine), ...events.filter((e) => !e.mine)];
  const fmt = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  return (
    <div className="space-y-4">
      <PageHeader title={`🗓️ ${t("cal.title")}`} subtitle={t("cal.subtitle")} />
      {sorted.length === 0 ? (
        <EmptyState title={t("cal.empty")}>{t("cal.emptyText")}</EmptyState>
      ) : (
        <ul className="stagger space-y-2">
          {sorted.map((e) => {
            const n = diffDays(today, e.date);
            return (
              <li key={e.id}>
                <Card className="flex items-start gap-3">
                  <span className="text-2xl" aria-hidden>{ICON[e.kind] ?? "📌"}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{e.title} {e.mine && <Badge tone="primary">{t("cal.yourExam")}</Badge>}</p>
                    <p className="text-sm text-muted">{fmt(e.date)} · {t(`cal.kind.${e.kind}` as const)}{e.examName ? ` · ${e.examName}` : ""}</p>
                    {e.link && <a href={e.link} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-sm font-semibold text-primary underline">{t("cal.official")} ↗</a>}
                  </div>
                  <Badge tone={n <= 3 ? "warning" : "neutral"}>{n === 0 ? t("cal.today") : t("cal.inDays", { n })}</Badge>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
      <p className="text-xs text-muted">{t("cal.note")}</p>
    </div>
  );
}
