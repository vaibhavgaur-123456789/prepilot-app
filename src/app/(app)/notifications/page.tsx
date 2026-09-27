import Link from "next/link";
import { requireStudent } from "@/server/auth/guards";
import { generateNotifications, listNotifications, markAllRead } from "@/server/services/notifications.service";
import { Card, EmptyState, PageHeader } from "@/components/ui";

export const metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const user = await requireStudent();
  await generateNotifications(user.id).catch(() => undefined);
  const items = await listNotifications(user.id);
  await markAllRead(user.id);
  return (
    <div className="space-y-4">
      <PageHeader title="Notifications" subtitle={<>Max a few per day, never in quiet hours. <Link href="/profile" className="font-semibold text-primary">Settings</Link></>} />
      {items.length === 0 ? <EmptyState title="You're all caught up" /> : (
        <Card>
          <ul className="divide-y divide-border">
            {items.map((n) => (
              <li key={n.id} className="py-3">
                <Link href={n.href ?? "/"} className="block">
                  <p className="text-sm font-semibold">{!n.readAt && <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-primary" aria-label="unread" />}{n.title}</p>
                  <p className="text-sm text-muted">{n.body}</p>
                  <p className="mt-0.5 text-xs text-muted">{n.scheduledFor.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</p>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
