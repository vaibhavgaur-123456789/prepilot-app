import { notFound, redirect } from "next/navigation";
import { requireStudent } from "@/server/auth/guards";
import { prisma } from "@/server/db";
import { normalizeCode } from "@/server/services/classroom.service";
import { JoinGroupPrompt } from "@/components/Social";

export const metadata = { title: "Join study group" };

/** Shared group link (/groups/join/K7M2QX). */
export default async function JoinGroupPage({ params }: { params: Promise<{ code: string }> }) {
  const user = await requireStudent();
  const code = normalizeCode((await params).code);
  const g = await prisma.studyGroup.findUnique({ where: { code }, include: { _count: { select: { members: true } }, members: { where: { userId: user.id }, select: { id: true } } } });
  if (!g) notFound();
  if (g.members.length) redirect(`/groups/${g.id}`);
  return <JoinGroupPrompt code={code} name={g.name} members={g._count.members} />;
}
