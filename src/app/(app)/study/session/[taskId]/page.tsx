import { notFound } from "next/navigation";
import { requireStudent } from "@/server/auth/guards";
import { prisma } from "@/server/db";
import { FocusSession } from "@/components/FocusSession";

export const metadata = { title: "Focus session" };

export default async function SessionPage({ params, searchParams }: { params: Promise<{ taskId: string }>; searchParams: Promise<{ quick?: string }> }) {
  const user = await requireStudent();
  const { taskId } = await params;
  if (taskId === "free") {
    // ?quick=1 = one-tap "punch in": the stopwatch starts immediately.
    return <FocusSession task={null} autoStart={(await searchParams).quick === "1"} />;
  }
  const task = await prisma.task.findUnique({ where: { id: taskId }, include: { topic: { select: { name: true } } } });
  if (!task || task.userId !== user.id) notFound();
  return (
    <FocusSession
      task={{ id: task.id, title: task.title, type: task.type, topicId: task.topicId, plannedMinutes: Math.max(5, task.plannedMinutes - task.actualMinutes), questionTarget: task.questionTarget, objective: task.objective, topicName: task.topic?.name ?? null }}
    />
  );
}
