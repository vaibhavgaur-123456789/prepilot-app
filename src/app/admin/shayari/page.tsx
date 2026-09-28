import { adminListShayari } from "@/server/services/shayari.service";
import { SHAYARI } from "@/content/shayari";
import { AdminShayari } from "@/components/AdminShayari";
import { PageHeader } from "@/components/ui";

export const metadata = { title: "Shayari" };

export default async function AdminShayariPage() {
  const items = await adminListShayari();
  return (
    <div className="space-y-4">
      <PageHeader title="Shayari & motivation lines" subtitle={`${SHAYARI.length} built-in lines + ${items.length} added by you. Add only real lines by named poets.`} />
      <AdminShayari items={JSON.parse(JSON.stringify(items))} />
    </div>
  );
}
