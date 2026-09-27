"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApiError, newClientId, sendOrQueue } from "@/lib/client/api";
import { activeMs, breakMs, fmtClock, useTimer } from "@/lib/client/timer-store";
import { Alert, Badge, Button, Card, cx, inputClass } from "./ui";
import { CoffeeIcon, PauseIcon, PlayIcon } from "./icons";
import { useT } from "@/i18n/client";

type TaskInfo = { id: string; title: string; type: string; topicId: string | null; plannedMinutes: number; questionTarget: number; objective: string; topicName: string | null } | null;
type Result = { xp: { type: string; amount: number; reason: string }[]; flags: string[]; message: string; achievements: { name: string; icon: string }[]; weakFlagged: string[]; pathwayMessage?: string | null } | null;

const BREAK_MIN = 5;

function Rating({ label, value, onChange, low, high }: { label: string; value: number | null; onChange: (v: number) => void; low: string; high: string }) {
  return (
    <fieldset>
      <legend className="mb-1 text-sm font-medium">{label}</legend>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" aria-pressed={value === n} aria-label={`${label} ${n} of 5`} onClick={() => onChange(n)} className={cx("h-11 flex-1 rounded-xl border text-sm font-semibold", value === n ? "border-primary bg-primary text-on-primary" : "border-border hover:bg-surface-2")}>
            {n}
          </button>
        ))}
      </div>
      <div className="mt-0.5 flex justify-between text-[11px] text-muted"><span>{low}</span><span>{high}</span></div>
    </fieldset>
  );
}

