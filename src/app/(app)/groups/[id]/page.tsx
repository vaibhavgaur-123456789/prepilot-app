import { notFound } from "next/navigation";
import { requireStudent } from "@/server/auth/guards";
import { groupBoard } from "@/server/services/group.service";
import { GroupBoardView } from "@/components/Social";

export const metadata = { title: "Study group" };

export default async function GroupPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireStudent();
  const { id } = await params;
  const data = await groupBoard(user.id, id).catch(() => null);
  if (!data) notFound();
  return <GroupBoardView data={data} />;
}
