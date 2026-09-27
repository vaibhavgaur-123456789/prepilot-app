"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/client/api";
import { formatMinutes } from "@/lib/engine/dates";
import { Alert, Button, Card, CardTitle, cx, inputClass } from "./ui";
import { PushToggle } from "./PushToggle";
import { setLangCookie, useLang, useT } from "@/i18n/client";
import { LANGS } from "@/i18n/dict";

type Profile = { name: string; timezone: string; theme: string; examDate: string; dailyMinutes: number; preferredBlockMin: number; preferredSlots: string[]; benchmarkOptIn: boolean; hasPassword: boolean };
type Prefs = { enabled: boolean; studyReminder: boolean; revisionReminder: boolean; mockReminder: boolean; missedTask: boolean; examCountdown: boolean; dailyBriefing: boolean; weeklyReview: boolean; quietStart: string; quietEnd: string; maxPerDay: number };

const SLOTS = ["MORNING", "AFTERNOON", "EVENING", "NIGHT"];
const PREF_LABELS: [keyof Prefs, string][] = [["dailyBriefing", "Daily briefing"], ["studyReminder", "Study block reminders"], ["revisionReminder", "Revision reminders"], ["mockReminder", "Mock test reminders"], ["missedTask", "Missed-task updates"], ["examCountdown", "Exam countdown milestones"], ["weeklyReview", "Weekly report"]];

function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="flex items-start justify-between gap-3 py-2">
      <span><span className="text-sm font-medium">{label}</span>{hint && <span className="block text-xs text-muted">{hint}</span>}</span>
      <input type="checkbox" role="switch" className="mt-1 h-5 w-5 shrink-0 accent-[var(--primary)]" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

