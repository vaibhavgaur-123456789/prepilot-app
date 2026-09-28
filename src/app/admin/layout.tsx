import Link from "next/link";
import { requireAdmin } from "@/server/auth/guards";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <nav className="mb-4 flex items-center gap-4 text-sm">
        <Link href="/admin" className="font-bold">RozPadh Admin</Link>
        <Link href="/" className="text-muted">← Back to app</Link>
      </nav>
      {children}
    </div>
  );
}
