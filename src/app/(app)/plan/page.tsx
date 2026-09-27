import { requireStudent } from "@/server/auth/guards";
import { ensureDayPlan, weekOutline } from "@/server/services/planner.service";
import { prisma } from "@/server/db";
import { leafTopics } from "@/server/services/learning.service";
import { PlanBoard } from "@/components/PlanBoard";

export const metadata = { title: "Plan" };

export default async function PlanPage() {
  const user = await requireStudent();
  const [plan, week, profile] = await Promise.all([ensureDayPlan(user.id), weekOutline(user.id), prisma.studentProfile.findUniqueOrThrow({ where: { userId: user.id } })]);
  const topics = (await leafTopics(profile.examId)).map((t) => ({ id: t.id, name: `${t.subject.name}: ${t.name}` }));
  return (
    <PlanBoard
      initial={JSON.parse(JSON.stringify(plan))}
      week={week}
      topics={topics}
      capacity={profile.dailyMinutes}
      recovery={{ on: profile.recoveryMode, manual: profile.recoveryManual }}
    />
  );
}
