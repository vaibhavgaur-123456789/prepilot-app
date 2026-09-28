import { requireStudent } from "@/server/auth/guards";
import { getStudentContext } from "@/server/services/context";
import { listPapers } from "@/server/services/paper.service";
import { PaperTimer } from "@/components/PaperTimer";

export const metadata = { title: "Paper timer" };

export default async function TestsPage() {
  const user = await requireStudent();
  const [ctx, data] = await Promise.all([getStudentContext(user.id), listPapers(user.id)]);
  return (
    <PaperTimer
      examName={ctx.exam.shortName}
      examMinutes={ctx.exam.ownerId ? 0 : ctx.exam.durationMinutes}
      papers={data.papers}
      records={data.records}
    />
  );
}
