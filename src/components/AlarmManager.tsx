"use client";

import { useState } from "react";
import { apiFetch, ApiError } from "@/lib/client/api";
import { useLang, useT } from "@/i18n/client";
import { PushToggle } from "./PushToggle";
import { Alert, Button, Card, CardTitle, cx, EmptyState, inputClass, PageHeader } from "./ui";

type Alarm = { id: string; time: string; days: number[]; label: string; enabled: boolean };

export function AlarmManager({ initial, vapidKey }: { initial: Alarm[]; vapidKey: string | null }) {
  const t = useT();
  const lang = useLang();
  const DAYS = lang === "hi" ? ["सो", "मं", "बु", "गु", "शु", "श", "र"] : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const [alarms, setAlarms] = useState<Alarm[]>(initial);
  const [time, setTime] = useState("07:00");
  const [days, setDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [label, setLabel] = useState("");
  const [msg, setMsg] = useState<{ tone: "success" | "danger"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function save(a: Omit<Alarm, "id"> & { id?: string }) {
    setBusy(true);
    setMsg(null);
    try {
      const saved = await apiFetch<Alarm & { days: string | number[] }>("/api/v1/alarms", { method: "POST", body: { action: "save", alarm: a } });
      const norm = { ...saved, days: typeof saved.days === "string" ? JSON.parse(saved.days) : saved.days } as Alarm;
      setAlarms((xs) => [...xs.filter((x) => x.id !== norm.id), norm].sort((p, q) => p.time.localeCompare(q.time)));
      if (!a.id) setMsg({ tone: "success", text: t("alarm.saved", { time: a.time }) });
    } catch (e) {
      setMsg({ tone: "danger", text: e instanceof ApiError ? e.message : "Failed." });
    } finally {
      setBusy(false);
    }
  }
  async function remove(id: string) {
    await apiFetch("/api/v1/alarms", { method: "POST", body: { action: "delete", id } }).catch(() => undefined);
    setAlarms((xs) => xs.filter((x) => x.id !== id));
  }
  const dayText = (d: number[]) => (d.length === 7 ? t("alarm.everyday") : d.map((x) => DAYS[x]).join(", "));

  return (
    <div className="space-y-4">
      <PageHeader title={t("alarm.title")} subtitle={t("alarm.subtitle")} />
      <PushToggle publicKey={vapidKey} />

      <Card>
        <CardTitle>{t("alarm.new")}</CardTitle>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block"><span className="mb-1 block text-sm font-medium">{t("alarm.time")}</span><input type="time" className={cx(inputClass, "text-lg")} value={time} onChange={(e) => setTime(e.target.value)} /></label>
          <label className="block"><span className="mb-1 block text-sm font-medium">{t("alarm.label")}</span><input className={inputClass} maxLength={60} placeholder={t("alarm.labelPlaceholder")} value={label} onChange={(e) => setLabel(e.target.value)} /></label>
        </div>
        <fieldset className="mt-3">
          <legend className="mb-1 text-sm font-medium">{t("alarm.days")}</legend>
          <div className="flex flex-wrap gap-1.5">
            {DAYS.map((d, i) => (
              <button key={d} type="button" aria-pressed={days.includes(i)} onClick={() => setDays(days.includes(i) ? days.filter((x) => x !== i) : [...days, i])} className={cx("min-h-10 min-w-11 rounded-xl border px-2 text-sm font-semibold", days.includes(i) ? "border-primary bg-primary text-on-primary" : "border-border")}>{d}</button>
            ))}
          </div>
        </fieldset>
        <Button className="mt-3" disabled={busy || !time || days.length === 0} onClick={() => save({ time, days, label, enabled: true })}>⏰ {t("alarm.add")}</Button>
        {msg && <div className="mt-3"><Alert tone={msg.tone}>{msg.text}</Alert></div>}
      </Card>

      <Card>
        <CardTitle>{t("alarm.mine")}</CardTitle>
        {alarms.length === 0 ? <EmptyState title={t("alarm.none")} /> : (
          <ul className="divide-y divide-border">
            {alarms.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 py-3">
                <div className={cx(!a.enabled && "opacity-50")}>
                  <p className="tabular text-2xl font-bold">{a.time}</p>
                  <p className="text-xs text-muted">{dayText(a.days)}{a.label ? ` · ${a.label}` : ""}</p>
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-xs">
                    <input type="checkbox" role="switch" className="h-5 w-5 accent-[var(--primary)]" checked={a.enabled} onChange={(e) => save({ ...a, enabled: e.target.checked })} aria-label={`${a.time} ${t("alarm.onOff")}`} />
                  </label>
                  <button type="button" onClick={() => remove(a.id)} className="rounded-lg px-2 py-1 text-xs font-semibold text-danger hover:bg-danger-soft">{t("alarm.delete")}</button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-muted">{t("alarm.note")}</p>
      </Card>
    </div>
  );
}
