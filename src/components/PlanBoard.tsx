"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DndContext, KeyboardSensor, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { apiFetch, ApiError } from "@/lib/client/api";
import { formatMinutes, toHHMM, toMinutes } from "@/lib/engine/dates";
import { Alert, Badge, Button, Card, CardTitle, cx, inputClass, PageHeader, Progress } from "./ui";
import { GripIcon, PlayIcon, PlusIcon, RefreshIcon } from "./icons";
import { useT } from "@/i18n/client";

type Task = {
  id: string; type: string; title: string; mockId: string | null; startTime: string | null; plannedMinutes: number; questionTarget: number; objective: string; status: string;
  reasons: string[]; source: string; isOptional: boolean; actualMinutes: number; completionPct: number; missedAction: string | null; missedReason: string | null;
};
type Plan = { date: string; planDay: { plannedMinutes: number; capacityMinutes: number; mode: string; notes: string[] } | null; tasks: Task[]; backlog: { id: string; title: string; date: string; action: string | null; reason: string | null; minutes: number; carryOn: string | null }[] };
type Week = { days: { date: string; focus: string[]; revisions: string[]; mockLikely: boolean }[]; note: string };

const TYPE: Record<string, { label: string; tone: "primary" | "success" | "warning" | "danger" | "neutral" }> = {
  STUDY: { label: "Learn", tone: "primary" }, PRACTICE: { label: "Practice", tone: "primary" }, REVISION: { label: "Revision", tone: "success" },
  MOCK: { label: "Mock", tone: "warning" }, MOCK_ANALYSIS: { label: "Analysis", tone: "warning" }, MISTAKE_REVIEW: { label: "Mistakes", tone: "danger" }, CUSTOM: { label: "Task", tone: "neutral" },
};
const STATUS: Record<string, string> = { DONE: "✓ Done", PARTIAL: "◐ Partly done", IN_PROGRESS: "● In progress", SKIPPED: "Skipped", MISSED: "Missed", PENDING: "" };
const ACTIONS: Record<string, string> = { RESCHEDULE: "Rescheduled", MERGE: "Merged", REDUCE: "Reduced", POSTPONE: "Postponed", OPTIONAL: "Optional" };

