"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, apiFetch, newClientId, sendOrQueue } from "@/lib/client/api";
import { fmtClock } from "@/lib/client/timer-store";
import { paperMs, usePaper } from "@/lib/client/paper-store";
import { useLang, useT } from "@/i18n/client";
import type { PaperView } from "@/server/services/paper.service";
import { Alert, Badge, Button, Card, CardTitle, cx, EmptyState, inputClass, PageHeader, Provenance, Stat } from "./ui";
import { PauseIcon, PlayIcon } from "./icons";
import { TrendChart } from "./charts";
import { ShayariCard } from "./Shayari";

type Records = { count: number; bestPercent: number | null; fastestOnTime: PaperView | null; totalMinutes: number };
const DURATIONS = [30, 45, 60, 90, 120, 180];
const WARN_AT = [10, 5, 1];

/** Short beep + vibration for time alerts. Silent if the browser blocks audio. */
function alertBeep(times = 1) {
  try {
    navigator.vibrate?.(times > 1 ? [300, 150, 300] : 300);
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    for (let i = 0; i < times; i++) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = 880;
      g.gain.value = 0.15;
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + i * 0.35);
      o.stop(ctx.currentTime + i * 0.35 + 0.2);
    }
    setTimeout(() => ctx.close().catch(() => undefined), 1500);
  } catch {
    /* no audio */
  }
}

function Ring({ value, children }: { value: number; children: React.ReactNode }) {
  const r = 120;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid h-72 w-72 place-items-center sm:h-80 sm:w-80">
      <svg viewBox="0 0 260 260" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden>
        <defs><linearGradient id="paperRing" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#3b55e6" /><stop offset="1" stopColor="#8b4fe6" /></linearGradient></defs>
        <circle cx="130" cy="130" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="14" />
        <circle cx="130" cy="130" r={r} fill="none" stroke={value >= 1 ? "var(--warning)" : "url(#paperRing)"} strokeWidth="14" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(1, value))} style={{ transition: "stroke-dashoffset 0.5s linear" }} />
      </svg>
      <div className="relative text-center">{children}</div>
    </div>
  );
}

