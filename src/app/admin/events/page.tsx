import { adminListEvents } from "@/server/services/calendar.service";
import { AdminEvents } from "@/components/AdminEvents";
import { PageHeader } from "@/components/ui";

export const metadata = { title: "Exam calendar" };

export default async function AdminEventsPage() {
  const events = await adminListEvents();
  return (
    <div className="space-y-4">
      <PageHeader title="Exam calendar" subtitle="Add dates from official notices only (ssc.gov.in, rrbcdg.gov.in, ibps.in…). Students get a reminder 3 days and 1 day before." />
      <AdminEvents events={JSON.parse(JSON.stringify(events))} />
    </div>
  );
}
