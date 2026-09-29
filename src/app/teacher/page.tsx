import { requireUser } from "@/server/auth/guards";
import { teacherClasses } from "@/server/services/classroom.service";
import { TeacherHome } from "@/components/Teacher";

export const metadata = { title: "Teacher dashboard" };

export default async function TeacherPage() {
  const user = await requireUser();
  const classes = await teacherClasses(user.id);
  return <TeacherHome classes={classes} teacherName={user.name} />;
}