export function FocusSession({ task, autoStart = false }: { task: TaskInfo; autoStart?: boolean }) {
  const router = useRouter();
  const tt = useT();
  const t = useTimer();
  const [now, setNow] = useState(0);
  const [stage, setStage] = useState<"setup" | "running" | "finish" | "done">("setup");
  const [mode, setMode] = useState<"TIMER" | "STOPWATCH">("TIMER");
  const [minutes, setMinutes] = useState(task?.plannedMinutes ?? 45);
  const [notes, setNotes] = useState("");
  const [attempted, setAttempted] = useState(task?.questionTarget ?? 0);
  const [correct, setCorrect] = useState(0);
  const [completion, setCompletion] = useState(100);
  const [difficulty, setDifficulty] = useState<number | null>(null);
  const [focus, setFocus] = useState<number | null>(null);
  const [energy, setEnergy] = useState<number | null>(null);
  const [recall, setRecall] = useState<number | null>(null);
  const [topicDone, setTopicDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result>(null);
  const [queued, setQueued] = useState(false);
  const [busy, setBusy] = useState(false);
  const wakeLock = useRef<{ release: () => Promise<void> } | null>(null);

  // Resume a session already running for this task (after reload / offline). The timer lives in
  // localStorage, which only exists after mount, so this sync has to happen in an effect.
  useEffect(() => {
    const st = useTimer.getState();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (st.clientId && st.phase !== "idle" && (st.taskId ?? null) === (task?.id ?? null)) setStage("running");
    else if (autoStart && st.phase === "idle") start("STOPWATCH");
    // Runs once on mount; `start` is a hoisted declaration that reads the latest props.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task?.id, autoStart]);

  useEffect(() => {
    if (stage !== "running") return;
    const tick = () => setNow(Date.now());
    const i = setInterval(tick, 500);
    const first = setTimeout(tick, 0);
    return () => {
      clearInterval(i);
      clearTimeout(first);
    };
  }, [stage]);

  // Keep the screen awake while studying (no permission prompt required).
  useEffect(() => {
    const nav = navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> } };
    if (stage === "running" && nav.wakeLock) nav.wakeLock.request("screen").then((l) => (wakeLock.current = l)).catch(() => undefined);
    return () => {
      wakeLock.current?.release().catch(() => undefined);
      wakeLock.current = null;
    };
  }, [stage]);

  const act = now ? activeMs(t, now) : t.accumulatedActive;
  const brk = now ? breakMs(t, now) : t.accumulatedBreak;
  const plannedMs = t.plannedMinutes * 60_000;
  const remaining = plannedMs - act;
  const breakLeft = BREAK_MIN * 60_000 - (t.phase === "break" && t.segmentStart && now ? now - t.segmentStart : 0);

  async function start(modeOverride?: "TIMER" | "STOPWATCH") {
    const m = modeOverride ?? mode;
    const clientId = newClientId();
    t.start({ clientId, taskId: task?.id ?? null, topicId: task?.topicId ?? null, title: task?.title ?? tt("study.free"), mode: m, plannedMinutes: m === "TIMER" ? minutes : task?.plannedMinutes ?? 0 });
    setStage("running");
    try {
      await sendOrQueue("/api/v1/sessions", { action: "start", data: { clientId, taskId: task?.id ?? null, topicId: task?.topicId ?? null, mode: m, plannedMinutes: m === "TIMER" ? minutes : 0, startedAt: new Date().toISOString() } });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn't register the session start. Your timer is still running and will sync.");
    }
  }

  function finishNow() {
    if (t.phase === "running") t.pause();
    setStage("finish");
    const plannedMin = t.plannedMinutes || minutes;
    const actualMin = activeMs(useTimer.getState()) / 60_000;
    setCompletion(plannedMin > 0 ? Math.min(100, Math.round((actualMin / plannedMin) * 100 / 5) * 5) : 100);
  }

  async function submit() {
    if (correct > attempted) return setError("Correct answers can't be more than questions attempted.");
    setBusy(true);
    setError(null);
    const st = useTimer.getState();
    const payload = {
      action: "complete",
      data: {
        clientId: st.clientId,
        endedAt: new Date().toISOString(),
        activeSeconds: Math.round(activeMs(st) / 1000),
        breakSeconds: Math.round(breakMs(st) / 1000),
        pauseCount: st.pauseCount,
        questionsAttempted: attempted,
        questionsCorrect: correct,
        difficultyRating: difficulty,
        focusRating: focus,
        energyRating: energy,
        distractionCount: st.distractions,
        completionPct: completion,
        notes,
        recall: task?.type === "REVISION" ? recall : null,
        topicCompleted: topicDone,
        start: { taskId: st.taskId, topicId: st.topicId, mode: st.mode, plannedMinutes: st.plannedMinutes, startedAt: new Date(st.startedAt ?? Date.now()).toISOString() },
      },
    };
    try {
      const res = await sendOrQueue<Result>("/api/v1/sessions", payload);
      t.reset();
      if (res === null) setQueued(true);
      setResult(res);
      setStage("done");
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn't save. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (stage === "setup") {
    return (
      <div className="mx-auto max-w-lg px-4 py-6">
        <Link href="/study" className="text-sm text-muted">← {tt("common.back")}</Link>
        <h1 className="mt-2 text-2xl font-bold">{task?.title ?? tt("study.free")}</h1>
        {task?.objective && <p className="mt-1 text-sm text-muted">{task.objective}</p>}
        <Card className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {(["TIMER", "STOPWATCH"] as const).map((m) => (
              <button key={m} type="button" aria-pressed={mode === m} onClick={() => setMode(m)} className={cx("min-h-11 rounded-xl border text-sm font-semibold", mode === m ? "border-primary bg-primary-soft text-primary" : "border-border")}>
                {m === "TIMER" ? tt("focus.countdown") : tt("focus.stopwatch")}
              </button>
            ))}
          </div>
          {mode === "TIMER" && (
            <label className="block"><span className="mb-1 block text-sm font-medium">{tt("focus.duration")}</span><input type="number" min={5} max={240} className={inputClass} value={minutes} onChange={(e) => setMinutes(Math.max(5, Math.min(240, Number(e.target.value))))} /></label>
          )}
          {task && task.questionTarget > 0 && <p className="text-sm">🎯 Question target: <b>{task.questionTarget}</b></p>}
          <p className="text-xs text-muted">{tt("focus.tip")}</p>
          <Button className="w-full" onClick={() => start()}><PlayIcon width={18} height={18} /> {tt("focus.start")}</Button>
        </Card>
      </div>
    );
  }

  if (stage === "running") {
    const onBreak = t.phase === "break";
    const clock = onBreak ? fmtClock(breakLeft) : t.mode === "TIMER" ? fmtClock(Math.max(0, remaining)) : fmtClock(act);
    const overtime = t.mode === "TIMER" && remaining < 0 && !onBreak;
    return (
      <div className="flex min-h-dvh flex-col items-center justify-between bg-bg px-4 py-8 text-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">{onBreak ? tt("focus.break") : t.phase === "paused" ? tt("focus.paused") : tt("focus.focus")}</p>
          <p className="mt-1 max-w-md text-lg font-semibold">{t.title}</p>
          {task?.questionTarget ? <p className="text-sm text-muted">Target: {task.questionTarget} questions</p> : null}
        </div>
        <div aria-live="polite">
          <p className={cx("tabular text-7xl font-bold sm:text-8xl", onBreak && "text-success", overtime && "text-warning")} role="timer" aria-label={onBreak ? "Break time left" : t.mode === "TIMER" ? "Time left" : "Time elapsed"}>{clock}</p>
          {overtime && <p className="mt-2 text-sm text-warning">Planned time reached (+{fmtClock(-remaining)}). Finish when ready.</p>}
          {onBreak && breakLeft <= 0 && <p className="mt-2 text-sm text-success">Break over. Ready to continue?</p>}
          <p className="mt-2 text-xs text-muted">Focused {fmtClock(act)} · breaks {fmtClock(brk)} · distractions {t.distractions}</p>
        </div>
        <div className="w-full max-w-md space-y-3">
          {error && <Alert tone="warning">{error}</Alert>}
          <div className="grid grid-cols-3 gap-2">
            {t.phase === "running" ? (
              <Button variant="secondary" onClick={t.pause}><PauseIcon width={18} height={18} /> {tt("focus.pause")}</Button>
            ) : (
              <Button onClick={t.resume}><PlayIcon width={18} height={18} /> {onBreak ? tt("focus.resume") : tt("focus.continue")}</Button>
            )}
            <Button variant="secondary" onClick={t.startBreak} disabled={onBreak}><CoffeeIcon width={18} height={18} /> {tt("focus.break")}</Button>
            <Button variant="secondary" onClick={t.addDistraction}>{tt("focus.distracted")}</Button>
          </div>
          <textarea className={cx(inputClass, "min-h-20 py-2")} placeholder={tt("focus.notes")} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={2000} />
          <div className="flex gap-2">
            <Button variant="ghost" className="flex-1" onClick={() => document.documentElement.requestFullscreen?.().catch(() => undefined)}>{tt("focus.fullscreen")}</Button>
            <Button variant="danger" className="flex-1" onClick={finishNow}>{tt("focus.end")}</Button>
          </div>
        </div>
      </div>
    );
  }

  if (stage === "finish") {
    const actualMin = Math.round(activeMs(t) / 60_000);
    return (
      <div className="mx-auto max-w-lg space-y-4 px-4 py-6">
        <h1 className="text-2xl font-bold">{tt("focus.whatCompleted")}</h1>
        <Card className="space-y-4">
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="rounded-xl bg-surface-2 p-3"><p className="text-xs text-muted">{tt("plan.planned")}</p><p className="tabular text-xl font-semibold">{t.plannedMinutes || "–"} {tt("common.min")}</p></div>
            <div className="rounded-xl bg-surface-2 p-3"><p className="text-xs text-muted">{tt("focus.actualFocus")}</p><p className="tabular text-xl font-semibold">{actualMin} {tt("common.min")}</p></div>
          </div>
          <fieldset>
            <legend className="mb-1 text-sm font-medium">{tt("focus.howMuch")}</legend>
            <div className="grid grid-cols-5 gap-1.5">
              {[0, 25, 50, 75, 100].map((p) => (
                <button key={p} type="button" aria-pressed={completion === p} onClick={() => setCompletion(p)} className={cx("h-11 rounded-xl border text-sm font-semibold", completion === p ? "border-primary bg-primary text-on-primary" : "border-border")}>{p}%</button>
              ))}
            </div>
          </fieldset>
          <div className="grid grid-cols-2 gap-2">
            <label className="block"><span className="mb-1 block text-sm font-medium">{tt("focus.attempted")}</span><input type="number" min={0} max={2000} inputMode="numeric" className={inputClass} value={attempted} onChange={(e) => setAttempted(Math.max(0, Number(e.target.value)))} /></label>
            <label className="block"><span className="mb-1 block text-sm font-medium">{tt("focus.correct")}</span><input type="number" min={0} max={attempted} inputMode="numeric" className={inputClass} value={correct} onChange={(e) => setCorrect(Math.max(0, Number(e.target.value)))} /></label>
          </div>
          <Rating label={tt("focus.difficulty")} value={difficulty} onChange={setDifficulty} low="1" high="5" />
          <Rating label={tt("focus.focusRating")} value={focus} onChange={setFocus} low="1" high="5" />
          <Rating label={tt("focus.energy")} value={energy} onChange={setEnergy} low="1" high="5" />
          {task?.type === "REVISION" && (
            <fieldset>
              <legend className="mb-1 text-sm font-medium">{tt("focus.recall")}</legend>
              <div className="grid grid-cols-4 gap-1.5">
                {[[1, "Forgot"], [2, "Hard"], [3, "Good"], [4, "Easy"]].map(([v, l]) => (
                  <button key={v} type="button" aria-pressed={recall === v} onClick={() => setRecall(v as number)} className={cx("h-11 rounded-xl border text-sm font-semibold", recall === v ? "border-primary bg-primary text-on-primary" : "border-border")}>{l}</button>
                ))}
              </div>
              <p className="mt-1 text-xs text-muted">Topics you forget come back sooner; easy ones are spaced further apart.</p>
            </fieldset>
          )}
          {task?.topicId && task.type !== "REVISION" && (
            <label className="flex items-center gap-3 text-sm"><input type="checkbox" className="h-5 w-5 accent-[var(--primary)]" checked={topicDone} onChange={(e) => setTopicDone(e.target.checked)} /> I&apos;ve finished learning {task.topicName} (start spaced revision)</label>
          )}
          {error && <Alert tone="danger">{error}</Alert>}
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => { t.resume(); setStage("running"); }}>{tt("focus.backToTimer")}</Button>
            <Button className="flex-1" onClick={submit} disabled={busy}>{busy ? tt("focus.saving") : tt("focus.saveSession")}</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-4 px-4 py-10 text-center">
      <p className="text-5xl">✅</p>
      <h1 className="text-2xl font-bold">{tt("focus.saved")}</h1>
      {queued && <Alert tone="warning">You&apos;re offline. This session is saved on your device and will sync automatically.</Alert>}
      {result && (
        <Card className="space-y-3 text-left">
          <p className="text-sm">{result.message}</p>
          {result.xp.length > 0 ? (
            <div className="flex flex-wrap gap-2">{result.xp.map((x) => <Badge key={x.type} tone="success">+{x.amount} XP · {x.reason}</Badge>)}</div>
          ) : (
            <p className="text-xs text-muted">{tt("focus.noXp")}</p>
          )}
          {result.achievements.map((a) => <Alert key={a.name} tone="success" title={`${a.icon} Badge unlocked: ${a.name}`}>Keep it up.</Alert>)}
          {result.pathwayMessage && <p className="text-sm"><b>Weak-topic recovery:</b> {result.pathwayMessage}</p>}
          {result.weakFlagged.length > 0 && <p className="text-sm text-warning">Now flagged as weak: {result.weakFlagged.join(", ")}. A recovery pathway has been added to your plan.</p>}
          {result.flags.length > 0 && <details className="text-xs text-muted"><summary>Adjustments made to this session</summary><ul className="list-inside list-disc">{result.flags.map((f) => <li key={f}>{f}</li>)}</ul></details>}
        </Card>
      )}
      <div className="flex justify-center gap-2">
        <Link href="/" className="inline-flex min-h-11 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-on-primary">Home</Link>
        <Link href="/plan" className="inline-flex min-h-11 items-center rounded-xl border border-border px-4 text-sm font-semibold">Plan</Link>
      </div>
    </div>
  );
}
