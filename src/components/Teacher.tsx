"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApiError, apiFetch } from "@/lib/client/api";
import { useLang, useT } from "@/i18n/client";
import type { ClassDashboard } from "@/server/services/classroom.service";
import { Alert, Badge, Button, Card, CardTitle, cx, EmptyState, inputClass, PageHeader, Provenance, Stat } from "./ui";

type ClassRow = { id: string; name: string; code: string; students: number };
type Student = ClassDashboard["students"][number];

const hm = (min: number) => (min >= 60 ? `${Math.floor(min / 60)}h ${min % 60 ? `${min % 60}m` : ""}`.trim() : `${min}m`);

function shareCode(code: string, className: string, text: string) {
  const link = `${window.location.origin}/join/${code}`;
  const full = `${text.replace("{name}", className).replace("{code}", code)}\n${link}`;
  const nav = navigator as Navigator & { share?: (d: { text: string }) => Promise<void> };
  if (nav.share) return void nav.share({ text: full }).catch(() => undefined);
  window.open(`https://wa.me/?text=${encodeURIComponent(full)}`, "_blank", "noopener");
}

// ───────────── Teacher: list of classes ─────────────

export function TeacherHome({ classes, teacherName }: { classes: ClassRow[]; teacherName: string }) {
  const t = useT();
  const router = useRouter();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    setBusy(true);
    setError(null);
    try {
      const c = await apiFetch<{ id: string }>("/api/v1/teacher", { body: { action: "create", name } });
      router.push(`/teacher/${c.id}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("teacher.error"));
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader title={t("teacher.title")} subtitle={t("teacher.hello", { name: teacherName.split(" ")[0] })} />
      <Card>
        <CardTitle>{t("teacher.howTitle")}</CardTitle>
        <ol className="list-inside list-decimal space-y-1.5 text-sm">
          <li>{t("teacher.how1")}</li>
          <li>{t("teacher.how2")}</li>
          <li>{t("teacher.how3")}</li>
        </ol>
        <p className="mt-2 text-xs text-muted">{t("teacher.privacy")}</p>
      </Card>

      <Card className="space-y-3">
        <CardTitle>{t("teacher.create")}</CardTitle>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input className={inputClass} value={name} maxLength={80} placeholder={t("teacher.namePh")} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && name.trim() && create()} aria-label={t("teacher.className")} />
          <Button onClick={create} disabled={busy || !name.trim()}>{busy ? "…" : t("teacher.createBtn")}</Button>
        </div>
        {error && <Alert tone="danger">{error}</Alert>}
      </Card>

      {classes.length === 0 ? (
        <EmptyState title={t("teacher.noClasses")}>{t("teacher.noClassesText")}</EmptyState>
      ) : (
        <ul className="stagger grid gap-3 sm:grid-cols-2">
          {classes.map((c) => (
            <li key={c.id}>
              <Link href={`/teacher/${c.id}`} className="lift block rounded-2xl border border-border bg-surface p-4">
                <p className="text-lg font-semibold">{c.name}</p>
                <p className="mt-1 text-sm text-muted">{t("teacher.studentsN", { n: c.students })} · {t("teacher.code")}: <b className="tabular tracking-widest text-text">{c.code}</b></p>
                <p className="mt-2 text-sm font-semibold text-primary">{t("teacher.open")} →</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ───────────── Teacher: one class ─────────────

function Bars({ days }: { days: Student["last7"] }) {
  const max = Math.max(60, ...days.map((d) => d.minutes));
  return (
    <div className="flex h-9 items-end gap-1" aria-hidden>
      {days.map((d) => (
        <span key={d.date} title={`${d.date}: ${d.leave ? "leave" : hm(d.minutes)}`} className={cx("w-3 rounded-t", d.leave ? "bg-warm-soft" : d.minutes > 0 ? "bg-grad" : "bg-surface-2")} style={{ height: `${d.leave ? 30 : Math.max(8, (d.minutes / max) * 100)}%` }} />
      ))}
    </div>
  );
}

type SortKey = "name" | "today" | "week" | "streak";

export function ClassBoard({ data }: { data: ClassDashboard }) {
  const t = useT();
  const lang = useLang();
  const router = useRouter();
  const [sort, setSort] = useState<SortKey>("week");
  const [onlyNudge, setOnlyNudge] = useState(false);
  const [name, setName] = useState(data.name);
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function op(body: object, after?: () => void) {
    setError(null);
    try {
      await apiFetch("/api/v1/teacher", { body });
      after?.();
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("teacher.error"));
    }
  }

  function copy() {
    navigator.clipboard?.writeText(data.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }).catch(() => undefined);
  }

  function exportCsv() {
    const head = ["Name", "Today (min)", "Last 7 days (min)", "Days studied (of 7)", "Streak", "Papers (7 days)", ...data.students[0]?.last7.map((d) => d.date) ?? []];
    const rows = data.students.map((s) => [s.name, s.todayMinutes, s.weekMinutes, s.daysStudied, s.streak, s.papersThisWeek, ...s.last7.map((d) => (d.leave ? "leave" : d.minutes))]);
    const csv = [head, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${data.name.replace(/[^\w\- ]+/g, "")}-study.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const nudge = (s: Student) => s.todayMinutes < 25 && !s.onLeaveToday;
  const list = [...data.students]
    .filter((s) => !onlyNudge || nudge(s))
    .sort((a, b) => (sort === "name" ? a.name.localeCompare(b.name) : sort === "today" ? b.todayMinutes - a.todayMinutes : sort === "streak" ? b.streak - a.streak : b.weekMinutes - a.weekMinutes));
  const ago = (iso: string | null) => {
    if (!iso) return "–";
    return new Date(iso).toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", { day: "numeric", month: "short" });
  };

  return (
    <div className="space-y-4">
      <Link href="/teacher" className="text-sm text-muted">← {t("teacher.allClasses")}</Link>
      {editing ? (
        <div className="flex gap-2">
          <input className={inputClass} value={name} maxLength={80} onChange={(e) => setName(e.target.value)} aria-label={t("teacher.className")} />
          <Button onClick={() => op({ action: "rename", classId: data.id, name }, () => setEditing(false))} disabled={!name.trim()}>{t("common.save")}</Button>
        </div>
      ) : (
        <PageHeader title={data.name} subtitle={t("teacher.studentsN", { n: data.summary.count })} action={<Button variant="ghost" onClick={() => setEditing(true)}>{t("common.edit")}</Button>} />
      )}
      {error && <Alert tone="danger">{error}</Alert>}

      <Card className="bg-primary-soft">
        <p className="text-sm font-medium">{t("teacher.codeHelp")}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="tabular rounded-xl bg-surface px-4 py-2 text-2xl font-extrabold tracking-[0.3em]">{data.code}</span>
          <Button variant="secondary" onClick={copy}>{copied ? "✓" : t("teacher.copy")}</Button>
          <Button onClick={() => shareCode(data.code, data.name, t("teacher.shareText"))}>📤 {t("teacher.share")}</Button>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label={t("teacher.studiedToday")} value={`${data.summary.studiedToday}/${data.summary.count}`} />
        <Stat label={t("teacher.avgWeek")} value={hm(data.summary.avgWeekMinutes)} sub={t("teacher.perStudent")} />
        <Stat label={t("teacher.totalWeek")} value={hm(data.summary.totalWeekMinutes)} />
        <Stat label={t("teacher.students")} value={data.summary.count} />
      </div>

      <Card>
        <CardTitle eyebrow={<Provenance kind="measured" />} action={data.students.length > 0 ? <Button variant="ghost" onClick={exportCsv}>⬇ CSV</Button> : undefined}>{t("teacher.students")}</CardTitle>
        {data.students.length === 0 ? (
          <EmptyState title={t("teacher.emptyTitle")}>{t("teacher.emptyText")}</EmptyState>
        ) : (
          <>
            <div className="mb-3 flex flex-wrap gap-1.5 text-sm">
              {(["week", "today", "streak", "name"] as SortKey[]).map((k) => (
                <button key={k} type="button" aria-pressed={sort === k} onClick={() => setSort(k)} className={cx("rounded-full border px-3 py-1 font-semibold", sort === k ? "border-primary bg-primary-soft text-primary" : "border-border")}>{t(`teacher.sort.${k}` as const)}</button>
              ))}
              <button type="button" aria-pressed={onlyNudge} onClick={() => setOnlyNudge((v) => !v)} className={cx("rounded-full border px-3 py-1 font-semibold", onlyNudge ? "border-warning bg-warning-soft text-warning" : "border-border")}>🔔 {t("teacher.nudge")}</button>
            </div>
            <ul className="divide-y divide-border">
              {list.map((s) => (
                <li key={s.userId} className="flex flex-wrap items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{s.name} {s.onLeaveToday ? <Badge tone="warning">{t("teacher.leave")}</Badge> : nudge(s) ? <Badge>{t("teacher.notYet")}</Badge> : <Badge tone="success">{t("teacher.studied")}</Badge>}</p>
                    <p className="text-xs text-muted">
                      {t("teacher.today")} <b className="text-text">{hm(s.todayMinutes)}</b> · {t("teacher.week")} <b className="text-text">{hm(s.weekMinutes)}</b> · {t("teacher.days", { n: s.daysStudied })} · 🔥 {s.streak} · 📝 {s.papersThisWeek} · {t("teacher.lastSeen")} {ago(s.lastActiveAt)}
                    </p>
                  </div>
                  <Bars days={s.last7} />
                  <button type="button" className="text-xs text-muted underline" onClick={() => window.confirm(t("teacher.removeConfirm", { name: s.name })) && op({ action: "remove", classId: data.id, userId: s.userId })}>{t("teacher.remove")}</button>
                </li>
              ))}
            </ul>
          </>
        )}
        <p className="mt-3 text-xs text-muted">{t("teacher.privacy")}</p>
      </Card>

      <Card>
        <CardTitle>{t("teacher.settings")}</CardTitle>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => window.confirm(t("teacher.newCodeConfirm")) && op({ action: "newCode", classId: data.id })}>{t("teacher.newCode")}</Button>
          <Button variant="danger" onClick={() => window.confirm(t("teacher.deleteConfirm")) && op({ action: "delete", classId: data.id }, () => router.push("/teacher"))}>{t("teacher.delete")}</Button>
        </div>
      </Card>
    </div>
  );
}

// ───────────── Student: join a class ─────────────

export function JoinClass({ classes, initialCode = "" }: { classes: { classId: string; name: string; teacher: string }[]; initialCode?: string }) {
  const t = useT();
  const router = useRouter();
  const [code, setCode] = useState(initialCode);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "success" | "danger"; text: string } | null>(null);

  async function join() {
    setBusy(true);
    setMsg(null);
    try {
      const r = await apiFetch<{ name: string; teacher: string }>("/api/v1/classes", { body: { action: "join", code } });
      setMsg({ tone: "success", text: t("join.done", { name: r.name, teacher: r.teacher }) });
      setCode("");
      router.refresh();
    } catch (e) {
      setMsg({ tone: "danger", text: e instanceof ApiError ? e.message : t("teacher.error") });
    } finally {
      setBusy(false);
    }
  }

  async function leave(classId: string, name: string) {
    if (!window.confirm(t("join.leaveConfirm", { name }))) return;
    await apiFetch("/api/v1/classes", { body: { action: "leave", classId } }).catch(() => undefined);
    router.refresh();
  }

  return (
    <Card className="space-y-3">
      <CardTitle>👩‍🏫 {t("join.title")}</CardTitle>
      <p className="text-sm text-muted">{t("join.text")}</p>
      <div className="flex gap-2">
        <input className={cx(inputClass, "tabular uppercase tracking-widest")} value={code} maxLength={12} placeholder="K7M2QX" onChange={(e) => setCode(e.target.value)} aria-label={t("join.code")} />
        <Button onClick={join} disabled={busy || code.trim().length < 4}>{t("join.btn")}</Button>
      </div>
      <p className="text-xs text-muted">{t("teacher.privacy")}</p>
      {msg && <Alert tone={msg.tone}>{msg.text}</Alert>}
      {classes.length > 0 && (
        <ul className="divide-y divide-border text-sm">
          {classes.map((c) => (
            <li key={c.classId} className="flex items-center justify-between gap-2 py-2">
              <span><b>{c.name}</b> · {c.teacher}</span>
              <button type="button" className="text-xs text-muted underline" onClick={() => leave(c.classId, c.name)}>{t("join.leave")}</button>
            </li>
          ))}
        </ul>
      )}
      <Link href="/teacher" className="inline-block text-sm font-semibold text-primary">{t("join.amTeacher")} →</Link>
    </Card>
  );
}
