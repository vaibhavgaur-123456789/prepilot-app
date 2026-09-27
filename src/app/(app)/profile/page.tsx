import Link from "next/link";
import { requireStudent } from "@/server/auth/guards";
import { prisma } from "@/server/db";
import { listGoals } from "@/server/services/account.service";
import { xpSummary } from "@/server/services/gamification.service";
import { getPrefs } from "@/server/services/notifications.service";
import { getStudentContext } from "@/server/services/context";
import { parseJson } from "@/lib/json";
import { Badge, Card, CardTitle, PageHeader, Progress, Stat } from "@/components/ui";
import { SettingsForm } from "@/components/SettingsForm";

export const metadata = { title: "Profile" };

const levelName: Record<string, string> = { EXAM: "Exam goal", MONTHLY: "This month", WEEKLY: "This week", DAILY: "Today" };

export default async function ProfilePage() {
  const user = await requireStudent();
  const ctx = await getStudentContext(user.id);
  const [goals, xp, prefs, catalog, mine] = await Promise.all([
    listGoals(user.id),
    xpSummary(user.id, ctx.today),
    getPrefs(user.id),
    prisma.achievement.findMany({ orderBy: { xpReward: "asc" } }),
    prisma.userAchievement.findMany({ where: { userId: user.id } }),
  ]);
  const unlocked = new Map(mine.map((m) => [m.achievementId, m.unlockedAt]));

  return (
    <div className="space-y-4">
      <PageHeader title={user.name} subtitle={`${user.email} · ${ctx.exam.name} on ${ctx.profile.examDate}`} />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Level" value={xp.level} sub={`${xp.xp} XP`} />
        <Stat label="Streak" value={`${xp.streak} days`} sub={`best ${xp.bestStreak}`} />
        <Stat label="Badges" value={`${mine.length}/${catalog.length}`} />
        <Stat label="Plan" value={user.plan === "PREMIUM" ? "Premium" : "Free"} />
      </div>

      <Card>
        <CardTitle action={<Link href="/onboarding?change=1" className="text-sm font-semibold text-primary">Change exam →</Link>} eyebrow="Preparing for">{ctx.exam.name}</CardTitle>
        <p className="text-sm text-muted">Exam date {ctx.profile.examDate}. Switched to a different exam? Change it here and your plan is rebuilt for the new syllabus.</p>
      </Card>

      <Card>
        <CardTitle>Goals (exam → month → week → today)</CardTitle>
        <div className="space-y-3">
          {goals.map((g) => (
            <div key={g.id} className={g.level === "EXAM" ? "" : g.level === "MONTHLY" ? "pl-3" : g.level === "WEEKLY" ? "pl-6" : "pl-9"}>
              <Progress value={g.pct} label={`${levelName[g.level] ?? g.level}: ${g.title} (${Math.round(g.progress)}/${Math.round(g.target)})`} tone={g.pct >= 100 ? "success" : "primary"} />
            </div>
          ))}
          {goals.length === 0 && <p className="text-sm text-muted">Goals are created from your exam date during onboarding.</p>}
        </div>
      </Card>

      <Card>
        <CardTitle>Badges</CardTitle>
        <ul className="grid gap-2 sm:grid-cols-2">
          {catalog.map((a) => {
            const at = unlocked.get(a.id);
            return (
              <li key={a.id} className={`flex items-center gap-3 rounded-xl p-2.5 ${at ? "bg-success-soft" : "bg-surface-2 opacity-70"}`}>
                <span className="text-2xl" aria-hidden>{a.icon}</span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{a.name} {at ? <Badge tone="success">Unlocked</Badge> : <span className="sr-only">(locked)</span>}</p>
                  <p className="text-xs text-muted">{a.description}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </Card>

      <SettingsForm
        profile={{
          name: user.name, timezone: user.timezone, theme: user.theme, examDate: ctx.profile.examDate, dailyMinutes: ctx.profile.dailyMinutes,
          preferredBlockMin: ctx.profile.preferredBlockMin, preferredSlots: parseJson<string[]>(ctx.profile.preferredSlots, []), benchmarkOptIn: user.benchmarkOptIn, hasPassword: !!user.passwordHash,
        }}
        prefs={JSON.parse(JSON.stringify(prefs))}
        vapidKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || null}
      />

      <Card>
        <CardTitle>More</CardTitle>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link className="rounded-xl bg-surface-2 px-3 py-2 font-medium" href="/review/weekly">Weekly reports</Link>
          <Link className="rounded-xl bg-surface-2 px-3 py-2 font-medium" href="/review/night">Night review</Link>
          <Link className="rounded-xl bg-surface-2 px-3 py-2 font-medium" href="/study/mistakes">Mistake book</Link>
          <Link className="rounded-xl bg-surface-2 px-3 py-2 font-medium" href="/coach">AI coach</Link>
          {user.role === "ADMIN" && <Link className="rounded-xl bg-surface-2 px-3 py-2 font-medium" href="/admin">Admin</Link>}
        </div>
      </Card>
    </div>
  );
}
