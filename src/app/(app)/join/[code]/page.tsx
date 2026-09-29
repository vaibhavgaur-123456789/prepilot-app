import { requireStudent } from "@/server/auth/guards";
import { myClasses, normalizeCode } from "@/server/services/classroom.service";
import { JoinClass } from "@/components/Teacher";

export const metadata = { title: "Join a class" };

/** Link a teacher shares (/join/K7M2QX): the student confirms before any data is shared. */
export default async function JoinPage({ params }: { params: Promise<{ code: string }> }) {
  const user = await requireStudent();
  const { code } = await params;
  const classes = await myClasses(user.id);
  return (
    <div className="mx-auto max-w-lg">
      <JoinClass classes={classes} initialCode={normalizeCode(code).slice(0, 12)} />
    </div>
  );
}
