"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, apiFetch } from "@/lib/client/api";
import { shareText } from "@/lib/client/share";
import { useT } from "@/i18n/client";
import type { currentChallenge } from "@/server/services/challenge.service";
import { Alert, Button, Card, CardTitle, cx, PageHeader, Progress, Stat } from "./ui";

type C = NonNullable<Awaited<ReturnType<typeof currentChallenge>>>;
const MINUTES = [60, 120, 180, 240, 300, 360];
const DAYS = [7, 21, 30] as const;
const hrs = (m: number) => (m % 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m / 60}h`);

export function ChallengeView({ challenge }: { challenge: C | null }) {
  const t = useT();
  const router = useRouter();
  const [minutes, setMinutes] = useState(180);
  const [days, setDays] = useState<(typeof DAYS)[number]>(30);
  const [error, setError] = useState<string | null>(null);
  const active = challenge && !challenge.finished;

  async function post(body: object, confirm?: string) {
    if (confirm && !window.confirm(confirm)) return;
    setError(null);
    try {
      await apiFetch("/api/v1/challenge", { body });
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("teacher.error"));
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader title={`🏆 ${t("challenge.title")}`} subtitle={t("challenge.subtitle")} />
      {error && <Alert tone="danger">{error}</Alert>}

      {challenge && (
        <Card className={cx(challenge.won && "border-success bg-success-soft")}>
          <CardTitle>{t("challenge.goal", { days: challenge.days, h: hrs(challenge.dailyMinutes) })}</CardTitle>
          {challenge.won ? (
            <p className="text-lg font-bold">🏆 {t("challenge.won")}</p>
          ) : challenge.finished ? (
            <p className="text-sm">{challenge.gaveUp ? t("challenge.stopped") : t("challenge.ended", { n: challenge.hit })}</p>
          ) : (
            <p className="text-sm">{t("challenge.day", { d: challenge.dayNumber, days: challenge.days })}</p>
          )}
          <div className="mt-3 grid grid-cols-3 gap-2">
            <Stat label={`✅ ${t("challenge.hit")}`} value={challenge.hit} />
            <Stat label={`☾ ${t("challenge.leave")}`} value={challenge.leave} />
            <Stat label={`✗ ${t("challenge.missed")}`} value={challenge.missed} />
          </div>
          <div className="mt-3"><Progress value={challenge.hit + challenge.leave} max={challenge.days} label={`${challenge.hit + challenge.leave}/${challenge.days}`} tone="success" /></div>
          <div className="mt-3 grid grid-cols-7 gap-1.5 sm:grid-cols-10">
            {challenge.calendar.map((d, i) => (
              <span key={d.date} title={`${d.date}: ${d.minutes} min`} className={cx("grid aspect-square place-items-center rounded-lg text-[11px] font-semibold", d.state === "hit" ? "bg-grad text-white" : d.state === "leave" ? "bg-warm-soft text-warm" : d.state === "miss" ? "bg-danger-soft text-danger" : d.state === "today" ? "border-2 border-primary" : "bg-surface-2 text-muted")}>
                {d.state === "hit" ? "✓" : d.state === "miss" ? "✗" : d.state === "leave" ? "☾" : i + 1}
              </span>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted">{t("challenge.rule")}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => shareText(t("challenge.shareText", { hit: challenge.hit, days: challenge.days, h: hrs(challenge.dailyMinutes) }))}>📤 {t("teacher.share")}</Button>
            {active && <Button variant="ghost" onClick={() => post({ action: "stop" }, t("challenge.stopConfirm"))}>{t("challenge.stop")}</Button>}
          </div>
        </Card>
      )}

      {!active && (
        <Card className="space-y-3">
          <CardTitle>{t("challenge.new")}</CardTitle>
          <fieldset>
            <legend className="mb-1 text-sm font-medium">{t("challenge.perDay")}</legend>
            <div className="grid grid-cols-3 gap-1.5">
              {MINUTES.map((m) => <button key={m} type="button" aria-pressed={minutes === m} onClick={() => setMinutes(m)} className={cx("h-11 rounded-xl border text-sm font-semibold", minutes === m ? "border-primary bg-primary text-on-primary" : "border-border")}>{hrs(m)}</button>)}
            </div>
          </fieldset>
          <fieldset>
            <legend className="mb-1 text-sm font-medium">{t("challenge.length")}</legend>
            <div className="grid grid-cols-3 gap-1.5">
              {DAYS.map((d) => <button key={d} type="button" aria-pressed={days === d} onClick={() => setDays(d)} className={cx("h-11 rounded-xl border text-sm font-semibold", days === d ? "border-primary bg-primary text-on-primary" : "border-border")}>{t("challenge.daysN", { n: d })}</button>)}
            </div>
          </fieldset>
          <Button className="w-full" onClick={() => post({ action: "start", dailyMinutes: minutes, days })}>🏁 {t("challenge.start")}</Button>
          <p className="text-xs text-muted">{t("challenge.tip")}</p>
        </Card>
      )}
    </div>
  );
}
