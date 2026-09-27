import { requireStudent } from "@/server/auth/guards";
import { mySyllabus } from "@/server/services/syllabus.service";
import { SyllabusEditor } from "@/components/SyllabusEditor";

export const metadata = { title: "My syllabus" };

export default async function SyllabusPage() {
  const user = await requireStudent();
  const data = await mySyllabus(user.id);
  return <SyllabusEditor data={data} />;
}
