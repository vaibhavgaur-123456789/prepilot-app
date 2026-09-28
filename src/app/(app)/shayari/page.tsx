import { requireStudent } from "@/server/auth/guards";
import { allShayari } from "@/server/services/shayari.service";
import { getT } from "@/i18n/server";
import { dayKey } from "@/lib/engine/dates";
import { PageHeader } from "@/components/ui";
import { ShayariBrowser } from "@/components/Shayari";

export const metadata = { title: "Shayari" };

export default async function ShayariPage() {
  const user = await requireStudent();
  const [items, { t }] = await Promise.all([allShayari(), getT()]);
  // Same "line of the day" for the whole day, different each day.
  const todayIndex = Math.floor(Date.parse(`${dayKey(new Date(), user.timezone)}T00:00:00Z`) / 86_400_000);
  return (
    <div className="space-y-4">
      <PageHeader title={t("shayari.title")} subtitle={t("shayari.subtitle")} />
      <ShayariBrowser items={items} todayIndex={todayIndex} />
    </div>
  );
}
