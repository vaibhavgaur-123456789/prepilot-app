import Link from "next/link";
import { requireStudent } from "@/server/auth/guards";
import { getHome } from "@/server/services/dashboard.service";
import { formatMinutes } from "@/lib/engine/dates";
import { getT } from "@/i18n/server";
import { Alert, Badge, Card, CardTitle, Progress, Provenance, Stat } from "@/components/ui";
import { FlameIcon } from "@/components/icons";
import { InstallButton } from "@/components/InstallButton";

export const metadata = { title: "Home" };

const typeLabel: Record<string, { en: string; hi: string }> = {
  STUDY: { en: "Learn", hi: "सीखें" }, PRACTICE: { en: "Practice", hi: "अभ्यास" }, REVISION: { en: "Revision", hi: "रिवीज़न" }, MOCK: { en: "Mock test", hi: "मॉक टेस्ट" },
  MOCK_ANALYSIS: { en: "Mock analysis", hi: "मॉक विश्लेषण" }, MISTAKE_REVIEW: { en: "Mistake review", hi: "गलती सुधार" }, CUSTOM: { en: "Task", hi: "काम" },
};

export default async function HomePage() {
  const user = await requireStudent();
  const [h, { t, lang }] = await Promise.all([getHome(user.id), getT()]);
  const pct = h.progress.plannedMinutes > 0 ? Math.min(100, Math.round((h.progress.actualMinutes / h.progress.plannedMinutes) * 100)) : 0;
  const nextHref = h.next ? (h.next.type === "MOCK" && h.next.mockId ? `/tests/start/${h.next.mockId}` : h.next.type === "MOCK_ANALYSIS" ? "/tests" : `/study/session/${h.next.id}`) : "/study";
  const greeting = h.briefing.greeting === "Good morning" ? t("home.greeting.morning") : h.briefing.greeting === "Good afternoon" ? t("home.greeting.afternoon") : t("home.greeting.evening");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-sm text-muted">{greeting}, {h.user.firstName} 👋</p>
          <h1 className="text-2xl font-bold tracking-tight">{t("home.preparation", { exam: h.exam.shortName })}</h1>
        </div>
        <div className="animate-pop rounded-2xl bg-warm-soft px-3 py-1.5 text-right">
          <p className="tabular text-2xl font-extrabold text-warm">{h.exam.daysLeft}</p>
          <p className="text-[11px] font-semibold text-warm">{t("common.daysLeft")}</p>
        </div>
      </div>

      <InstallButton variant="banner" />

      {/* One-tap actions: start the study timer ("punch in"), attendance, alarms, own syllabus */}
      <div className="stagger grid grid-cols-4 gap-2">
        {[
          { href: "/study/session/free?quick=1", icon: "⏱", label: t("quick.timer"), primary: true },
          { href: "/attendance", icon: "📅", label: t("quick.attendance") },
          { href: "/alarms", icon: "⏰", label: t("quick.alarm") },
          { href: "/syllabus", icon: "📚", label: t("quick.syllabus") },
        ].map((q) => (
          <Link key={q.href} href={q.href} className={`press lift flex min-h-20 flex-col items-center justify-center gap-1 rounded-2xl border p-2 text-center text-xs font-semibold ${q.primary ? "bg-grad animate-pulse-ring border-transparent" : "border-border bg-surface"}`}>
            <span className="text-2xl" aria-hidden>{q.icon}</span>
            {q.label}
          </Link>
        ))}
      </div>

      {h.recovery && (
        <Alert tone="warning" title={t("home.recoveryTitle")}>
          {t("home.recoveryText")} <Link href="/plan" className="font-semibold underline">{t("home.seePlan")}</Link>
        </Alert>
      )}
      {h.nightReviewDue && (
        <Alert tone="primary" title={t("home.eveningTitle")}>
          {t("home.eveningText")} <Link href="/review/night" className="font-semibold underline">{t("home.reviewToday")}</Link>
        </Alert>
      )}

      {/* NEXT ACTION: the answer to "what should I do now?" */}
      <section className="animate-in bg-grad shadow-brand relative overflow-hidden rounded-3xl p-5">
        <div className="animate-float pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" aria-hidden />
        <div className="pointer-events-none absolute -bottom-12 right-16 h-28 w-28 rounded-full bg-white/10" aria-hidden />
        <p className="text-xs font-semibold uppercase tracking-wider text-white/80">{t("home.nextAction")}</p>
        <h2 className="relative mt-1 text-xl font-bold leading-snug">{h.next ? h.next.title : t("home.planComplete")}</h2>
        {h.next ? (
          <>
            <div className="relative mt-2 flex flex-wrap items-center gap-2 text-sm text-white/90">
              <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold">{typeLabel[h.next.type]?.[lang] ?? h.next.type}</span>
              <span>⏱ {h.next.plannedMinutes} {t("common.min")}</span>
              {h.next.questionTarget > 0 && <span>· {h.next.questionTarget} {t("common.questions")}</span>}
              {h.next.startTime && <span>· {h.next.startTime}</span>}
            </div>
            {h.next.objective && <p className="relative mt-2 text-sm text-white/90">{h.next.objective}</p>}
            {h.next.reasons.length > 0 && (
              <details className="relative mt-2 text-sm">
                <summary className="cursor-pointer text-white/80">{t("home.why")}</summary>
                <ul className="mt-1 list-inside list-disc text-white/85">{h.next.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
              </details>
            )}
            <Link href={nextHref} className="press relative mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-white px-5 text-sm font-bold text-[#3b55e6] shadow-lg sm:w-auto">{t("home.startStudy")}</Link>
          </>
        ) : h.progress.tasksTotal === 0 && h.syllabusEmpty ? (
          <>
            <p className="relative mt-2 text-sm text-white/90">{t("home.addChapters")}</p>
            <Link href="/syllabus" className="press relative mt-3 inline-flex min-h-11 items-center rounded-xl bg-white px-4 text-sm font-bold text-[#3b55e6]">📚 {t("quick.syllabus")}</Link>
          </>
        ) : (
          <p className="relative mt-2 text-sm text-white/90">{t("home.doneText")}</p>
        )}
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardTitle action={<Link href="/plan" className="text-sm font-semibold text-primary">{t("nav.plan")} →</Link>}>{t("home.progress")}</CardTitle>
          <Progress value={pct} label={`${formatMinutes(h.progress.actualMinutes)} / ${formatMinutes(h.progress.plannedMinutes)}`} tone={pct >= 80 ? "success" : "primary"} />
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Stat label={t("home.tasksDone")} value={`${h.progress.tasksDone}/${h.progress.tasksTotal}`} />
            <Stat label={t("home.dailyScore")} value={h.progress.dailyScore ?? "–"} sub={h.progress.dailyScore === null ? t("home.afterFirst") : "/100"} />
          </div>
          {h.briefing.yesterday && <p className="mt-3 text-sm text-muted">{t("home.yesterday")}: {h.briefing.yesterday}</p>}
          {h.briefing.improve && <p className="mt-1 text-sm"><b>{t("home.improve")}</b> {h.briefing.improve}</p>}
        </Card>

        <Card>
          <CardTitle action={<Link href="/analytics#readiness" className="text-sm font-semibold text-primary">{t("home.howCalculated")}</Link>} eyebrow={<span className="inline-flex items-center gap-2">{t("home.readiness")} <Provenance kind="estimate" /></span>}>
            <span className="tabular text-3xl font-bold">{h.readiness.score}</span>
            <span className="text-muted"> / 100</span>
            {h.readiness.delta !== null && <span className={`ml-2 text-sm font-semibold ${h.readiness.delta >= 0 ? "text-success" : "text-danger"}`}>{t("home.thisWeek", { n: `${h.readiness.delta >= 0 ? "↑" : "↓"} ${Math.abs(h.readiness.delta)}` })}</span>}
          </CardTitle>
          <div className="space-y-2">
            {Object.entries(h.readiness.components).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between text-sm">
                <span className="text-muted">{h.readiness.labels[k as keyof typeof h.readiness.labels] ?? k}</span>
                <span className="tabular font-medium">{v === null ? <span className="text-muted">{t("home.notMeasured")}</span> : v}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted">{t("home.confidence")}: <b>{h.readiness.confidence.toLowerCase()}</b>. {t("home.notProbability")}</p>
        </Card>
      </div>

      <Card>
        <CardTitle>{t("home.attention")}</CardTitle>
        {h.attention.length === 0 ? (
          <p className="text-sm text-muted">{t("home.noAttention")}</p>
        ) : (
          <ul className="divide-y divide-border">
            {h.attention.map((a) => (
              <li key={a.title + a.kind} className="flex items-center justify-between gap-3 py-2.5">
                <div>
                  <p className="text-sm font-medium">{a.title}</p>
                  <p className="text-xs text-muted">{a.detail}</p>
                </div>
                <Badge tone={a.priority === "HIGH" ? "danger" : "warning"}>{a.kind === "WEAK" ? (a.priority === "HIGH" ? t("home.highPriority") : t("home.mediumPriority")) : t("home.revision")}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardTitle action={<Link href="/review/weekly" className="text-sm font-semibold text-primary">{t("home.weeklyReport")}</Link>}>{t("home.week")}</CardTitle>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <Stat label={t("home.study")} value={formatMinutes(h.week.minutes)} />
            <Stat label={t("common.questions")} value={h.week.questions.toLocaleString("en-IN")} />
            <Stat label={t("home.accuracy")} value={h.week.accuracy === null ? "–" : `${Math.round(h.week.accuracy * 100)}%`} />
            <Stat label={t("home.mocks")} value={h.week.mocks} />
            <Stat label={t("home.consistency")} value={`${h.week.consistencyPct}%`} />
            <Stat label={t("home.level")} value={h.xp.level} sub={`${h.xp.xp} XP`} />
          </div>
          <p className="mt-3 text-sm text-muted">{h.pace.summary}</p>
        </Card>
        <Card>
          <CardTitle>{t("home.momentum")}</CardTitle>
          <div className="flex items-center gap-3">
            <span className="bg-grad-warm grid h-12 w-12 place-items-center rounded-2xl shadow-lg"><FlameIcon className={h.xp.streak > 0 ? "animate-flame" : ""} /></span>
            <div>
              <p className="text-lg font-semibold">{t("home.streak", { n: h.xp.streak })}</p>
              <p className="text-xs text-muted">{t("home.bestStreak", { n: h.xp.bestStreak })}</p>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            <Progress value={h.nextMilestone.progress} max={h.nextMilestone.at} label={`${t("home.nextMilestone")}: ${h.nextMilestone.label}`} showValue={false} />
            <Progress value={h.challenge.progress} max={h.challenge.target} label={`${t("home.challenge")}: ${h.challenge.title} (${h.challenge.progress}/${h.challenge.target})${h.challenge.done ? " ✓" : ""}`} tone="success" showValue={false} />
            <Progress value={h.xp.progress * 100} label={`${t("home.level")} ${h.xp.level} → ${h.xp.level + 1}`} tone="neutral" />
          </div>
        </Card>
      </div>
    </div>
  );
}
