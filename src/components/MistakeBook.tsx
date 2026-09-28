"use client";

import { useMemo, useState } from "react";
import { apiFetch, ApiError } from "@/lib/client/api";
import { MISTAKE_LABELS, type MistakeCategory } from "@/lib/engine/mistakes";
import { Alert, Badge, Card, cx, EmptyState } from "./ui";

type Item = {
  id: string; category: MistakeCategory; autoCategory: MistakeCategory; userCorrected: boolean; resolved: boolean; reviewCount: number; topic: string; subject: string;
  question: { stem: string; options: string[]; correctIndex: number; explanation: string }; selectedIndex: number | null; timeSpentSec: number; confidence: string | null;
};

function MistakeCard({ m, onChange }: { m: Item; onChange: (m: Item) => void }) {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);
  const [res, setRes] = useState<{ correct: boolean } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function retry(i: number) {
    setPicked(i);
    try {
      const r = await apiFetch<{ correct: boolean }>(`/api/v1/mistakes/${m.id}`, { method: "POST", body: { selectedIndex: i } });
      setRes(r);
      onChange({ ...m, resolved: r.correct, reviewCount: m.reviewCount + 1 });
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Couldn't save.");
    }
  }
  async function recategorize(category: string) {
    try {
      await apiFetch(`/api/v1/mistakes/${m.id}`, { method: "PATCH", body: { category } });
      onChange({ ...m, category: category as MistakeCategory, userCorrected: category !== m.autoCategory });
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Couldn't save.");
    }
  }

  return (
    <li className="rounded-xl border border-border p-3">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-muted">{m.subject} · {m.topic}</span>
        {m.resolved ? <Badge tone="success">✓ Resolved</Badge> : <Badge tone="danger">Open</Badge>}
        {m.confidence === "HIGH" && <Badge tone="warning">Was confident</Badge>}
      </div>
      <p className="mt-1 text-sm font-medium">{m.question.stem}</p>
      <label className="mt-2 flex items-center gap-2 text-xs">
        Cause:
        <select className="min-h-9 rounded-lg border border-border bg-surface px-2" value={m.category} onChange={(e) => recategorize(e.target.value)}>
          {Object.entries(MISTAKE_LABELS).map(([k, l]) => <option key={k} value={k}>{l}{k === m.autoCategory ? " (auto)" : ""}</option>)}
        </select>
        <span className="text-muted">{m.timeSpentSec}s spent</span>
      </label>
      {!open ? (
        <button type="button" onClick={() => setOpen(true)} className="mt-2 text-sm font-semibold text-primary">{m.resolved ? "Show solution" : "Re-solve without looking →"}</button>
      ) : (
        <div className="mt-2 space-y-1.5">
          {m.question.options.map((o, i) => {
            const show = res || m.resolved;
            return (
              <button key={i} type="button" disabled={!!show} onClick={() => retry(i)} className={cx("block w-full rounded-lg border px-3 py-2 text-left text-sm", show && i === m.question.correctIndex ? "border-success bg-success-soft" : show && i === picked ? "border-danger bg-danger-soft" : "border-border hover:bg-surface-2")}>
                {String.fromCharCode(65 + i)}. {o} {show && i === m.question.correctIndex && "✓"}{i === m.selectedIndex && " (your original answer)"}
              </button>
            );
          })}
          {(res || m.resolved) && <p className="rounded-lg bg-surface-2 p-2 text-sm"><b>{res ? (res.correct ? "Correct! Marked resolved." : "Not yet. It'll come back in 2 days.") : "Solution:"}</b> {m.question.explanation}</p>}
        </div>
      )}
      {err && <Alert tone="danger">{err}</Alert>}
    </li>
  );
}

export function MistakeBook({ items: initial }: { items: Item[] }) {
  const [items, setItems] = useState(initial);
  const [filter, setFilter] = useState<"OPEN" | "ALL" | MistakeCategory>("OPEN");
  const shown = useMemo(() => items.filter((m) => (filter === "OPEN" ? !m.resolved : filter === "ALL" ? true : m.category === filter)), [items, filter]);
  if (items.length === 0) return <EmptyState title="Your mistake book is empty">Nothing to re-solve right now.</EmptyState>;
  return (
    <Card>
      <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
        {(["OPEN", "ALL", ...Object.keys(MISTAKE_LABELS)] as const).map((f) => (
          <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f as typeof filter)} className={cx("shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold", filter === f ? "border-primary bg-primary-soft text-primary" : "border-border")}>
            {f === "OPEN" ? "Open" : f === "ALL" ? "All" : MISTAKE_LABELS[f as MistakeCategory]}
          </button>
        ))}
      </div>
      {shown.length === 0 ? <p className="text-sm text-muted">Nothing here.</p> : (
        <ul className="space-y-3">{shown.slice(0, 60).map((m) => <MistakeCard key={m.id} m={m} onChange={(n) => setItems((xs) => xs.map((x) => (x.id === n.id ? n : x)))} />)}</ul>
      )}
    </Card>
  );
}
