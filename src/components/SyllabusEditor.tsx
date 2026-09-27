"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/client/api";
import { formatMinutes } from "@/lib/engine/dates";
import { useT } from "@/i18n/client";
import { Alert, Button, Card, cx, EmptyState, inputClass, PageHeader } from "./ui";

type Status = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
type Chapter = { id: string; name: string; status: Status; minutes: number; questions: number };
type Subject = { id: string; name: string; book: string | null; chapters: Chapter[] };
type Data = { exam: { id: string; name: string; editable: boolean }; purpose: string; subjects: Subject[] };

const NEXT: Record<Status, Status> = { NOT_STARTED: "IN_PROGRESS", IN_PROGRESS: "COMPLETED", COMPLETED: "NOT_STARTED" };
const SYM: Record<Status, string> = { NOT_STARTED: "○", IN_PROGRESS: "◐", COMPLETED: "✓" };

export function SyllabusEditor({ data }: { data: Data }) {
  const t = useT();
  const router = useRouter();
  const [msg, setMsg] = useState<{ tone: "success" | "danger"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [newSubject, setNewSubject] = useState({ name: "", book: "" });
  const editable = data.exam.editable;

  async function act(body: Record<string, unknown>, ok?: string) {
    setBusy(true);
    setMsg(null);
    try {
      await apiFetch("/api/v1/syllabus", { method: "POST", body });
      if (ok) setMsg({ tone: "success", text: ok });
      router.refresh();
    } catch (e) {
      setMsg({ tone: "danger", text: e instanceof ApiError ? e.message : "Failed." });
    } finally {
      setBusy(false);
    }
  }

  const total = data.subjects.reduce((s, x) => s + x.chapters.length, 0);
  const done = data.subjects.reduce((s, x) => s + x.chapters.filter((c) => c.status === "COMPLETED").length, 0);

  return (
    <div className="space-y-4">
      <PageHeader title={t("syl.title")} subtitle={`${data.exam.name} · ${done}/${total} ${t("syl.chaptersDone")}`} action={<Link href="/onboarding?change=1" className="text-sm font-semibold text-primary">{t("syl.change")}</Link>} />
      <Alert tone="primary">{editable ? t("syl.hintEditable") : t("syl.hintReady")}</Alert>
      {msg && <Alert tone={msg.tone}>{msg.text}</Alert>}

      {data.subjects.length === 0 && <EmptyState title={t("syl.empty")} />}
      {data.subjects.map((s) => (
        <Card key={s.id}>
          <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              {editable ? (
                <>
                  <input defaultValue={s.name} maxLength={120} aria-label={t("ob.custom.subject")} className="w-full rounded-lg border border-transparent bg-transparent px-1 text-base font-semibold hover:border-border focus:border-primary"
                    onBlur={(e) => e.target.value.trim() && e.target.value !== s.name && act({ action: "updateSubject", id: s.id, data: { name: e.target.value.trim() } }, "✓")} />
                  <input defaultValue={s.book ?? ""} maxLength={120} placeholder={t("ob.custom.bookPlaceholder")} aria-label={t("ob.custom.book")} className="mt-1 w-full rounded-lg border border-transparent bg-transparent px-1 text-xs text-muted hover:border-border focus:border-primary"
                    onBlur={(e) => e.target.value !== (s.book ?? "") && act({ action: "updateSubject", id: s.id, data: { book: e.target.value.trim() || null } }, "✓")} />
                </>
              ) : (
                <>
                  <p className="font-semibold">{s.name}</p>
                  {s.book && <p className="text-xs text-muted">📖 {s.book}</p>}
                </>
              )}
            </div>
            {editable && <button type="button" disabled={busy} onClick={() => confirm(t("syl.confirmDeleteSubject")) && act({ action: "deleteSubject", id: s.id })} className="rounded-lg px-2 py-1 text-xs font-semibold text-danger hover:bg-danger-soft">{t("alarm.delete")}</button>}
          </div>
          <ul className="divide-y divide-border">
            {s.chapters.map((c) => (
              <li key={c.id} className="flex items-center gap-2 py-2">
                <button type="button" disabled={busy} onClick={() => act({ action: "status", id: c.id, status: NEXT[c.status] })} aria-label={`${c.name}: ${t(`syl.${c.status}`)}`}
                  className={cx("grid h-9 w-9 shrink-0 place-items-center rounded-full border text-sm font-bold", c.status === "COMPLETED" ? "border-success bg-success-soft text-success" : c.status === "IN_PROGRESS" ? "border-primary bg-primary-soft text-primary" : "border-border text-muted")}>
                  {SYM[c.status]}
                </button>
                {editable ? (
                  <input defaultValue={c.name} maxLength={120} aria-label={t("ob.custom.chapters")} className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-1 text-sm hover:border-border focus:border-primary"
                    onBlur={(e) => e.target.value.trim() && e.target.value !== c.name && act({ action: "renameChapter", id: c.id, name: e.target.value.trim() })} />
                ) : <span className="min-w-0 flex-1 text-sm">{c.name}</span>}
                <span className="shrink-0 text-xs text-muted">{c.minutes ? formatMinutes(c.minutes) : ""}</span>
                {editable && <button type="button" disabled={busy} onClick={() => confirm(t("syl.confirmDeleteChapter")) && act({ action: "deleteChapter", id: c.id })} aria-label={`${t("alarm.delete")} ${c.name}`} className="shrink-0 rounded-lg px-2 py-1 text-xs text-muted hover:bg-danger-soft hover:text-danger">✕</button>}
              </li>
            ))}
          </ul>
          {editable && (
            <form className="mt-2 flex gap-2" onSubmit={(e) => {
              e.preventDefault();
              const input = e.currentTarget.elements.namedItem("chapters") as HTMLTextAreaElement;
              const names = input.value.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
              if (names.length) act({ action: "addChapters", subjectId: s.id, names }, t("syl.added", { n: names.length }));
              input.value = "";
            }}>
              <textarea name="chapters" rows={1} className={cx(inputClass, "py-2")} placeholder={t("syl.addChapters")} aria-label={t("syl.addChapters")} />
              <Button type="submit" variant="secondary" disabled={busy}>{t("common.add")}</Button>
            </form>
          )}
        </Card>
      ))}

      {editable && (
        <Card>
          <p className="mb-2 font-semibold">➕ {t("ob.custom.addSubject")}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <input className={inputClass} maxLength={120} placeholder={t("ob.custom.subjectPlaceholder")} value={newSubject.name} onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })} />
            <input className={inputClass} maxLength={120} placeholder={t("ob.custom.bookPlaceholder")} value={newSubject.book} onChange={(e) => setNewSubject({ ...newSubject, book: e.target.value })} />
          </div>
          <Button className="mt-2" disabled={busy || !newSubject.name.trim()} onClick={() => { act({ action: "addSubject", data: { name: newSubject.name.trim(), book: newSubject.book.trim() || null } }, "✓"); setNewSubject({ name: "", book: "" }); }}>{t("common.add")}</Button>
        </Card>
      )}
    </div>
  );
}
