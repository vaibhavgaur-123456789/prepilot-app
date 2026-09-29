import { requireStudent } from "@/server/auth/guards";
import { myGroups } from "@/server/services/group.service";
import { GroupsHome } from "@/components/Social";

export const metadata = { title: "Study groups" };

export default async function GroupsPage() {
  const user = await requireStudent();
  return <GroupsHome groups={await myGroups(user.id)} />;
}
