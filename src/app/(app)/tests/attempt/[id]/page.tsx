import { redirect } from "next/navigation";
import { requireStudent } from "@/server/auth/guards";
import { getAttemptForPlayer } from "@/server/services/mock.service";
import { TestPlayer } from "@/components/TestPlayer";

export const metadata = { title: "Test" };

export default async function AttemptPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireStudent();
  const { id } = await params;
  const attempt = await getAttemptForPlayer(user.id, id);
  if (attempt.status === "SUBMITTED") redirect(`/tests/result/${id}`);
  return <TestPlayer attempt={JSON.parse(JSON.stringify(attempt))} />;
}
