import { AppShell } from "@/components/AppShell";
import { requireStudent } from "@/server/auth/guards";
import { prisma } from "@/server/db";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStudent();
  const unread = await prisma.notification.count({ where: { userId: user.id, readAt: null, scheduledFor: { lte: new Date() } } });
  return (
    <AppShell unread={unread} isAdmin={user.role === "ADMIN"}>
      {children}
    </AppShell>
  );
}
