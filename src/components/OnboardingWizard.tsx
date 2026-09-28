"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/client/api";
import { formatMinutes } from "@/lib/engine/dates";
import { Alert, Badge, Button, Card, cx, inputClass, Progress, Provenance } from "./ui";
import { useT } from "@/i18n/client";

type NewSubject = { name: string; book: string; chapters: string };

/** "My exam/goal isn't listed": the student types their own subjects, book and chapters. */
function CustomSyllabusForm({ purpose, onCreated, onCancel }: { purpose: string; onCreated: (e: Exam) => void; onCancel: () => void }) {
  const t = useT();
  const [goal, setGoal] = useState("");
  const [subjects, setSubjects] = useState<NewSubject[]>([{ name: "", book: "", chapters: "" }]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const upd = (i: number, patch: Partial<NewSubject>) => setSubjects((xs) => xs.map((s, j) => (j === i ? { ...s, ...patch } : s)));

  async function create() {
    const clean = subjects.filter((s) => s.name.trim());
    if (!goal.trim()) return setError(t("ob.custom.needGoal"));
    if (!clean.length) return setError(t("ob.custom.needSubject"));
    setBusy(true);
    setError(null);
    try {
      const e = await apiFetch<Exam>("/api/v1/syllabus", {
        method: "POST",
        body: { action: "create", data: { name: goal.trim(), purpose, subjects: clean.map((s) => ({ name: s.name.trim(), book: s.book.trim() || null, chapters: s.chapters.split(/\r?\n/).map((c) => c.trim()).filter(Boolean) })) } },
      });
      onCreated(e);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 space-y-3 rounded-xl border border-primary/40 bg-primary-soft/40 p-3">
      <p className="text-sm font-semibold">{t("ob.custom.title")}</p>
      <label className="block"><span className="mb-1 block text-sm font-medium">{t("ob.custom.goal")}</span><input className={inputClass} maxLength={120} placeholder={t("ob.custom.goalPlaceholder")} value={goal} onChange={(e) => setGoal(e.target.value)} /></label>
      {subjects.map((s, i) => (
        <div key={i} className="space-y-2 rounded-xl bg-surface p-3">
          <div className="flex items-center justify-between"><span className="text-xs font-semibold text-muted">{t("ob.custom.subject")} {i + 1}</span>{subjects.length > 1 && <button type="button" className="text-xs text-danger" onClick={() => setSubjects((xs) => xs.filter((_, j) => j !== i))}>✕</button>}</div>
          <input className={inputClass} maxLength={120} placeholder={t("ob.custom.subjectPlaceholder")} value={s.name} onChange={(e) => upd(i, { name: e.target.value })} aria-label={`${t("ob.custom.subject")} ${i + 1}`} />
          <input className={inputClass} maxLength={120} placeholder={t("ob.custom.bookPlaceholder")} value={s.book} onChange={(e) => upd(i, { book: e.target.value })} aria-label={t("ob.custom.book")} />
          <textarea className={cx(inputClass, "min-h-24 py-2")} placeholder={t("ob.custom.chaptersPlaceholder")} value={s.chapters} onChange={(e) => upd(i, { chapters: e.target.value })} aria-label={t("ob.custom.chapters")} />
        </div>
      ))}
      <button type="button" className="text-sm font-semibold text-primary" onClick={() => setSubjects((xs) => [...xs, { name: "", book: "", chapters: "" }])}>➕ {t("ob.custom.addSubject")}</button>
      <p className="text-xs text-muted">{t("ob.custom.later")}</p>
      {error && <Alert tone="danger">{error}</Alert>}
      <div className="flex gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>{t("common.cancel")}</Button>
        <Button type="button" onClick={create} disabled={busy}>{busy ? t("focus.saving") : t("ob.custom.create")}</Button>
      </div>
    </div>
  );
}

type Exam = {
  id: string; name: string; shortName: string; category: string; description: string; durationMinutes: number; totalQuestions: number;
  subjects: { id: string; name: string; topics: { id: string; name: string; weightage: number }[] }[];
};
type Status = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
type Baseline = {
  daysLeft: number; topicsTotal: number; topicsCompleted: number; topicsInProgress: number; coveragePct: number; remainingStudyHours: number;
  recommendedDailyMinutes: number; availableDailyMinutes: number; feasibility: string; feasibilityNote: string;
  subjectDistribution: { subject: string; sharePct: number; minutesPerWeek: number; selfReported: string | null }[];
  selfReportedMockAvg: number | null; revisionScheduled: number;
};

const STEPS = ["About you", "Your exam", "Time & level", "Goals", "Syllabus status", "Strengths", "Preferences"];
const SLOTS = [
  { v: "MORNING", l: "Morning", s: "6:30–12:00" },
  { v: "AFTERNOON", l: "Afternoon", s: "13:30–17:00" },
  { v: "EVENING", l: "Evening", s: "18:00–21:00" },
  { v: "NIGHT", l: "Night", s: "21:00–23:30" },
];
const addMonths = (m: number) => {
  const d = new Date();
  d.setMonth(d.getMonth() + m);
  return d.toISOString().slice(0, 10);
};

function Chip({ on, onClick, children, label }: { on: boolean; onClick: () => void; children: React.ReactNode; label?: string }) {
  return (
    <button type="button" aria-pressed={on} aria-label={label} onClick={onClick} className={cx("min-h-11 rounded-xl border px-3 text-sm font-medium", on ? "border-primary bg-primary-soft text-primary" : "border-border bg-surface hover:bg-surface-2")}>
      {children}
    </button>
  );
}

export function OnboardingWizard({ exams: initialExams, defaultName, changing = false, current = null }: { exams: Exam[]; defaultName: string; changing?: boolean; current?: { examId: string; examDate: string; dailyMinutes: number } | null }) {
  const t = useT();
  const [exams, setExams] = useState<Exam[]>(initialExams);
  const [purpose, setPurpose] = useState<"EXAM" | "SCHOOL" | "SELF" | "SKILL">("EXAM");
  const [showCustom, setShowCustom] = useState(false);
  const router = useRouter();
  const [step, setStep] = useState(changing ? 1 : 0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ baseline: Baseline; readiness: { score: number; confidence: string } } | null>(null);

  const [name, setName] = useState(defaultName);
  const [ageRange, setAgeRange] = useState<string | null>(null);
  // When changing exams, nothing is preselected so a real choice is made.
  const [examId, setExamId] = useState(changing ? "" : exams[0]?.id ?? "");
  const [examDate, setExamDate] = useState(current?.examDate ?? addMonths(3));
  const [targetScore, setTargetScore] = useState("");
  const [prepLevel, setPrepLevel] = useState("BEGINNER");
  const [dailyMinutes, setDailyMinutes] = useState(current?.dailyMinutes ?? 180);
  const [slots, setSlots] = useState<string[]>(["MORNING", "EVENING"]);
  const [dailyGoal, setDailyGoal] = useState<number | null>(null);
  const [weeklyGoal, setWeeklyGoal] = useState<number | null>(null);
  const [status, setStatus] = useState<Record<string, Status>>({});
  const [weak, setWeak] = useState<string[]>([]);
  const [strong, setStrong] = useState<string[]>([]);
  const [mocks, setMocks] = useState("");
  const [language, setLanguage] = useState("en");
  const [notifications, setNotifications] = useState(true);
  const [benchmark, setBenchmark] = useState(true);

  const exam = useMemo(() => exams.find((e) => e.id === examId), [exams, examId]);
  const toggle = (xs: string[], v: string) => (xs.includes(v) ? xs.filter((x) => x !== v) : [...xs, v]);
  const cycle = (id: string) => setStatus((s) => ({ ...s, [id]: s[id] === "COMPLETED" ? "NOT_STARTED" : s[id] === "IN_PROGRESS" ? "COMPLETED" : "IN_PROGRESS" }));

  function validate(): string | null {
    if (step === 0 && !name.trim()) return "Please enter your name.";
    if (step === 1) {
      if (!examId) return "Please choose an exam.";
      if (!examDate || examDate <= new Date().toISOString().slice(0, 10)) return "The exam date must be in the future.";
    }
    if (step === 2 && slots.length === 0) return "Pick at least one study time.";
    return null;
  }

  function next() {
    const v = validate();
    if (v) return setError(v);
    setError(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  async function finish() {
    setBusy(true);
    setError(null);
    try {
      const res = await apiFetch<{ baseline: Baseline; readiness: { score: number; confidence: string } }>("/api/v1/onboarding", {
        method: "POST",
        body: {
          name, ageRange, examId, examDate, purpose, targetScore: targetScore ? Number(targetScore) : null, prepLevel, dailyMinutes, preferredSlots: slots,
          dailyGoalMinutes: dailyGoal ?? dailyMinutes, weeklyGoalMinutes: weeklyGoal ?? dailyMinutes * 7,
          completedTopicIds: Object.entries(status).filter(([, s]) => s === "COMPLETED").map(([id]) => id),
          inProgressTopicIds: Object.entries(status).filter(([, s]) => s === "IN_PROGRESS").map(([id]) => id),
          weakSubjectIds: weak, strongSubjectIds: strong,
          previousMockScores: mocks.split(/[ ,]+/).filter((s) => s.trim() !== "").map(Number).filter((n) => Number.isFinite(n) && n >= 0 && n <= 100).slice(0, 10),
          language, notifications, benchmarkOptIn: benchmark, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      });
      setResult(res);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn't save. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (result) {
    const b = result.baseline;
    const tone = b.feasibility === "COMFORTABLE" ? "success" : b.feasibility === "TIGHT" ? "warning" : "danger";
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Your preparation baseline</h1>
        <Card>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div><p className="text-xs text-muted">Days left</p><p className="tabular text-xl font-semibold">{b.daysLeft}</p></div>
            <div><p className="text-xs text-muted">Syllabus covered</p><p className="tabular text-xl font-semibold">{b.coveragePct}%</p></div>
            <div><p className="text-xs text-muted">Study time remaining</p><p className="tabular text-xl font-semibold">~{b.remainingStudyHours}h</p></div>
            <div><p className="text-xs text-muted">Readiness (initial)</p><p className="tabular text-xl font-semibold">{result.readiness.score}<span className="text-sm text-muted">/100</span></p></div>
          </div>
          <p className="mt-3 text-xs text-muted">Readiness starts with <b>low confidence</b>: it&apos;s an estimate from very little data. It becomes more reliable as you keep studying. It is not a probability of selection.</p>
        </Card>
        <Card>
          <div className="mb-2 flex items-center gap-2"><h2 className="font-semibold">Recommended daily study</h2><Provenance kind="estimate" /></div>
          <p className="text-3xl font-bold tabular">{formatMinutes(b.recommendedDailyMinutes)}</p>
          <p className="text-sm text-muted">You have {formatMinutes(b.availableDailyMinutes)} available.</p>
          <div className="mt-2"><Badge tone={tone}>{b.feasibility.toLowerCase()}</Badge></div>
          <p className="mt-2 text-sm">{b.feasibilityNote}</p>
        </Card>
        <Card>
          <h2 className="mb-3 font-semibold">Initial weekly subject distribution</h2>
          <div className="space-y-3">
            {b.subjectDistribution.map((s) => (
              <div key={s.subject}>
                <Progress value={s.sharePct} label={`${s.subject}: ${formatMinutes(s.minutesPerWeek)}/week${s.selfReported ? ` (you said ${s.selfReported.toLowerCase()})` : ""}`} />
              </div>
            ))}
          </div>
          {b.revisionScheduled > 0 && <p className="mt-3 text-sm text-muted">{b.revisionScheduled} completed topic{b.revisionScheduled === 1 ? " has" : "s have"} been scheduled for spaced revision over the next week.</p>}
          {b.selfReportedMockAvg !== null && <p className="mt-1 text-sm text-muted">Your past mock average ({b.selfReportedMockAvg}%) is recorded as self-reported. Time your next papers with the ⏱ Paper timer to track them.</p>}
        </Card>
        <Button className="w-full" onClick={() => { router.push("/"); router.refresh(); }}>Show today&apos;s plan →</Button>
      </div>
    );
  }

  const optional = step >= 3 && step <= 5;
  return (
    <div>
      {changing && (
        <div className="mb-4">
          <Alert tone="warning" title="Changing your exam">
            Choose the exam you&apos;re preparing for now. Your plan, goals, revision schedule and readiness will be rebuilt for it. Your study history, XP and badges stay.{" "}
            <a href="/profile" className="font-semibold underline">Cancel</a>
          </Alert>
        </div>
      )}
      <div className="mb-4">
        <p className="text-sm text-muted">Step {step + 1} of {STEPS.length}</p>
        <h1 className="text-2xl font-bold">{STEPS[step]}</h1>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2"><div className="h-full bg-primary transition-all" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} /></div>
      </div>
      {error && <div className="mb-3"><Alert tone="danger">{error}</Alert></div>}
      <Card>
        {step === 0 && (
          <div className="space-y-4">
            <label className="block"><span className="mb-1 block text-sm font-medium">Name</span><input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} maxLength={80} /></label>
            <fieldset>
              <legend className="mb-2 text-sm font-medium">Age range <span className="text-muted">(optional)</span></legend>
              <div className="flex flex-wrap gap-2">
                {[["UNDER_18", "Under 18"], ["18_21", "18–21"], ["22_25", "22–25"], ["26_30", "26–30"], ["30_PLUS", "30+"]].map(([v, l]) => <Chip key={v} on={ageRange === v} onClick={() => setAgeRange(ageRange === v ? null : v)}>{l}</Chip>)}
              </div>
            </fieldset>
          </div>
        )}
        {step === 1 && (
          <div className="space-y-4">
            <fieldset>
              <legend className="mb-2 text-sm font-medium">{t("ob.purpose")}</legend>
              <div className="grid grid-cols-2 gap-2">
                {(["EXAM", "SCHOOL", "SELF", "SKILL"] as const).map((p) => (
                  <Chip key={p} on={purpose === p} onClick={() => { setPurpose(p); if (p !== "EXAM") setShowCustom(true); }}>{t(`ob.purpose.${p}`)}</Chip>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="mb-2 text-sm font-medium">{purpose === "EXAM" ? t("ob.pickExam") : t("ob.pickGoal")}</legend>
              <div className="grid gap-2">
                {exams.filter((e) => purpose === "EXAM" || (e as { custom?: boolean }).custom).map((e) => (
                  <button key={e.id} type="button" aria-pressed={examId === e.id} onClick={() => { setExamId(e.id); setStatus({}); setWeak([]); setStrong([]); }} className={cx("rounded-xl border p-3 text-left", examId === e.id ? "border-primary bg-primary-soft" : "border-border hover:bg-surface-2")}>
                    <p className="font-semibold">{e.name}</p>
                    <p className="text-xs text-muted">{e.description}</p>
                  </button>
                ))}
              </div>
              {!showCustom ? (
                <button type="button" onClick={() => setShowCustom(true)} className="mt-2 w-full rounded-xl border-2 border-dashed border-primary/50 p-3 text-left text-sm font-semibold text-primary hover:bg-primary-soft">
                  ➕ {t("ob.notListed")}
                  <span className="block text-xs font-normal text-muted">{t("ob.notListedHint")}</span>
                </button>
              ) : (
                <CustomSyllabusForm
                  purpose={purpose}
                  onCancel={() => setShowCustom(false)}
                  onCreated={(created) => {
                    setExams((xs) => [...xs, created]);
                    setExamId(created.id);
                    setStatus({});
                    setWeak([]);
                    setStrong([]);
                    setShowCustom(false);
                  }}
                />
              )}
            </fieldset>
            <label className="block"><span className="mb-1 block text-sm font-medium">{purpose === "EXAM" ? t("ob.examDate") : t("ob.targetDate")}</span><input type="date" className={inputClass} value={examDate} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setExamDate(e.target.value)} /></label>
            <label className="block"><span className="mb-1 block text-sm font-medium">Target score <span className="text-muted">(optional)</span></span><input type="number" inputMode="numeric" min={0} className={inputClass} value={targetScore} onChange={(e) => setTargetScore(e.target.value)} /></label>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-5">
            <fieldset>
              <legend className="mb-2 text-sm font-medium">Current preparation level</legend>
              <div className="flex flex-wrap gap-2">{[["BEGINNER", "Just starting"], ["INTERMEDIATE", "Some preparation"], ["ADVANCED", "Mostly done, revising"]].map(([v, l]) => <Chip key={v} on={prepLevel === v} onClick={() => setPrepLevel(v)}>{l}</Chip>)}</div>
            </fieldset>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Time available per day: <b className="tabular">{formatMinutes(dailyMinutes)}</b></span>
              <input type="range" min={30} max={600} step={15} value={dailyMinutes} onChange={(e) => setDailyMinutes(Number(e.target.value))} className="w-full accent-[var(--primary)]" aria-valuetext={formatMinutes(dailyMinutes)} />
            </label>
            <fieldset>
              <legend className="mb-2 text-sm font-medium">Preferred study times</legend>
              <div className="grid grid-cols-2 gap-2">{SLOTS.map((s) => <Chip key={s.v} on={slots.includes(s.v)} onClick={() => setSlots(toggle(slots, s.v))}><span className="block">{s.l}</span><span className="block text-xs font-normal text-muted">{s.s}</span></Chip>)}</div>
            </fieldset>
          </div>
        )}
        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-muted">Defaults follow your available time. Goals cascade: exam → month → week → today.</p>
            <label className="block"><span className="mb-1 block text-sm font-medium">Daily study goal (minutes)</span><input type="number" min={15} max={720} className={inputClass} value={dailyGoal ?? dailyMinutes} onChange={(e) => setDailyGoal(Number(e.target.value))} /></label>
            <label className="block"><span className="mb-1 block text-sm font-medium">Weekly study goal (minutes)</span><input type="number" min={60} max={5040} className={inputClass} value={weeklyGoal ?? dailyMinutes * 7} onChange={(e) => setWeeklyGoal(Number(e.target.value))} /></label>
          </div>
        )}
        {step === 4 && exam && (
          <div className="space-y-4">
            <p className="text-sm text-muted">Tap a topic to mark it: <Badge>not started</Badge> → <Badge tone="primary">studying</Badge> → <Badge tone="success">completed</Badge>. Completed topics get a revision schedule.</p>
            {exam.subjects.map((s) => (
              <div key={s.id}>
                <h3 className="mb-2 text-sm font-semibold">{s.name}</h3>
                <div className="flex flex-wrap gap-2">
                  {s.topics.map((t) => {
                    const st = status[t.id] ?? "NOT_STARTED";
                    return (
                      <button key={t.id} type="button" onClick={() => cycle(t.id)} aria-label={`${t.name}: ${st.replace("_", " ").toLowerCase()}`} className={cx("min-h-10 rounded-lg border px-2.5 text-xs font-medium", st === "COMPLETED" ? "border-success bg-success-soft text-success" : st === "IN_PROGRESS" ? "border-primary bg-primary-soft text-primary" : "border-border")}>
                        {st === "COMPLETED" ? "✓ " : st === "IN_PROGRESS" ? "◐ " : ""}{t.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
        {step === 5 && exam && (
          <div className="space-y-5">
            <fieldset>
              <legend className="mb-2 text-sm font-medium">Weak subjects</legend>
              <div className="flex flex-wrap gap-2">{exam.subjects.map((s) => <Chip key={s.id} on={weak.includes(s.id)} onClick={() => { setWeak(toggle(weak, s.id)); setStrong(strong.filter((x) => x !== s.id)); }}>{s.name}</Chip>)}</div>
            </fieldset>
            <fieldset>
              <legend className="mb-2 text-sm font-medium">Strong subjects</legend>
              <div className="flex flex-wrap gap-2">{exam.subjects.map((s) => <Chip key={s.id} on={strong.includes(s.id)} onClick={() => { setStrong(toggle(strong, s.id)); setWeak(weak.filter((x) => x !== s.id)); }}>{s.name}</Chip>)}</div>
            </fieldset>
            <label className="block"><span className="mb-1 block text-sm font-medium">Previous mock scores in % <span className="text-muted">(optional, comma-separated)</span></span><input className={inputClass} placeholder="e.g. 52, 58, 61" value={mocks} onChange={(e) => setMocks(e.target.value)} /></label>
            <p className="text-xs text-muted">Self-reported strengths only shape your first plans. Measured accuracy replaces them as soon as you practise.</p>
          </div>
        )}
        {step === 6 && (
          <div className="space-y-4">
            <label className="block"><span className="mb-1 block text-sm font-medium">Preferred language</span>
              <select className={inputClass} value={language} onChange={(e) => setLanguage(e.target.value)}><option value="en">English</option><option value="hi">हिन्दी (Hindi): interface coming soon</option></select>
            </label>
            <label className="flex items-start gap-3"><input type="checkbox" className="mt-1 h-5 w-5 accent-[var(--primary)]" checked={notifications} onChange={(e) => setNotifications(e.target.checked)} /><span><b className="text-sm">Reminders</b><span className="block text-xs text-muted">Daily briefing, study and revision reminders. Max 4 per day, never during quiet hours (22:30–06:30). Fully adjustable later.</span></span></label>
            <label className="flex items-start gap-3"><input type="checkbox" className="mt-1 h-5 w-5 accent-[var(--primary)]" checked={benchmark} onChange={(e) => setBenchmark(e.target.checked)} /><span><b className="text-sm">Anonymous benchmarking</b><span className="block text-xs text-muted">Include my anonymized stats in aggregate benchmarks (only published for groups of 20+ students), and show me comparisons. No one can see your individual data. You can opt out any time.</span></span></label>
          </div>
        )}
      </Card>
      <div className="mt-4 flex items-center justify-between gap-2">
        <Button variant="secondary" onClick={() => { setError(null); setStep((s) => Math.max(0, s - 1)); }} disabled={step === 0 || busy}>Back</Button>
        <div className="flex gap-2">
          {optional && <Button variant="ghost" onClick={() => setStep((s) => s + 1)}>Skip</Button>}
          {step < STEPS.length - 1 ? <Button onClick={next}>Continue</Button> : <Button onClick={finish} disabled={busy}>{busy ? "Building your plan…" : "Build my plan"}</Button>}
        </div>
      </div>
    </div>
  );
}
