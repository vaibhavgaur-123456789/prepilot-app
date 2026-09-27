import { redirect } from "next/navigation";
import { requireStudent } from "@/server/auth/guards";
import { startAttempt } from "@/server/services/mock.service";

/** Start (or resume) a mock directly from a plan task, then open the player. */
export default async function StartMockPage({ params }: { params: Promise<{ mockId: string }> }) {
  const user = await requireStudent();
  const { mockId } = await params;
  const attempt = await startAttempt(user.id, mockId);
  redirect(`/tests/attempt/${attempt.id}`);
}
