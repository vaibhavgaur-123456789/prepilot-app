import { listFeedback } from "@/server/services/feedback.service";
import { FeedbackInbox } from "@/components/FeedbackInbox";
import { PageHeader } from "@/components/ui";

export const metadata = { title: "Complaints" };

export default async function AdminFeedbackPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const items = await listFeedback(status && ["OPEN", "IN_PROGRESS", "RESOLVED"].includes(status) ? status : undefined);
  return (
    <div className="space-y-4">
      <PageHeader title="Complaints & feedback" subtitle="Everything students report from the “Report a problem” button." />
      <FeedbackInbox items={JSON.parse(JSON.stringify(items))} status={status ?? "ALL"} />
    </div>
  );
}
