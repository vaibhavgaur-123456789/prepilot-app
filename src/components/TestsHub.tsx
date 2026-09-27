"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/client/api";
import { Alert, Badge, Button, Card, CardTitle, cx, EmptyState, inputClass, PageHeader } from "./ui";
import { TrendChart } from "./charts";

type Mock = { id: string; title: string; type: string; durationMinutes: number; questionCount: number; custom: boolean; inProgress: string | null; attempts: { id: string; percent: number | null; submittedAt: string; accuracy: number | null }[] };
type Hist = { id: string; title: string; type: string; percent: number; accuracy: number | null; submittedAt: string };
const TYPES = [["FULL", "Full mocks"], ["SECTIONAL", "Sectional"], ["DIAGNOSTIC", "Diagnostic"], ["TOPIC", "Topic tests"], ["CUSTOM", "Custom"]] as const;

export function TestsHub({ exam, mocks, history, subjects, pendingAnalysis }: { exam: { name: string; negativeMarking: number; marksPerQuestion: number }; mocks: Mock[]; history: Hist[]; subjects: { id: string; name: string; topics: { id: string; name: string }[] }[]; pendingAnalysis: { id: string; title: string } | null }) {
  const router = useRouter();
  const [tab, setTab] = useState<string>("FULL");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [focus, setFocus] = useState<"MIXED" | "WEAK" | "UNSEEN" | "MISTAKES">("WEAK");
  const [subjectId, setSubjectId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [count, setCount] = useState(15);
  const [duration, setDuration] = useState(15);

  async function start(mockId: string, inProgress: string | null) {
    if (inProgress) return router.push(`/tests/attempt/${inProgress}`);
    setBusy(mockId);
    setError(null);
    try {
      const a = await apiFetch<{ id: string }>(`/api/v1/mocks/${mockId}/start`, { method: "POST", body: {} });
      router.push(`/tests/attempt/${a.id}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn't start the test.");
      setBusy(null);
    }
  }

  async function createCustom() {
    setBusy("custom");
    setError(null);
    try {
      const r = await apiFetch<{ mockId: string; questionCount: number }>("/api/v1/mocks", { method: "POST", body: { focus: topicId ? "MIXED" : focus, subjectIds: subjectId && !topicId ? [subjectId] : [], topicIds: topicId ? [topicId] : [], count, durationMinutes: duration } });
      await start(r.mockId, null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn't build the test.");
      setBusy(null);
    }
  }

  const list = mocks.filter((m) => m.type === tab);
  const subject = subjects.find((s) => s.id === subjectId);
  return (
    <div className="space-y-4">
      <PageHeader title="Tests" subtitle={`${exam.name} · ${exam.marksPerQuestion} mark${exam.marksPerQuestion === 1 ? "" : "s"} per question, −${Math.round(exam.negativeMarking * 100) / 100} for a wrong answer`} />
      {error && <Alert tone="danger">{error}</Alert>}
      {pendingAnalysis && <Alert tone="warning" title="Analysis pending">Review <Link className="font-semibold underline" href={`/tests/result/${pendingAnalysis.id}`}>{pendingAnalysis.title}</Link>. The insight from a mock comes from its analysis.</Alert>}

      <Card>
        <div className="mb-3 flex gap-2 overflow-x-auto pb-1" role="tablist">
          {TYPES.map(([v, l]) => (
            <button key={v} role="tab" aria-selected={tab === v} onClick={() => setTab(v)} className={cx("shrink-0 rounded-full border px-3 py-1.5 text-sm font-semibold", tab === v ? "border-primary bg-primary-soft text-primary" : "border-border")}>{l}</button>
          ))}
        </div>
        {list.length === 0 ? <EmptyState title="No tests here yet">{tab === "CUSTOM" || tab === "TOPIC" ? "Build one below." : ""}</EmptyState> : (
          <ul className="divide-y divide-border">
            {list.map((m) => {
              const best = m.attempts.reduce<number | null>((b, a) => (a.percent !== null && (b === null || a.percent > b) ? a.percent : b), null);
              return (
                <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-medium">{m.title}</p>
                    <p className="text-xs text-muted">{m.questionCount} questions · {m.durationMinutes} min{m.attempts.length ? ` · attempted ${m.attempts.length}× · best ${best}%` : ""}</p>
                  </div>
                  <div className="flex gap-2">
                    {m.attempts[0] && <Link href={`/tests/result/${m.attempts[0].id}`} className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-primary hover:bg-primary-soft">Analysis</Link>}
                    <Button onClick={() => start(m.id, m.inProgress)} disabled={busy === m.id}>{m.inProgress ? "Resume" : m.attempts.length ? "Retake" : "Start"}</Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card>
        <CardTitle>Build a practice test</CardTitle>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block"><span className="mb-1 block text-sm font-medium">Focus</span>
            <select className={inputClass} value={focus} onChange={(e) => setFocus(e.target.value as typeof focus)} disabled={!!topicId}>
              <option value="WEAK">My weak topics</option><option value="UNSEEN">Questions I haven&apos;t seen</option><option value="MISTAKES">Re-test my mistakes</option><option value="MIXED">Mixed</option>
            </select>
          </label>
          <label className="block"><span className="mb-1 block text-sm font-medium">Subject (optional)</span>
            <select className={inputClass} value={subjectId} onChange={(e) => { setSubjectId(e.target.value); setTopicId(""); }}>
              <option value="">All subjects</option>{subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          {subject && (
            <label className="block sm:col-span-2"><span className="mb-1 block text-sm font-medium">Topic test (optional)</span>
              <select className={inputClass} value={topicId} onChange={(e) => setTopicId(e.target.value)}>
                <option value="">Whole subject</option>{subject.topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </label>
          )}
          <label className="block"><span className="mb-1 block text-sm font-medium">Questions</span><input type="number" min={5} max={100} className={inputClass} value={count} onChange={(e) => setCount(Number(e.target.value))} /></label>
          <label className="block"><span className="mb-1 block text-sm font-medium">Time limit (min)</span><input type="number" min={5} max={180} className={inputClass} value={duration} onChange={(e) => setDuration(Number(e.target.value))} /></label>
        </div>
        <Button className="mt-3" onClick={createCustom} disabled={busy === "custom"}>{busy === "custom" ? "Building…" : "Start practice test"}</Button>
      </Card>

      <Card>
        <CardTitle>Score trend</CardTitle>
        {history.length < 2 ? <p className="text-sm text-muted">Take at least two tests to see a trend.</p> : (
          <TrendChart data={history.map((h) => ({ label: new Date(h.submittedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }), value: h.percent, name: h.title }))} unit="%" label="Test score (%)" />
        )}
        <ul className="mt-3 divide-y divide-border">
          {[...history].reverse().slice(0, 8).map((h) => (
            <li key={h.id} className="flex items-center justify-between py-2 text-sm">
              <Link href={`/tests/result/${h.id}`} className="font-medium text-primary">{h.title}</Link>
              <span className="tabular">{h.percent}% <Badge>{h.type.toLowerCase()}</Badge></span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
