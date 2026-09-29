import { notFound } from "next/navigation";
import { requireUser } from "@/server/auth/guards";
import { classDashboard } from "@/server/services/classroom.service";
import { ClassBoard } from "@/components/Teacher";

export const metadata = { title: "Class" };

export default async function ClassPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  // Only the class's own teacher can open it; anyone else gets a plain 404.
  const data = await classDashboard(user.id, id).catch(() => null);
  if (!data) notFound();
  return <ClassBoard data={data} />;
}