export function SettingsForm({ profile, prefs: initialPrefs, vapidKey }: { profile: Profile; prefs: Prefs; vapidKey: string | null }) {
  const router = useRouter();
  const t = useT();
  const lang = useLang();
  const [p, setP] = useState(profile);
  const [prefs, setPrefs] = useState(initialPrefs);
  const [msg, setMsg] = useState<{ tone: "success" | "danger"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState("");
  const [password, setPassword] = useState("");

  async function save(body: Record<string, unknown>, ok = "Saved.") {
    setBusy(true);
    setMsg(null);
    try {
      await apiFetch("/api/v1/profile", { method: "PATCH", body });
      setMsg({ tone: "success", text: ok });
      router.refresh();
    } catch (e) {
      setMsg({ tone: "danger", text: e instanceof ApiError ? e.message : "Couldn't save." });
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await apiFetch("/api/v1/auth/logout", { method: "POST", body: {} }).catch(() => undefined);
    router.replace("/login");
    router.refresh();
  }

  async function deleteAccount() {
    setBusy(true);
    try {
      await apiFetch("/api/v1/profile", { method: "POST", body: { action: "delete-account", data: { confirm: "DELETE", password: password || undefined } } });
      localStorage.clear();
      router.replace("/signup");
      router.refresh();
    } catch (e) {
      setMsg({ tone: "danger", text: e instanceof ApiError ? e.message : "Couldn't delete the account." });
      setBusy(false);
    }
  }

  return (
    <>
      {msg && <Alert tone={msg.tone}>{msg.text}</Alert>}
      <Card>
        <CardTitle>{t("settings.study")}</CardTitle>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block sm:col-span-2"><span className="mb-1 block text-sm font-medium">{t("settings.language")} / भाषा</span>
            <select className={inputClass} value={lang} onChange={(e) => { setLangCookie(e.target.value); save({ profile: { language: e.target.value } }, "✓"); }}>
              {LANGS.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>
          </label>
          <label className="block"><span className="mb-1 block text-sm font-medium">Name</span><input className={inputClass} value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} /></label>
          <label className="block"><span className="mb-1 block text-sm font-medium">Exam date</span><input type="date" className={inputClass} value={p.examDate} onChange={(e) => setP({ ...p, examDate: e.target.value })} /></label>
          <label className="block"><span className="mb-1 block text-sm font-medium">Available per day: {formatMinutes(p.dailyMinutes)}</span><input type="range" min={30} max={600} step={15} value={p.dailyMinutes} onChange={(e) => setP({ ...p, dailyMinutes: Number(e.target.value) })} className="w-full accent-[var(--primary)]" /></label>
          <label className="block"><span className="mb-1 block text-sm font-medium">Preferred block length: {p.preferredBlockMin} min</span><input type="range" min={20} max={90} step={5} value={p.preferredBlockMin} onChange={(e) => setP({ ...p, preferredBlockMin: Number(e.target.value) })} className="w-full accent-[var(--primary)]" /></label>
          <label className="block"><span className="mb-1 block text-sm font-medium">Timezone</span><input className={inputClass} value={p.timezone} onChange={(e) => setP({ ...p, timezone: e.target.value })} /></label>
          <label className="block"><span className="mb-1 block text-sm font-medium">Theme</span>
            <select className={inputClass} value={p.theme} onChange={(e) => setP({ ...p, theme: e.target.value })}><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select>
          </label>
        </div>
        <fieldset className="mt-3">
          <legend className="mb-1 text-sm font-medium">Study times</legend>
          <div className="flex flex-wrap gap-2">
            {SLOTS.map((s) => (
              <button key={s} type="button" aria-pressed={p.preferredSlots.includes(s)} onClick={() => setP({ ...p, preferredSlots: p.preferredSlots.includes(s) ? p.preferredSlots.filter((x) => x !== s) : [...p.preferredSlots, s] })} className={cx("min-h-10 rounded-xl border px-3 text-sm", p.preferredSlots.includes(s) ? "border-primary bg-primary-soft text-primary" : "border-border")}>{s[0] + s.slice(1).toLowerCase()}</button>
            ))}
          </div>
        </fieldset>
        <Button className="mt-4" disabled={busy || p.preferredSlots.length === 0} onClick={() => save({ profile: { name: p.name, examDate: p.examDate, dailyMinutes: p.dailyMinutes, preferredBlockMin: p.preferredBlockMin, timezone: p.timezone, theme: p.theme, preferredSlots: p.preferredSlots } }, "Saved. Tomorrow's plan will use these settings (Re-plan to apply today).")}>{t("settings.saveSettings")}</Button>
      </Card>

      <Card>
        <CardTitle>{t("settings.notifications")}</CardTitle>
        <div className="mb-3"><PushToggle publicKey={vapidKey} /></div>
        <Toggle checked={prefs.enabled} onChange={(v) => setPrefs({ ...prefs, enabled: v })} label="All notifications" hint="Turn everything off with one switch." />
        <div className={cx("divide-y divide-border", !prefs.enabled && "pointer-events-none opacity-50")}>
          {PREF_LABELS.map(([k, l]) => <Toggle key={k} checked={prefs[k] as boolean} onChange={(v) => setPrefs({ ...prefs, [k]: v })} label={l} />)}
          <div className="grid grid-cols-3 gap-2 py-2">
            <label className="block"><span className="mb-1 block text-xs font-medium">Quiet from</span><input type="time" className={inputClass} value={prefs.quietStart} onChange={(e) => setPrefs({ ...prefs, quietStart: e.target.value })} /></label>
            <label className="block"><span className="mb-1 block text-xs font-medium">Quiet until</span><input type="time" className={inputClass} value={prefs.quietEnd} onChange={(e) => setPrefs({ ...prefs, quietEnd: e.target.value })} /></label>
            <label className="block"><span className="mb-1 block text-xs font-medium">Max per day</span><input type="number" min={0} max={10} className={inputClass} value={prefs.maxPerDay} onChange={(e) => setPrefs({ ...prefs, maxPerDay: Number(e.target.value) })} /></label>
          </div>
        </div>
        <Button className="mt-2" disabled={busy} onClick={() => { const { enabled, studyReminder, revisionReminder, mockReminder, missedTask, examCountdown, dailyBriefing, weeklyReview, quietStart, quietEnd, maxPerDay } = prefs; save({ notifications: { enabled, studyReminder, revisionReminder, mockReminder, missedTask, examCountdown, dailyBriefing, weeklyReview, quietStart, quietEnd, maxPerDay } }); }}>{t("settings.saveNotifications")}</Button>
      </Card>

      <Card>
        <CardTitle>{t("settings.privacy")}</CardTitle>
        <Toggle checked={p.benchmarkOptIn} onChange={(v) => { setP({ ...p, benchmarkOptIn: v }); save({ profile: { benchmarkOptIn: v } }, v ? "Benchmarking on." : "Opted out. You're excluded from future aggregates immediately."); }} label="Anonymous benchmarking" hint="Your anonymized stats count toward group medians (published only for 20+ students), and you see comparisons. Your individual data is never shown to anyone." />
        <div className="mt-3 flex flex-wrap gap-2">
          <a href="/api/v1/profile" className="inline-flex min-h-11 items-center rounded-xl border border-border px-4 text-sm font-semibold hover:bg-surface-2">{t("settings.download")}</a>
          <Button variant="secondary" onClick={logout}>{t("settings.signOut")}</Button>
        </div>
        <details className="mt-4 rounded-xl border border-danger/40 p-3">
          <summary className="cursor-pointer text-sm font-semibold text-danger">Delete account</summary>
          <p className="mt-2 text-sm text-muted">Permanently deletes your account and all study data. This can&apos;t be undone. Download your data first if you want a copy.</p>
          {p.hasPassword && <label className="mt-2 block"><span className="mb-1 block text-sm font-medium">Password</span><input type="password" autoComplete="current-password" className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} /></label>}
          <label className="mt-2 block"><span className="mb-1 block text-sm font-medium">Type DELETE to confirm</span><input className={inputClass} value={confirmDelete} onChange={(e) => setConfirmDelete(e.target.value)} /></label>
          <Button variant="danger" className="mt-3" disabled={busy || confirmDelete !== "DELETE" || (p.hasPassword && !password)} onClick={deleteAccount}>Delete my account permanently</Button>
        </details>
      </Card>
    </>
  );
}
