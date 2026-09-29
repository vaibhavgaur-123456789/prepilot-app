"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, apiFetch } from "@/lib/client/api";
import { Alert, Badge, Button, Card, CardTitle, inputClass } from "./ui";

type Ev = { id: string; title: string; examName: string; kind: string; date: string; link: string };
const KINDS = [["FORM_START", "Form starts"], ["LAST_DATE", "Last date to apply"], ["ADMIT_CARD", "Admit card"], ["EXAM", "Exam day"], ["RESULT", "Result"], ["OTHER", "Other"]] as const;
const blank = { title: "", examName: "", kind: "EXAM", date: "", link: "" };

export function AdminEvents({ events }: { events: Ev[] }) {
  const router = useRouter();
  const [f, setF] = useState<Omit<Ev, "id"> & { id?: string }>(blank);
  const [error, setError] = useState<string | null>(null);

  async function post(body: object) {
    setError(null);
    try {
      await apiFetch("/api/v1/admin/events", { body });
      setF(blank);
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn't save.");
    }
  }

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <CardTitle>{f.id ? "Edit date" : "Add a date"}</CardTitle>
        <input className={inputClass} placeholder="Title, e.g. SSC CGL 2026 Tier 1 exam" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
        <div className="grid gap-2 sm:grid-cols-3">
          <input className={inputClass} placeholder="Exam (e.g. SSC CGL) or empty for all" value={f.examName} onChange={(e) => setF({ ...f, examName: e.target.value })} />
          <select className={inputClass} value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })}>{KINDS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
          <input type="date" className={inputClass} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} />
        </div>
        <input className={inputClass} placeholder="Official notice link (https://…)" value={f.link} onChange={(e) => setF({ ...f, link: e.target.value })} />
        {error && <Alert tone="danger">{error}</Alert>}
        <div className="flex gap-2">
          <Button onClick={() => post({ action: "save", event: f })} disabled={!f.title.trim() || !f.date}>Save</Button>
          {f.id && <Button variant="ghost" onClick={() => setF(blank)}>Cancel</Button>}
        </div>
      </Card>
      <Card>
        <CardTitle>All dates ({events.length})</CardTitle>
        {events.length === 0 ? <p className="text-sm text-muted">No dates yet.</p> : (
          <ul className="divide-y divide-border text-sm">
            {events.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-2 py-2">
                <span><b>{e.date}</b> · {e.title} <Badge>{e.kind}</Badge> {e.examName && <span className="text-muted">({e.examName})</span>}</span>
                <span className="flex shrink-0 gap-2">
                  <button type="button" className="text-primary underline" onClick={() => setF(e)}>Edit</button>
                  <button type="button" className="text-muted underline" onClick={() => window.confirm("Delete this date?") && post({ action: "delete", id: e.id })}>Delete</button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
