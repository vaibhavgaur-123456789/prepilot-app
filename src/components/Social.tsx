"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApiError, apiFetch } from "@/lib/client/api";
import { copyText, shareText } from "@/lib/client/share";
import { useT } from "@/i18n/client";
import type { GroupBoard } from "@/server/services/group.service";
import { Alert, Badge, Button, Card, CardTitle, cx, inputClass, PageHeader } from "./ui";

const hm = (min: number) => (min >= 60 ? `${Math.floor(min / 60)}h${min % 60 ? ` ${min % 60}m` : ""}` : `${min}m`);
const origin = () => window.location.origin;

// ───────────── Study groups ─────────────

export function GroupsHome({ groups }: { groups: { id: string; name: string; code: string; members: number }[] }) {
  const t = useT();
  const router = useRouter();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function post(body: object) {
    setBusy(true);
    setError(null);
    try {
      const r = await apiFetch<{ id?: string; groupId?: string }>("/api/v1/groups", { body });
      router.push(`/groups/${r.id ?? r.groupId}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("teacher.error"));
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader title={t("groups.title")} subtitle={t("groups.subtitle")} />
      {error && <Alert tone="danger">{error}</Alert>}
      {groups.length > 0 && (
        <ul className="stagger grid gap-3 sm:grid-cols-2">
          {groups.map((g) => (
            <li key={g.id}>
              <Link href={`/groups/${g.id}`} className="lift block rounded-2xl border border-border bg-surface p-4">
                <p className="text-lg font-semibold">👥 {g.name}</p>
                <p className="mt-1 text-sm text-muted">{t("groups.membersN", { n: g.members })} · {t("teacher.code")} <b className="tabular tracking-widest text-text">{g.code}</b></p>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="space-y-3">
          <CardTitle>{t("groups.create")}</CardTitle>
          <input className={inputClass} value={name} maxLength={60} placeholder={t("groups.namePh")} onChange={(e) => setName(e.target.value)} aria-label={t("groups.create")} />
          <Button onClick={() => post({ action: "create", name })} disabled={busy || !name.trim()}>{t("groups.createBtn")}</Button>
        </Card>
        <Card className="space-y-3">
          <CardTitle>{t("groups.join")}</CardTitle>
          <input className={cx(inputClass, "tabular uppercase tracking-widest")} value={code} maxLength={12} placeholder="K7M2QX" onChange={(e) => setCode(e.target.value)} aria-label={t("groups.join")} />
          <Button variant="secondary" onClick={() => post({ action: "join", code })} disabled={busy || code.trim().length < 4}>{t("join.btn")}</Button>
        </Card>
      </div>
      <p className="text-xs text-muted">{t("groups.privacy")}</p>
    </div>
  );
}

export function GroupBoardView({ data }: { data: GroupBoard }) {
  const t = useT();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const live = data.members.filter((m) => m.studyingNowMinutes !== null);
  const medal = (r: number) => (r === 1 ? "🥇" : r === 2 ? "🥈" : r === 3 ? "🥉" : `#${r}`);

  async function leave() {
    if (!window.confirm(t("groups.leaveConfirm"))) return;
    await apiFetch("/api/v1/groups", { body: { action: "leave", groupId: data.id } }).catch(() => undefined);
    router.push("/groups");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <Link href="/groups" className="text-sm text-muted">← {t("groups.title")}</Link>
      <PageHeader title={`👥 ${data.name}`} subtitle={t("groups.membersN", { n: data.members.length })} />

      <Card className={live.length ? "border-success bg-success-soft" : ""}>
        <p className="font-semibold">{live.length ? t("groups.liveN", { n: live.length }) : t("groups.nobodyLive")}</p>
        {live.length > 0 && (
          <ul className="mt-2 space-y-1 text-sm">
            {live.map((m) => <li key={m.userId} className="flex items-center gap-2"><span className="h-2.5 w-2.5 animate-pulse rounded-full bg-success" aria-hidden /> <b>{m.isMe ? t("groups.you") : m.name}</b> · {t("groups.studyingFor", { m: m.studyingNowMinutes ?? 0 })}</li>)}
          </ul>
        )}
        <Link href="/study/session/free?quick=1" className="press mt-3 inline-flex min-h-11 items-center rounded-xl bg-grad px-4 text-sm font-bold text-white">⏱ {t("groups.startToo")}</Link>
      </Card>

      <Card>
        <CardTitle>{t("groups.leaderboard")}</CardTitle>
        <ol className="divide-y divide-border">
          {data.members.map((m) => (
            <li key={m.userId} className={cx("flex items-center gap-3 py-2.5", m.isMe && "font-semibold")}>
              <span className="w-8 text-center text-lg">{medal(m.rank)}</span>
              <span className="min-w-0 flex-1 truncate">{m.isMe ? `${m.name} (${t("groups.you")})` : m.name} {m.studyingNowMinutes !== null && <Badge tone="success">● {t("groups.live")}</Badge>}</span>
              <span className="tabular text-sm"><b>{hm(m.weekMinutes)}</b> <span className="text-xs text-muted">· {t("teacher.today")} {hm(m.todayMinutes)} · 🔥{m.streak}</span></span>
            </li>
          ))}
        </ol>
        <p className="mt-2 text-xs text-muted">{t("groups.rankNote")}</p>
      </Card>

      <Card className="space-y-2">
        <CardTitle>{t("groups.invite")}</CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          <span className="tabular rounded-xl bg-surface-2 px-4 py-2 text-xl font-extrabold tracking-[0.3em]">{data.code}</span>
          <Button variant="secondary" onClick={async () => setCopied(await copyText(data.code))}>{copied ? "✓" : t("teacher.copy")}</Button>
          <Button onClick={() => shareText(`${t("groups.shareText", { name: data.name, code: data.code })}\n${origin()}/groups/join/${data.code}`)}>📤 {t("teacher.share")}</Button>
        </div>
        <button type="button" onClick={leave} className="text-xs text-muted underline">{t("groups.leave")}</button>
      </Card>
    </div>
  );
}

// ───────────── Parent report link ─────────────

export function ParentLinkCard({ token }: { token: string | null }) {
  const t = useT();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function act(action: "create" | "remove") {
    if (action === "remove" && !window.confirm(t("parent.removeConfirm"))) return;
    setBusy(true);
    await apiFetch("/api/v1/parent", { body: { action } }).catch(() => undefined);
    setBusy(false);
    router.refresh();
  }

  return (
    <Card className="space-y-3">
      <CardTitle>👨‍👩‍👧 {t("parent.title")}</CardTitle>
      <p className="text-sm text-muted">{t("parent.text")}</p>
      {token ? (
        <>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => shareText(`${t("parent.shareText")}\n${origin()}/p/${token}`)}>📤 {t("parent.send")}</Button>
            <Link href={`/p/${token}`} className="inline-flex min-h-11 items-center rounded-xl border border-border px-4 text-sm font-semibold">{t("parent.preview")}</Link>
          </div>
          <div className="flex flex-wrap gap-3 text-xs">
            <button type="button" className="text-muted underline" disabled={busy} onClick={() => act("create")}>{t("parent.newLink")}</button>
            <button type="button" className="text-muted underline" disabled={busy} onClick={() => act("remove")}>{t("parent.stop")}</button>
          </div>
        </>
      ) : (
        <Button onClick={() => act("create")} disabled={busy}>{t("parent.create")}</Button>
      )}
      <p className="text-xs text-muted">{t("parent.privacy")}</p>
    </Card>
  );
}

// ───────────── Invite friends ─────────────

export function InviteCard({ code, invited, joined }: { code: string; invited: number; joined: number }) {
  const t = useT();
  return (
    <Card className="space-y-3">
      <CardTitle>🎁 {t("invite.title")}</CardTitle>
      <p className="text-sm text-muted">{t("invite.text")}</p>
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => shareText(`${t("invite.shareText")}\n${origin()}/r/${code}`)}>📤 {t("invite.send")}</Button>
        <span className="text-sm">{t("invite.stats", { joined, invited })}</span>
      </div>
    </Card>
  );
}

/** Opened from a shared group link: confirm, then join. */
export function JoinGroupPrompt({ code, name, members }: { code: string; name: string; members: number }) {
  const t = useT();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  async function join() {
    try {
      const r = await apiFetch<{ groupId: string }>("/api/v1/groups", { body: { action: "join", code } });
      router.push(`/groups/${r.groupId}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("teacher.error"));
    }
  }
  return (
    <Card className="mx-auto max-w-md space-y-3 text-center">
      <p className="text-4xl">👥</p>
      <h1 className="text-xl font-bold">{name}</h1>
      <p className="text-sm text-muted">{t("groups.membersN", { n: members })}</p>
      <p className="text-xs text-muted">{t("groups.privacy")}</p>
      {error && <Alert tone="danger">{error}</Alert>}
      <Button className="w-full" onClick={join}>{t("groups.joinThis")}</Button>
    </Card>
  );
}
