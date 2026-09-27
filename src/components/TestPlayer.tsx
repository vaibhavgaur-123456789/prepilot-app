"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/client/api";
import { fmtClock } from "@/lib/client/timer-store";
import { Alert, Button, cx } from "./ui";
import { useT } from "@/i18n/client";

type Q = { id: string; stem: string; options: string[]; subject: string; topic: string; marks: number };
type Ans = { selected: number | null; timeSpentSec: number; confidence: "LOW" | "MEDIUM" | "HIGH" | null };
type Attempt = { id: string; startedAt: string; deadline: string; mock: { title: string; type: string; durationMinutes: number }; answers: Record<string, Ans>; questions: Q[] };

export function TestPlayer({ attempt }: { attempt: Attempt }) {
  const router = useRouter();
  const t = useT();
  const storageKey = `pp_attempt_${attempt.id}`;
  const [answers, setAnswers] = useState<Record<string, Ans>>(() => {
    try {
      return { ...attempt.answers, ...JSON.parse(localStorage.getItem(storageKey) ?? "{}") };
    } catch {
      return attempt.answers;
    }
  });
  const [i, setI] = useState(0);
  const [now, setNow] = useState(() => new Date(attempt.startedAt).getTime());
  const [marked, setMarked] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const shownAt = useRef(0);
  const dirty = useRef<Record<string, Ans>>({});
  const q = attempt.questions[i];
  const deadline = new Date(attempt.deadline).getTime();
  const left = deadline - now;

  // Accumulate time spent on the visible question.
  const commitTime = useCallback(() => {
    const qid = attempt.questions[i]?.id;
    if (!qid) return;
    const spent = Math.round((Date.now() - shownAt.current) / 1000);
    shownAt.current = Date.now();
    if (spent <= 0) return;
    setAnswers((a) => {
      const cur = a[qid] ?? { selected: null, timeSpentSec: 0, confidence: null };
      const next = { ...cur, timeSpentSec: cur.timeSpentSec + spent };
      dirty.current[qid] = next;
      return { ...a, [qid]: next };
    });
  }, [attempt.questions, i]);

  // Start timing the visible question.
  useEffect(() => {
    shownAt.current = Date.now();
  }, [i]);

  // Clock tick; auto-submit when time runs out.
  const submitRef = useRef<() => void>(() => undefined);
  useEffect(() => {
    const t = setInterval(() => {
      const n = Date.now();
      setNow(n);
      if (n >= deadline) submitRef.current();
    }, 1000);
    return () => clearInterval(t);
  }, [deadline]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(answers));
    } catch {
      /* ignore */
    }
  }, [answers, storageKey]);

  // Autosave every 15 s (best effort; answers are also kept on the device).
  useEffect(() => {
    const t = setInterval(() => {
      const batch = dirty.current;
      if (!Object.keys(batch).length) return;
      dirty.current = {};
      apiFetch(`/api/v1/attempts/${attempt.id}`, { method: "PATCH", body: { answers: batch } }).catch(() => (dirty.current = { ...batch, ...dirty.current }));
    }, 15_000);
    return () => clearInterval(t);
  }, [attempt.id]);

  const submitting$ = useRef(false);
  const submit = useCallback(async () => {
    if (submitting$.current) return;
    submitting$.current = true;
    commitTime();
    setSubmitting(true);
    setError(null);
    try {
      const final = JSON.parse(localStorage.getItem(storageKey) ?? "{}");
      await apiFetch(`/api/v1/attempts/${attempt.id}`, { method: "POST", body: { action: "submit", answers: { ...answers, ...final } } });
      localStorage.removeItem(storageKey);
      router.replace(`/tests/result/${attempt.id}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn't submit. Your answers are saved on this device. Try again.");
      setSubmitting(false);
      submitting$.current = false;
    }
  }, [answers, attempt.id, commitTime, router, storageKey]);

  useEffect(() => {
    submitRef.current = submit;
  }, [submit]);

  function go(n: number) {
    commitTime();
    setI(Math.max(0, Math.min(attempt.questions.length - 1, n)));
  }
  function choose(opt: number) {
    setAnswers((a) => {
      const cur = a[q.id] ?? { selected: null, timeSpentSec: 0, confidence: null };
      const next = { ...cur, selected: cur.selected === opt ? null : opt };
      dirty.current[q.id] = next;
      return { ...a, [q.id]: next };
    });
  }
  function setConfidence(c: Ans["confidence"]) {
    setAnswers((a) => {
      const cur = a[q.id] ?? { selected: null, timeSpentSec: 0, confidence: null };
      const next = { ...cur, confidence: cur.confidence === c ? null : c };
      dirty.current[q.id] = next;
      return { ...a, [q.id]: next };
    });
  }

  const answered = attempt.questions.filter((x) => answers[x.id]?.selected !== null && answers[x.id]?.selected !== undefined).length;
  const a = answers[q.id];

  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col px-4 py-4">
      <header className="sticky top-0 z-10 -mx-4 mb-3 flex items-center justify-between border-b border-border bg-bg px-4 py-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{attempt.mock.title}</p>
          <p className="text-xs text-muted">{t("test.answered", { a: answered, b: attempt.questions.length })}</p>
        </div>
        <p role="timer" aria-label="Time left" className={cx("tabular rounded-xl px-3 py-1.5 text-lg font-bold", left < 5 * 60_000 ? "bg-danger-soft text-danger" : "bg-surface-2")}>{fmtClock(left)}</p>
      </header>
      {error && <Alert tone="danger">{error}</Alert>}

      <div className="flex-1">
        <p className="text-xs text-muted">Q{i + 1} · {q.subject} · {q.topic} · {q.marks} mark{q.marks === 1 ? "" : "s"}</p>
        <h1 className="mt-2 whitespace-pre-line text-lg font-medium">{q.stem}</h1>
        <div className="mt-4 space-y-2" role="radiogroup" aria-label="Options">
          {q.options.map((o, k) => (
            <button key={k} role="radio" aria-checked={a?.selected === k} onClick={() => choose(k)} className={cx("flex w-full items-start gap-3 rounded-xl border p-3 text-left text-sm", a?.selected === k ? "border-primary bg-primary-soft" : "border-border bg-surface hover:bg-surface-2")}>
              <span className={cx("grid h-6 w-6 shrink-0 place-items-center rounded-full border text-xs font-bold", a?.selected === k ? "border-primary bg-primary text-on-primary" : "border-border")}>{String.fromCharCode(65 + k)}</span>
              {o}
            </button>
          ))}
        </div>
        <fieldset className="mt-4">
          <legend className="mb-1 text-xs font-medium text-muted">{t("test.sure")}</legend>
          <div className="flex gap-2">
            {(["LOW", "MEDIUM", "HIGH"] as const).map((c) => (
              <button key={c} type="button" aria-pressed={a?.confidence === c} onClick={() => setConfidence(c)} className={cx("min-h-10 flex-1 rounded-xl border text-xs font-semibold", a?.confidence === c ? "border-primary bg-primary-soft text-primary" : "border-border")}>
                {c === "LOW" ? t("test.guessing") : c === "MEDIUM" ? t("test.fairly") : t("test.certain")}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="mt-6 space-y-3">
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => go(i - 1)} disabled={i === 0}>{t("test.prev")}</Button>
          <Button variant="secondary" onClick={() => setMarked((m) => { const n = new Set(m); if (n.has(q.id)) n.delete(q.id); else n.add(q.id); return n; })}>{marked.has(q.id) ? t("test.unmark") : t("test.mark")}</Button>
          {i < attempt.questions.length - 1 ? <Button className="flex-1" onClick={() => go(i + 1)}>{t("test.next")}</Button> : <Button className="flex-1" onClick={() => setConfirm(true)}>{t("test.finish")}</Button>}
        </div>
        <nav aria-label="Question palette" className="flex flex-wrap gap-1.5">
          {attempt.questions.map((x, k) => {
            const done = answers[x.id]?.selected !== null && answers[x.id]?.selected !== undefined;
            return (
              <button key={x.id} onClick={() => go(k)} aria-label={`Question ${k + 1}${done ? ", answered" : ""}${marked.has(x.id) ? ", marked" : ""}`} aria-current={k === i} className={cx("h-9 w-9 rounded-lg border text-xs font-semibold", k === i && "ring-2 ring-primary", done ? "border-primary bg-primary text-on-primary" : "border-border bg-surface", marked.has(x.id) && "border-warning")}>
                {k + 1}{marked.has(x.id) ? "•" : ""}
              </button>
            );
          })}
        </nav>
        <Button variant="ghost" onClick={() => setConfirm(true)}>{t("test.submit")}</Button>
      </div>

      {confirm && (
        <div role="dialog" aria-modal aria-label="Submit test" className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={() => setConfirm(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-surface p-5" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold">{t("test.submitNow")}</h2>
            <p className="mt-1 text-sm text-muted">{answered} of {attempt.questions.length} answered{marked.size ? `, ${marked.size} marked for review` : ""}. Unanswered questions score zero (no negative marks).</p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setConfirm(false)}>{t("test.keepGoing")}</Button>
              <Button onClick={submit} disabled={submitting}>{submitting ? t("test.scoring") : t("test.submit")}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
