"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/client/api";
import { formatMinutes } from "@/lib/engine/dates";
import { useLang, useT } from "@/i18n/client";
import { Alert, Button, Card, CardTitle, cx, inputClass, PageHeader, Stat } from "./ui";

type Cell = { date: string; status: "PRESENT" | "LOW" | "LEAVE" | "ABSENT" | "TODAY" | "FUTURE" | "BEFORE_START"; minutes: number; planned: number; sessions: number; questions: number; note: string | null };
type Data = { month: string; today: string; prevMonth: string; nextMonth: string; cells: Cell[]; summary: { present: number; low: number; leave: number; absent: number; trackedDays: number; totalMinutes: number; bestDay: { date: string; minutes: number } | null } };

// Every status has a symbol as well as a colour, so meaning never depends on colour alone.
const STYLE: Record<Cell["status"], { cls: string; sym: string }> = {
  PRESENT: { cls: "bg-success-soft text-success border-success/40", sym: "✓" },
  LOW: { cls: "bg-warning-soft text-warning border-warning/40", sym: "◐" },
  LEAVE: { cls: "bg-primary-soft text-primary border-primary/40", sym: "☾" },
  ABSENT: { cls: "bg-danger-soft text-danger border-danger/30", sym: "✗" },
  TODAY: { cls: "border-primary text-text ring-2 ring-primary/30", sym: "•" },
  FUTURE: { cls: "text-muted border-border", sym: "" },
  BEFORE_START: { cls: "text-muted/60 border-transparent", sym: "" },
};

export function AttendanceCalendar({ data }: { data: Data }) {
  const t = useT();
  const lang = useLang();
  const router = useRouter();
  const [sel, setSel] = useState<Cell | null>(data.cells.find((c) => c.date === data.today) ?? null);
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState<{ tone: "success" | "danger"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const firstWeekday = (new Date(`${data.cells[0].date}T12:00:00`).getDay() + 6) % 7; // Monday first
  const monthName = new Date(`${data.month}-01T12:00:00`).toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", { month: "long", year: "numeric" });
  const weekdays = lang === "hi" ? ["सो", "मं", "बु", "गु", "शु", "श", "र"] : ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
  const label: Record<Cell["status"], string> = {
    PRESENT: t("att.present"), LOW: t("att.low"), LEAVE: t("att.leave"), ABSENT: t("att.absent"), TODAY: t("att.today"), FUTURE: "", BEFORE_START: "",
  };

  async function toggleLeave(c: Cell) {
    setBusy(true);
    setMsg(null);
    try {
      await apiFetch("/api/v1/attendance", { method: "POST", body: { date: c.date, leave: c.status !== "LEAVE", note: note || null } });
      setMsg({ tone: "success", text: c.status === "LEAVE" ? t("att.leaveRemoved") : t("att.leaveSaved") });
      setSel(null);
      router.refresh();
    } catch (e) {
      setMsg({ tone: "danger", text: e instanceof ApiError ? e.message : "Failed." });
    } finally {
      setBusy(false);
    }
  }

  const s = data.summary;
  return (
    <div className="space-y-4">
      <PageHeader title={t("att.title")} subtitle={t("att.subtitle")} />
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <Link href={`/attendance?month=${data.prevMonth}`} className="rounded-lg px-3 py-2 text-sm font-semibold text-primary hover:bg-primary-soft" aria-label="Previous month">←</Link>
          <h2 className="font-semibold">{monthName}</h2>
          <Link href={`/attendance?month=${data.nextMonth}`} className="rounded-lg px-3 py-2 text-sm font-semibold text-primary hover:bg-primary-soft" aria-label="Next month">→</Link>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-muted">{weekdays.map((w) => <div key={w}>{w}</div>)}</div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {Array.from({ length: firstWeekday }).map((_, i) => <div key={`e${i}`} />)}
          {data.cells.map((c) => {
            const st = STYLE[c.status];
            return (
              <button
                key={c.date}
                type="button"
                onClick={() => { setSel(c); setNote(c.note ?? ""); setMsg(null); }}
                aria-label={`${c.date}: ${label[c.status] || ""} ${c.minutes ? formatMinutes(c.minutes) : ""}`}
                aria-pressed={sel?.date === c.date}
                className={cx("flex aspect-square flex-col items-center justify-center rounded-lg border text-xs", st.cls, sel?.date === c.date && "outline outline-2 outline-primary")}
              >
                <span className="font-semibold">{Number(c.date.slice(8))}</span>
                <span className="text-[10px] leading-none">{st.sym}{c.minutes >= 60 ? ` ${Math.floor(c.minutes / 60)}h` : c.minutes > 0 ? ` ${c.minutes}m` : ""}</span>
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          {(["PRESENT", "LOW", "LEAVE", "ABSENT"] as const).map((k) => <span key={k} className={cx("rounded-full border px-2 py-0.5", STYLE[k].cls)}>{STYLE[k].sym} {label[k]}</span>)}
        </div>
      </Card>

      {sel && sel.status !== "BEFORE_START" && (
        <Card>
          <CardTitle>{new Date(`${sel.date}T12:00:00`).toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", { weekday: "long", day: "numeric", month: "long" })}</CardTitle>
          {sel.status !== "FUTURE" && (
            <div className="mb-3 grid grid-cols-3 gap-2">
              <Stat label={t("att.studied")} value={formatMinutes(sel.minutes)} sub={sel.planned ? `${t("plan.planned")} ${formatMinutes(sel.planned)}` : undefined} />
              <Stat label={t("att.sessions")} value={sel.sessions} />
              <Stat label={t("common.questions")} value={sel.questions} />
            </div>
          )}
          {sel.status === "LEAVE" && sel.note && <p className="mb-2 text-sm">☾ {sel.note}</p>}
          {sel.status !== "PRESENT" && (
            <>
              {sel.status !== "LEAVE" && <input className={cx(inputClass, "mb-2")} maxLength={120} placeholder={t("att.notePlaceholder")} value={note} onChange={(e) => setNote(e.target.value)} />}
              <Button variant={sel.status === "LEAVE" ? "secondary" : "primary"} disabled={busy} onClick={() => toggleLeave(sel)}>{sel.status === "LEAVE" ? t("att.removeLeave") : t("att.markLeave")}</Button>
              <p className="mt-2 text-xs text-muted">{t("att.leaveHint")}</p>
            </>
          )}
        </Card>
      )}
      {msg && <Alert tone={msg.tone}>{msg.text}</Alert>}

      <Card>
        <CardTitle>{t("att.monthSummary")}</CardTitle>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label={`✓ ${t("att.present")}`} value={s.present} sub={s.trackedDays ? `${Math.round((s.present / s.trackedDays) * 100)}%` : undefined} />
          <Stat label={`☾ ${t("att.leave")}`} value={s.leave} />
          <Stat label={`✗ ${t("att.absent")}`} value={s.absent + s.low} />
          <Stat label={t("att.total")} value={formatMinutes(s.totalMinutes)} sub={s.bestDay ? `${t("att.best")}: ${formatMinutes(s.bestDay.minutes)}` : undefined} />
        </div>
      </Card>
    </div>
  );
}
