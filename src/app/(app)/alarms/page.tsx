import { requireStudent } from "@/server/auth/guards";
import { listAlarms } from "@/server/services/alarm.service";
import { AlarmManager } from "@/components/AlarmManager";

export const metadata = { title: "Alarms" };

export default async function AlarmsPage() {
  const user = await requireStudent();
  const data = await listAlarms(user.id);
  return <AlarmManager initial={JSON.parse(JSON.stringify(data.alarms))} vapidKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || null} />;
}