function Row({ t, onEdit, onSkip }: { t: Task; onEdit: () => void; onSkip: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: t.id, disabled: t.status !== "PENDING" });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const end = t.startTime ? toHHMM(toMinutes(t.startTime) + t.plannedMinutes) : null;
  const done = t.status === "DONE";
  const href = t.type === "MOCK" || t.type === "MOCK_ANALYSIS" ? "/tests" : `/study/session/${t.id}`;
  return (
    <li ref={setNodeRef} style={style} className={cx("rounded-xl border border-border bg-surface p-3", isDragging && "z-10 shadow-lg", (done || t.status === "SKIPPED") && "opacity-70")}>
      <div className="flex items-start gap-2">
        <button type="button" aria-label={`Reorder ${t.title}`} className={cx("mt-0.5 grid h-9 w-7 shrink-0 place-items-center rounded-lg text-muted", t.status === "PENDING" ? "cursor-grab hover:bg-surface-2" : "invisible")} {...attributes} {...listeners}>
          <GripIcon width={18} height={18} />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
            <span className="tabular font-semibold text-text">{t.startTime ? `${t.startTime}–${end}` : "Unscheduled"}</span>
            <Badge tone={TYPE[t.type]?.tone ?? "neutral"}>{TYPE[t.type]?.label ?? t.type}</Badge>
            {t.source === "CARRY_OVER" && <Badge>Carried over</Badge>}
            {t.source === "MANUAL" && <Badge>Added by you</Badge>}
            {t.isOptional && <Badge>Optional</Badge>}
            {STATUS[t.status] && <span className="font-medium">{STATUS[t.status]}</span>}
          </div>
          <p className={cx("mt-1 font-medium", t.status === "SKIPPED" && "line-through")}>{t.title}</p>
          <p className="text-xs text-muted">
            Plan {t.plannedMinutes} min{t.questionTarget ? ` · ${t.questionTarget} questions` : ""}
            {(t.actualMinutes > 0 || done) && <> · <b className="text-text">Actual {t.actualMinutes} min</b></>}
          </p>
          {t.reasons.length > 0 && (
            <details className="mt-1 text-xs">
              <summary className="cursor-pointer text-muted">Why scheduled</summary>
              <ul className="mt-1 list-inside list-disc text-muted">{t.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
            </details>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {!done && t.status !== "SKIPPED" && (
            <Link href={href} className="press bg-grad grid h-10 w-10 place-items-center rounded-xl" aria-label={`Start ${t.title}`}><PlayIcon width={18} height={18} /></Link>
          )}
          {t.status === "PENDING" && (
            <div className="flex gap-1">
              <button type="button" onClick={onEdit} className="rounded-lg px-2 py-1 text-xs font-medium text-primary hover:bg-primary-soft">Edit</button>
              <button type="button" onClick={onSkip} className="rounded-lg px-2 py-1 text-xs font-medium text-muted hover:bg-surface-2">Skip</button>
            </div>
          )}
          {t.status === "SKIPPED" && <button type="button" onClick={onSkip} className="rounded-lg px-2 py-1 text-xs font-medium text-primary hover:bg-primary-soft">Restore</button>}
        </div>
      </div>
    </li>
  );
}

export function PlanBoard({ initial, week, topics, capacity, recovery }: { initial: Plan; week: Week; topics: { id: string; name: string }[]; capacity: number; recovery: { on: boolean; manual: boolean } }) {
  const router = useRouter();
  const t = useT();
  const [plan, setPlan] = useState(initial);
  const [msg, setMsg] = useState<{ tone: "danger" | "warning" | "success"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [adding, setAdding] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const reload = async () => setPlan(await apiFetch<Plan>(`/api/v1/plan?date=${plan.date}`));
  const run = async (fn: () => Promise<unknown>, ok?: string) => {
    setBusy(true);
    setMsg(null);
    try {
      const r = (await fn()) as { warnings?: string[] } | undefined;
      await reload();
      if (r?.warnings?.length) setMsg({ tone: "warning", text: r.warnings[0] });
      else if (ok) setMsg({ tone: "success", text: ok });
      router.refresh();
    } catch (e) {
      setMsg({ tone: "danger", text: e instanceof ApiError ? e.message : "Something went wrong." });
      await reload().catch(() => undefined);
    } finally {
      setBusy(false);
    }
  };

  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const ids = plan.tasks.map((t) => t.id);
    const next = arrayMove(ids, ids.indexOf(String(e.active.id)), ids.indexOf(String(e.over.id)));
    setPlan({ ...plan, tasks: next.map((id) => plan.tasks.find((t) => t.id === id)!) });
    run(() => apiFetch("/api/v1/tasks", { method: "PUT", body: { date: plan.date, orderedIds: next } }), "Order updated and times re-planned.");
  };

  const active = plan.tasks.filter((t) => t.status !== "SKIPPED" && !t.isOptional);
  const planned = active.reduce((s, t) => s + t.plannedMinutes, 0);
  const actual = plan.tasks.reduce((s, t) => s + t.actualMinutes, 0);
  const pct = planned ? Math.min(100, Math.round((actual / planned) * 100)) : 0;

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("plan.title")}
        subtitle={`${new Date(`${plan.date}T12:00:00`).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })} · ${formatMinutes(planned)} planned of ${formatMinutes(capacity)} available`}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" disabled={busy} onClick={() => setAdding(true)}><PlusIcon width={18} height={18} /> {t("common.add")}</Button>
            <Button variant="secondary" disabled={busy} onClick={() => run(() => apiFetch("/api/v1/plan", { method: "POST", body: { action: "regenerate" } }), "Unstarted blocks re-planned from your latest data.")}><RefreshIcon width={18} height={18} /> {t("plan.replan")}</Button>
          </div>
        }
      />
      {msg && <Alert tone={msg.tone}>{msg.text}</Alert>}
      {plan.planDay?.mode === "RECOVERY" && <Alert tone="warning" title="Recovery mode is on">You are behind your original plan. We will not try to complete everything at once. Only high-value, weak and revision-due work is planned. It ends after 3 days at 70%+ completion.</Alert>}
      {(plan.planDay?.notes.length ?? 0) > 0 && (
        <Card className="bg-primary-soft">
          <p className="text-sm font-semibold">{t("plan.adapted")}</p>
          <ul className="mt-1 list-inside list-disc text-sm">{plan.planDay!.notes.filter((n) => !n.startsWith("You are behind")).map((n) => <li key={n}>{n}</li>)}</ul>
        </Card>
      )}

      <Card>
        <Progress value={pct} label={`Planned ${formatMinutes(planned)} · Actual ${formatMinutes(actual)}`} tone={pct >= 80 ? "success" : "primary"} />
      </Card>

      {plan.tasks.length === 0 ? (
        <Card><p className="text-sm text-muted">No tasks today. Use <b>Re-plan</b> to generate a plan, or <b>Add</b> your own task.</p></Card>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={plan.tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            <ol className="space-y-2" aria-label="Today's tasks. Drag pending tasks to reorder; times are re-planned automatically.">
              {plan.tasks.map((t) => (
                <Row key={t.id} t={t} onEdit={() => setEditing(t)} onSkip={() => run(() => apiFetch(`/api/v1/tasks/${t.id}`, { method: "PATCH", body: { status: t.status === "SKIPPED" ? "PENDING" : "SKIPPED" } }))} />
              ))}
            </ol>
          </SortableContext>
        </DndContext>
      )}

      {plan.backlog.length > 0 && (
        <Card>
          <CardTitle>{t("plan.unfinished")}</CardTitle>
          <ul className="divide-y divide-border">
            {plan.backlog.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{b.title}</p>
                  <p className="text-xs text-muted">From {b.date} · {b.minutes} min · {b.reason}</p>
                </div>
                <label className="flex items-center gap-2 text-xs">
                  <span className="sr-only">Action for {b.title}</span>
                  <select className="min-h-9 rounded-lg border border-border bg-surface px-2" value={b.action ?? ""} onChange={(e) => run(() => apiFetch(`/api/v1/tasks/${b.id}`, { method: "PATCH", body: { missedAction: e.target.value } }), "Updated.")}>
                    {Object.entries(ACTIONS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </label>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card>
        <CardTitle action={<Button variant="ghost" disabled={busy} onClick={() => run(() => apiFetch("/api/v1/plan", { method: "POST", body: { action: "recovery", on: !recovery.on } }), recovery.on ? "Recovery mode off." : "Recovery mode on: today is re-planned around essentials.")}>{recovery.on ? t("plan.turnOff") : t("plan.turnOn")}</Button>}>{t("plan.recovery")}</CardTitle>
        <p className="text-sm text-muted">{t("plan.recoveryHint")}</p>
      </Card>

      <Card>
        <CardTitle>{t("plan.comingDays")}</CardTitle>
        <p className="mb-3 text-xs text-muted">{week.note}</p>
        <ol className="grid gap-2 sm:grid-cols-2">
          {week.days.map((d) => (
            <li key={d.date} className="rounded-xl bg-surface-2 p-3">
              <p className="text-sm font-semibold">{new Date(`${d.date}T12:00:00`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })} {d.mockLikely && <Badge tone="warning">Mock likely</Badge>}</p>
              <ul className="mt-1 text-xs text-muted">{d.focus.map((f) => <li key={f}>• {f}</li>)}</ul>
              {d.revisions.length > 0 && <p className="mt-1 text-xs text-success">Revision: {d.revisions.join(", ")}</p>}
            </li>
          ))}
        </ol>
      </Card>

      {(editing || adding) && (
        <TaskDialog
          task={editing}
          topics={topics}
          busy={busy}
          onClose={() => { setEditing(null); setAdding(false); }}
          onSave={(body) => {
            const t = editing;
            setEditing(null);
            setAdding(false);
            run(() => (t ? apiFetch(`/api/v1/tasks/${t.id}`, { method: "PATCH", body }) : apiFetch("/api/v1/tasks", { method: "POST", body: { ...body, date: plan.date } })), t ? "Task updated." : "Task added.");
          }}
        />
      )}
    </div>
  );
}

function TaskDialog({ task, topics, busy, onClose, onSave }: { task: Task | null; topics: { id: string; name: string }[]; busy: boolean; onClose: () => void; onSave: (b: Record<string, unknown>) => void }) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [start, setStart] = useState(task?.startTime ?? "");
  const [minutes, setMinutes] = useState(task?.plannedMinutes ?? 45);
  const [questions, setQuestions] = useState(task?.questionTarget ?? 0);
  const [topicId, setTopicId] = useState("");
  return (
    <div role="dialog" aria-modal aria-label={task ? "Edit task" : "Add task"} className="fixed inset-0 z-50 grid place-items-end bg-black/40 sm:place-items-center" onClick={onClose}>
      <form
        className="w-full max-w-md space-y-3 rounded-t-2xl bg-surface p-5 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          onSave({ title, startTime: start || null, plannedMinutes: minutes, questionTarget: questions, ...(task ? {} : { type: topicId ? "PRACTICE" : "CUSTOM", topicId: topicId || null, objective: "" }) });
        }}
      >
        <h2 className="text-lg font-semibold">{task ? "Edit task" : "Add a task"}</h2>
        <label className="block"><span className="mb-1 block text-sm font-medium">Title</span><input required maxLength={120} className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} /></label>
        {!task && (
          <label className="block"><span className="mb-1 block text-sm font-medium">Topic <span className="text-muted">(optional)</span></span>
            <select className={inputClass} value={topicId} onChange={(e) => { setTopicId(e.target.value); if (!title) setTitle(topics.find((t) => t.id === e.target.value)?.name ?? ""); }}>
              <option value="">No topic</option>
              {topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </label>
        )}
        <div className="grid grid-cols-3 gap-2">
          <label className="block"><span className="mb-1 block text-sm font-medium">Start</span><input type="time" className={inputClass} value={start} onChange={(e) => setStart(e.target.value)} /></label>
          <label className="block"><span className="mb-1 block text-sm font-medium">Minutes</span><input type="number" min={5} max={240} className={inputClass} value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} /></label>
          <label className="block"><span className="mb-1 block text-sm font-medium">Questions</span><input type="number" min={0} max={500} className={inputClass} value={questions} onChange={(e) => setQuestions(Number(e.target.value))} /></label>
        </div>
        <p className="text-xs text-muted">Impossible schedules (overlaps, past midnight, far over your available time) are rejected with an explanation.</p>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={busy}>Save</Button>
        </div>
      </form>
    </div>
  );
}
