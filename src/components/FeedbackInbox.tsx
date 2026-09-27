"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/client/api";
import { Alert, Badge, Button, Card, cx, EmptyState, inputClass } from "./ui";

type Item = { id: string; category: string; message: string; page: string | null; contact: string | null; userAgent: string | null; status: string; adminNote: string; createdAt: string; user: { name: string; email: string } | null };
const TONE = { OPEN: "danger", IN_PROGRESS: "warning", RESOLVED: "success" } as const;
const CAT: Record<string, string> = { BUG: "Not working", CONTENT_ERROR: "Wrong question/answer", SUGGESTION: "Suggestion", ACCOUNT: "Account/login", OTHER: "Other" };

function Row({ f }: { f: Item }) {
  const router = useRouter();
  const [note, setNote] = useState(f.adminNote);
  const [err, setErr] = useState<string | null>(null);
  async function set(status: string) {
    try {
      await apiFetch("/api/v1/feedback", { method: "PATCH", body: { id: f.id, status, adminNote: note } });
      router.refresh();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Failed.");
    }
  }
  return (
    <li className="rounded-xl border border-border p-3">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
        <Badge tone={TONE[f.status as keyof typeof TONE] ?? "neutral"}>{f.status.replace("_", " ").toLowerCase()}</Badge>
        <Badge>{CAT[f.category] ?? f.category}</Badge>
        <span>{new Date(f.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span>
        <span>· {f.user ? `${f.user.name} (${f.user.email})` : f.contact ?? "anonymous"}</span>
        {f.page && <span>· page {f.page}</span>}
      </div>
      <p className="mt-2 whitespace-pre-wrap text-sm">{f.message}</p>
      {f.contact && <a className="mt-1 inline-block text-xs font-semibold text-primary" href={`mailto:${f.contact}?subject=${encodeURIComponent("Re: your PrepPilot report")}`}>Reply by email →</a>}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <input className={cx(inputClass, "min-h-9 flex-1")} placeholder="Note to the student (shown when resolved)" value={note} onChange={(e) => setNote(e.target.value)} />
        {f.status !== "IN_PROGRESS" && <Button variant="secondary" onClick={() => set("IN_PROGRESS")}>In progress</Button>}
        {f.status !== "RESOLVED" ? <Button onClick={() => set("RESOLVED")}>Resolve</Button> : <Button variant="ghost" onClick={() => set("OPEN")}>Reopen</Button>}
      </div>
      {err && <Alert tone="danger">{err}</Alert>}
    </li>
  );
}

export function FeedbackInbox({ items, status }: { items: Item[]; status: string }) {
  return (
    <Card>
      <div className="mb-3 flex gap-2">
        {["ALL", "OPEN", "IN_PROGRESS", "RESOLVED"].map((s) => (
          <Link key={s} href={s === "ALL" ? "/admin/feedback" : `/admin/feedback?status=${s}`} className={cx("rounded-full border px-3 py-1.5 text-xs font-semibold", status === s ? "border-primary bg-primary-soft text-primary" : "border-border")}>{s.replace("_", " ").toLowerCase()}</Link>
        ))}
      </div>
      {items.length === 0 ? <EmptyState title="No reports here" /> : <ul className="space-y-3">{items.map((f) => <Row key={f.id} f={f} />)}</ul>}
    </Card>
  );
}