export function PaperTimer({ examName, examMinutes, papers, records }: { examName: string; examMinutes: number; papers: PaperView[]; records: Records }) {
  const t = useT();
  const lang = useLang();
  const router = useRouter();
  const p = usePaper();
  const [now, setNow] = useState(0);
  const [stage, setStage] = useState<"setup" | "running" | "finish" | "done">("setup");
  const [title, setTitle] = useState(`${examName} ${t("paper.mock")}`);
  const [minutes, setMinutes] = useState(examMinutes || 60);
  const [questions, setQuestions] = useState("");
  const [attempted, setAttempted] = useState("");
  const [marks, setMarks] = useState("");
  const [totalMarks, setTotalMarks] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState<{ paper: PaperView | null; xp: { amount: number }[]; queued: boolean } | null>(null);
  const wakeLock = useRef<{ release: () => Promise<void> } | null>(null);

  // Resume a paper that was running before a reload (state lives in localStorage, readable only after mount).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (usePaper.getState().phase !== "idle") setStage("running");
  }, []);

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

  useEffect(() => {
    const nav = navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> } };
    if (stage === "running" && nav.wakeLock) nav.wakeLock.request("screen").then((l) => (wakeLock.current = l)).catch(() => undefined);
    return () => {
      wakeLock.current?.release().catch(() => undefined);
      wakeLock.current = null;
    };
  }, [stage]);

  const elapsed = now ? paperMs(p, now) : p.accumulated;
  const planned = p.plannedMinutes * 60_000;
  const remaining = planned - elapsed;

  // Time alerts at 10, 5 and 1 minute left, and when time is up.
  useEffect(() => {
    if (stage !== "running" || p.phase !== "running" || !now) return;
    for (const m of [...WARN_AT, 0]) {
      if (remaining <= m * 60_000 && !p.warned.includes(m) && planned > m * 60_000) {
        p.markWarned(m);
        alertBeep(m === 0 ? 3 : 1);
        break;
      }
    }
  }, [now, stage, remaining, planned, p]);

  function start() {
    const q = Number(questions);
    p.start({ clientId: newClientId(), title: title.trim() || t("paper.mock"), plannedMinutes: minutes, totalQuestions: questions && q > 0 ? Math.round(q) : null });
    setError(null);
    setStage("running");
  }

  function finish() {
    if (p.phase === "running") p.pause();
    if (p.totalQuestions) setAttempted(String(p.totalQuestions));
    setStage("finish");
  }

  async function save() {
    const st = usePaper.getState();
    const n = (v: string) => (v.trim() === "" ? null : Number(v));
    const payload = {
      action: "save",
      paper: {
        clientId: st.clientId,
        title: st.title,
        plannedMinutes: st.plannedMinutes,
        activeSeconds: Math.round(paperMs(st) / 1000),
        pauseCount: st.pauseCount,
        laps: st.laps,
        totalQuestions: st.totalQuestions,
        attempted: n(attempted),
        marksObtained: n(marks),
        totalMarks: n(totalMarks),
        note,
        startedAt: new Date(st.startedAt ?? Date.now()).toISOString(),
        endedAt: new Date().toISOString(),
      },
    };
    setBusy(true);
    setError(null);
    try {
      const res = await sendOrQueue<{ paper: PaperView; xp: { amount: number }[] }>("/api/v1/papers", payload);
      st.reset();
      setSaved(res ? { ...res, queued: false } : { paper: null, xp: [], queued: true });
      setStage("done");
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("paper.saveError"));
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm(t("paper.deleteConfirm"))) return;
    await apiFetch("/api/v1/papers", { body: { action: "delete", id } }).catch(() => undefined);
    router.refresh();
  }

  function discard() {
    if (!window.confirm(t("paper.discardConfirm"))) return;
    p.reset();
    setStage("setup");
  }

  // ── Running ──
  if (stage === "running") {
    const over = remaining < 0;
    const perQ = p.totalQuestions ? planned / p.totalQuestions : 0;
    const shouldBeAt = p.totalQuestions ? Math.min(p.totalQuestions, Math.floor(elapsed / perQ) + 1) : 0;
    const lastLap = p.laps.length ? p.laps[p.laps.length - 1] * 1000 : 0;
    return (
      <div className="flex min-h-[80dvh] flex-col items-center justify-between gap-6 py-4 text-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">{p.phase === "paused" ? t("focus.paused") : t("paper.running")}</p>
          <p className="mt-1 max-w-md text-lg font-semibold">{p.title}</p>
          <p className="text-sm text-muted">{t("paper.planned")}: {p.plannedMinutes} {t("common.min")}{p.totalQuestions ? ` · ${p.totalQuestions} ${t("common.questions")}` : ""}</p>
        </div>
        <Ring value={planned > 0 ? elapsed / planned : 0}>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">{over ? t("paper.overtime") : t("paper.left")}</p>
          <p className={cx("tabular text-6xl font-bold sm:text-7xl", over ? "text-warning" : p.phase === "running" && "text-grad")} role="timer" aria-live="off">{over ? `+${fmtClock(-remaining)}` : fmtClock(remaining)}</p>
          <p className="mt-1 text-sm text-muted">{t("paper.elapsed")} {fmtClock(elapsed)}</p>
        </Ring>
        <div aria-live="polite" className="space-y-1 text-sm">
          {over && <p className="font-semibold text-warning">⏰ {t("paper.timeUp")}</p>}
          {!over && remaining <= 5 * 60_000 && <p className="font-semibold text-warning">{t("paper.lastMinutes")}</p>}
          {p.totalQuestions ? <p>🎯 {t("paper.pace", { q: shouldBeAt, s: Math.round(perQ / 1000) })}</p> : null}
          {p.laps.length > 0 && <p className="text-muted">{t("paper.sectionsDone", { n: p.laps.length })} · {t("paper.thisSection")} {fmtClock(elapsed - lastLap)}</p>}
        </div>
        <div className="w-full max-w-md space-y-2">
          <div className="grid grid-cols-2 gap-2">
            {p.phase === "running" ? (
              <Button variant="secondary" onClick={p.pause}><PauseIcon width={18} height={18} /> {t("focus.pause")}</Button>
            ) : (
              <Button onClick={p.resume}><PlayIcon width={18} height={18} /> {t("focus.continue")}</Button>
            )}
            <Button variant="secondary" onClick={p.lap} disabled={p.phase !== "running" || p.laps.length >= 20}>✅ {t("paper.lap")}</Button>
          </div>
          <Button variant="danger" className="w-full" onClick={finish}>{t("paper.finish")}</Button>
          <div className="flex justify-between text-xs">
            <button type="button" className="text-muted underline" onClick={() => document.documentElement.requestFullscreen?.().catch(() => undefined)}>{t("focus.fullscreen")}</button>
            <button type="button" className="text-muted underline" onClick={discard}>{t("paper.discard")}</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Enter result ──
  if (stage === "finish") {
    const took = Math.round(paperMs(p) / 60_000);
    return (
      <div className="mx-auto max-w-lg space-y-4">
        <PageHeader title={t("paper.resultTitle")} subtitle={p.title} />
        <Card className="space-y-4">
          <div className="grid grid-cols-2 gap-2 text-center">
            <Stat label={t("paper.planned")} value={`${p.plannedMinutes} ${t("common.min")}`} />
            <Stat label={t("paper.took")} value={`${took} ${t("common.min")}`} sub={took <= p.plannedMinutes ? t("paper.inTime") : t("paper.overBy", { n: took - p.plannedMinutes })} />
          </div>
          {p.laps.length > 0 && (
            <ul className="text-sm">
              {p.laps.map((s, i) => <li key={i} className="flex justify-between border-b border-border py-1"><span>{t("paper.section")} {i + 1}</span><span className="tabular">{fmtClock((s - (p.laps[i - 1] ?? 0)) * 1000)}</span></li>)}
            </ul>
          )}
          <p className="text-sm text-muted">{t("paper.optionalScore")}</p>
          <div className="grid grid-cols-3 gap-2">
            <label className="block"><span className="mb-1 block text-xs font-medium">{t("paper.attempted")}</span><input type="number" inputMode="numeric" min={0} className={inputClass} value={attempted} onChange={(e) => setAttempted(e.target.value)} /></label>
            <label className="block"><span className="mb-1 block text-xs font-medium">{t("paper.marks")}</span><input type="number" inputMode="decimal" step="0.25" className={inputClass} value={marks} onChange={(e) => setMarks(e.target.value)} /></label>
            <label className="block"><span className="mb-1 block text-xs font-medium">{t("paper.outOf")}</span><input type="number" inputMode="decimal" min={1} className={inputClass} value={totalMarks} onChange={(e) => setTotalMarks(e.target.value)} /></label>
          </div>
          <textarea className={cx(inputClass, "min-h-20 py-2")} placeholder={t("paper.notePh")} value={note} maxLength={1000} onChange={(e) => setNote(e.target.value)} />
          {error && <Alert tone="danger">{error}</Alert>}
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => { p.resume(); setStage("running"); }}>{t("focus.backToTimer")}</Button>
            <Button className="flex-1" onClick={save} disabled={busy}>{busy ? t("focus.saving") : t("paper.save")}</Button>
          </div>
        </Card>
      </div>
    );
  }

  // ── Saved ──
  if (stage === "done" && saved) {
    const sp = saved.paper;
    return (
      <div className="mx-auto max-w-lg space-y-4 text-center">
        <p className="animate-pop pt-4 text-6xl">🏁</p>
        <h1 className="text-2xl font-bold">{t("paper.saved")}</h1>
        {saved.queued && <Alert tone="warning">{t("paper.queued")}</Alert>}
        {sp && (
          <Card className="grid grid-cols-2 gap-2 text-left">
            <Stat label={t("paper.took")} value={fmtClock(sp.activeSeconds * 1000)} sub={`${t("paper.planned")} ${sp.plannedMinutes} ${t("common.min")}`} />
            <Stat label={t("paper.score")} value={sp.percent === null ? "–" : `${sp.percent}%`} sub={sp.marksObtained !== null && sp.totalMarks ? `${sp.marksObtained}/${sp.totalMarks}` : t("paper.notEntered")} />
            {saved.xp.length > 0 && <div className="col-span-2"><Badge tone="success">+{saved.xp.reduce((s, x) => s + x.amount, 0)} XP</Badge></div>}
          </Card>
        )}
        <ShayariCard />
        <Button onClick={() => { setSaved(null); setStage("setup"); }}>{t("paper.another")}</Button>
      </div>
    );
  }

  // ── Setup + history ──
  const scored = [...papers].reverse().filter((x) => x.percent !== null);
  return (
    <div className="space-y-4">
      <PageHeader title={t("paper.title")} subtitle={t("paper.subtitle")} />
      <Card className="space-y-4">
        <label className="block"><span className="mb-1 block text-sm font-medium">{t("paper.name")}</span><input className={inputClass} value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} /></label>
        <div className="flex flex-wrap gap-1.5">
          {[t("paper.mock"), t("paper.pyq"), t("paper.sectional"), t("paper.chapter")].map((x) => (
            <button key={x} type="button" onClick={() => setTitle(`${examName} ${x}`)} className="rounded-full border border-border px-3 py-1 text-xs font-semibold">{x}</button>
          ))}
        </div>
        <fieldset>
          <legend className="mb-1 text-sm font-medium">{t("paper.duration")}</legend>
          <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
            {[...new Set([...DURATIONS, examMinutes].filter((d) => d > 0))].sort((a, b) => a - b).map((d) => (
              <button key={d} type="button" aria-pressed={minutes === d} onClick={() => setMinutes(d)} className={cx("h-11 rounded-xl border text-sm font-semibold", minutes === d ? "border-primary bg-primary text-on-primary" : "border-border")}>{d} {t("common.min")}</button>
            ))}
          </div>
          <input type="number" min={5} max={360} className={cx(inputClass, "mt-2")} value={minutes} onChange={(e) => setMinutes(Math.max(5, Math.min(360, Number(e.target.value) || 5)))} aria-label={t("paper.duration")} />
        </fieldset>
        <label className="block"><span className="mb-1 block text-sm font-medium">{t("paper.questions")} <span className="text-muted">({t("common.optional")})</span></span><input type="number" min={1} max={1000} inputMode="numeric" className={inputClass} placeholder={t("paper.questionsPh")} value={questions} onChange={(e) => setQuestions(e.target.value)} /></label>
        <p className="text-xs text-muted">{t("paper.tip")}</p>
        <Button className="w-full" onClick={start}><PlayIcon width={18} height={18} /> {t("paper.start")}</Button>
      </Card>

      <Card>
        <CardTitle eyebrow={<Provenance kind="self-reported" />}>{t("paper.history")}</CardTitle>
        <div className="mb-3 grid grid-cols-3 gap-2">
          <Stat label={t("paper.count")} value={records.count} />
          <Stat label={t("paper.best")} value={records.bestPercent === null ? "–" : `${records.bestPercent}%`} />
          <Stat label={t("paper.totalTime")} value={`${Math.round(records.totalMinutes / 6) / 10} h`} />
        </div>
        {scored.length >= 2 && <TrendChart data={scored.map((x) => ({ label: new Date(x.endedAt).toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", { day: "numeric", month: "short" }), value: x.percent, name: x.title }))} unit="%" label={t("paper.score")} height={160} />}
        {papers.length === 0 ? <EmptyState title={t("paper.emptyTitle")}>{t("paper.emptyText")}</EmptyState> : (
          <ul className="mt-2 divide-y divide-border">
            {papers.map((x) => (
              <li key={x.id} className="flex items-center justify-between gap-2 py-2.5 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{x.title}</p>
                  <p className="text-xs text-muted">{new Date(x.endedAt).toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", { day: "numeric", month: "short" })} · {fmtClock(x.activeSeconds * 1000)} / {x.plannedMinutes} {t("common.min")}{x.laps.length ? ` · ${x.laps.length} ${t("paper.sectionsShort")}` : ""}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {x.percent !== null ? <Badge tone={x.percent >= 60 ? "success" : "neutral"}>{x.percent}%</Badge> : null}
                  {x.activeSeconds <= x.plannedMinutes * 60 ? <span title={t("paper.inTime")}>✅</span> : <span title={t("paper.overtime")}>⏰</span>}
                  <button type="button" onClick={() => remove(x.id)} className="text-xs text-muted underline" aria-label={t("paper.delete")}>✕</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
