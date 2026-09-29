import Link from "next/link";
import { requireStudent } from "@/server/auth/guards";
import { getT } from "@/i18n/server";
import type { Key } from "@/i18n/dict";
import { PageHeader } from "@/components/ui";

export const metadata = { title: "All tools" };

const TOOLS: [string, string, Key, Key][] = [
  ["/study/session/free?quick=1", "⏱", "quick.timer", "more.timer"],
  ["/tests", "📝", "paper.title", "more.paper"],
  ["/groups", "👥", "groups.title", "more.groups"],
  ["/challenge", "🏆", "challenge.title", "more.challenge"],
  ["/cards", "🃏", "cards.title", "more.cards"],
  ["/garden", "🌳", "garden.title", "more.garden"],
  ["/shayari", "✨", "quick.shayari", "more.shayari"],
  ["/attendance", "📅", "quick.attendance", "more.attendance"],
  ["/calendar", "🗓️", "cal.title", "more.calendar"],
  ["/alarms", "⏰", "quick.alarm", "more.alarms"],
  ["/syllabus", "📚", "quick.syllabus", "more.syllabus"],
  ["/coach", "🤖", "nav.coach", "more.coach"],
  ["/profile#parents", "👨‍👩‍👧", "parent.title", "more.parents"],
  ["/profile#invite", "🎁", "invite.title", "more.invite"],
  ["/teacher", "👩‍🏫", "teacher.title", "more.teacher"],
  ["/help", "❓", "nav.howto", "more.help"],
];

export default async function MorePage() {
  await requireStudent();
  const { t } = await getT();
  return (
    <div className="space-y-4">
      <PageHeader title={t("more.title")} />
      <ul className="stagger grid gap-2 sm:grid-cols-2">
        {TOOLS.map(([href, icon, title, sub]) => (
          <li key={href}>
            <Link href={href} className="lift flex items-center gap-3 rounded-2xl border border-border bg-surface p-3">
              <span className="text-2xl" aria-hidden>{icon}</span>
              <span><span className="block font-semibold">{t(title)}</span><span className="block text-xs text-muted">{t(sub)}</span></span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
