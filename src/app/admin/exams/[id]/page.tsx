import { examTree, listQuestions } from "@/server/services/admin.service";
import { AdminExamEditor } from "@/components/AdminExamEditor";

export const metadata = { title: "Edit exam" };

export default async function AdminExamPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ topic?: string }> }) {
  const { id } = await params;
  const { topic } = await searchParams;
  const exam = await examTree(id);
  const questions = topic ? await listQuestions(topic) : [];
  return <AdminExamEditor exam={JSON.parse(JSON.stringify(exam))} topicId={topic ?? null} questions={JSON.parse(JSON.stringify(questions))} />;
}
