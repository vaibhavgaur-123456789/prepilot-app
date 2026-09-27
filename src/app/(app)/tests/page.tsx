import { requireStudent } from "@/server/auth/guards";
import { listMocks, mockHistory } from "@/server/services/mock.service";
import { getStudentContext } from "@/server/services/context";
import { TestsHub } from "@/components/TestsHub";
import { prisma } from "@/server/db";

export const metadata = { title: "Tests" };

export default async function TestsPage() {
  const user = await requireStudent();
  const ctx = await getStudentContext(user.id);
  const [mocks, history, subjects, pendingAnalysis] = await Promise.all([
    listMocks(user.id),
    mockHistory(user.id),
    prisma.subject.findMany({ where: { examId: ctx.exam.id }, orderBy: { order: "asc" }, include: { topics: { where: { children: { none: {} } }, orderBy: { order: "asc" }, select: { id: true, name: true } } } }),
    prisma.mockAttempt.findFirst({ where: { userId: user.id, status: "SUBMITTED", analyzedAt: null }, include: { mock: true }, orderBy: { submittedAt: "desc" } }),
  ]);
  return (
    <TestsHub
      exam={{ name: ctx.exam.name, negativeMarking: ctx.exam.negativeMarking, marksPerQuestion: ctx.exam.marksPerQuestion }}
      mocks={JSON.parse(JSON.stringify(mocks))}
      history={JSON.parse(JSON.stringify(history))}
      subjects={subjects.map((s) => ({ id: s.id, name: s.name, topics: s.topics }))}
      pendingAnalysis={pendingAnalysis ? { id: pendingAnalysis.id, title: pendingAnalysis.mock.title } : null}
      personal={!!ctx.exam.ownerId}
    />
  );
}
