"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/client/api";
import { Alert, Badge, Card, EmptyState } from "./ui";

type Item = { topicId: string; topicName: string; subjectName: string; nextRevisionOn: string; overdueDays: number; due: boolean; stage: number; lapses: number };

export function RevisionList({ items }: { items: Item[] }) {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function rate(topicId: string, recall: number) {
    setBusy(topicId);
    try {
      const r = await apiFetch<{ outcome: string; nextRevisionOn: string }>("/api/v1/revision", { method: "POST", body: { topicId, recall } });
      setMsg(`Saved. Next revision on ${r.nextRevisionOn} (${r.outcome === "ADVANCED" ? "spacing increased" : r.outcome === "LAPSED" ? "coming back soon" : "same spacing"}).`);
      router.refresh();
    } catch (e) {
      setMsg(e instanceof ApiError ? e.message : "Couldn't save.");
    } finally {
      setBusy(null);
    }
  }

  if (items.length === 0) return <EmptyState title="No revisions scheduled yet">When you finish learning a topic, it&apos;s added here automatically.</EmptyState>;
  return (
    <Card>
      {msg && <div className="mb-3"><Alert tone="success">{msg}</Alert></div>}
      <ul className="divide-y divide-border">
        {items.map((q) => (
          <li key={q.topicId} className="py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium">{q.subjectName}: {q.topicName}</p>
                <p className="text-xs text-muted">Stage {q.stage + 1} of 6{q.lapses ? ` · forgotten ${q.lapses}×` : ""} · {q.due ? (q.overdueDays ? `overdue ${q.overdueDays}d` : "due today") : `due ${q.nextRevisionOn}`}</p>
              </div>
              {q.due ? <Badge tone={q.overdueDays ? "warning" : "success"}>{q.overdueDays ? "Overdue" : "Due"}</Badge> : <Badge>Upcoming</Badge>}
            </div>
            {q.due && (
              <div className="mt-2">
                <p className="mb-1 text-xs text-muted">Revised it? How well did you recall it?</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {[[1, "Forgot"], [2, "Hard"], [3, "Good"], [4, "Easy"]].map(([v, l]) => (
                    <button key={v} type="button" disabled={busy === q.topicId} onClick={() => rate(q.topicId, v as number)} className="h-10 rounded-xl border border-border text-sm font-semibold hover:bg-surface-2 disabled:opacity-50">{l}</button>
                  ))}
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}
