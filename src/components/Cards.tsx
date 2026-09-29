"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, apiFetch } from "@/lib/client/api";
import { useT } from "@/i18n/client";
import { Alert, Button, Card, CardTitle, cx, EmptyState, inputClass, PageHeader, Stat } from "./ui";

type Due = { id: string; deck: string; front: string; back: string; reps: number };
type Listed = { id: string; deck: string; front: string; back: string; dueOn: string };

export function CardsApp({ due, total, decks, all }: { due: Due[]; total: number; decks: { deck: string; count: number }[]; all: Listed[] }) {
  const t = useT();
  const router = useRouter();
  const [queue, setQueue] = useState(due);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(0);
  const [deck, setDeck] = useState(decks[0]?.deck ?? "");
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [bulk, setBulk] = useState("");
  const [msg, setMsg] = useState<{ tone: "success" | "danger"; text: string } | null>(null);
  const card = queue[0];

  async function grade(g: "AGAIN" | "HARD" | "GOOD" | "EASY") {
    if (!card) return;
    setFlipped(false);
    // "Again" puts the card at the back of today's queue so it's seen once more.
    setQueue((q) => (g === "AGAIN" ? [...q.slice(1), q[0]] : q.slice(1)));
    if (g !== "AGAIN") setDone((d) => d + 1);
    await apiFetch("/api/v1/cards", { body: { action: "grade", id: card.id, grade: g } }).catch(() => undefined);
  }

  async function add(cards: { deck: string; front: string; back: string }[]) {
    setMsg(null);
    try {
      const r = await apiFetch<{ added: number }>("/api/v1/cards", { body: { action: "add", cards } });
      setMsg({ tone: "success", text: t("cards.added", { n: r.added }) });
      setFront("");
      setBack("");
      setBulk("");
      router.refresh();
    } catch (e) {
      setMsg({ tone: "danger", text: e instanceof ApiError ? e.message : t("teacher.error") });
    }
  }

  function addBulk() {
    const cards = bulk.split(/\r?\n/).map((l) => l.split("|").map((s) => s.trim())).filter(([f, b]) => f && b).map(([f, b]) => ({ deck, front: f, back: b }));
    if (cards.length === 0) return setMsg({ tone: "danger", text: t("cards.bulkHelp") });
    add(cards);
  }

  async function remove(id: string) {
    if (!window.confirm(t("cards.deleteConfirm"))) return;
    await apiFetch("/api/v1/cards", { body: { action: "delete", id } }).catch(() => undefined);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <PageHeader title={`🃏 ${t("cards.title")}`} subtitle={t("cards.subtitle")} />
      <div className="grid grid-cols-3 gap-2">
        <Stat label={t("cards.dueToday")} value={queue.length} />
        <Stat label={t("cards.doneToday")} value={done} />
        <Stat label={t("cards.total")} value={total} />
      </div>

      {card ? (
        <Card className="space-y-4 text-center">
          {card.deck && <p className="text-xs font-semibold uppercase tracking-wider text-muted">{card.deck}</p>}
          <button type="button" onClick={() => setFlipped((f) => !f)} className={cx("press grid min-h-44 w-full place-items-center rounded-2xl border-2 p-4 text-lg font-semibold whitespace-pre-line", flipped ? "border-success bg-success-soft" : "border-primary bg-primary-soft")} aria-live="polite">
            {flipped ? card.back : card.front}
          </button>
          {!flipped ? (
            <Button className="w-full" onClick={() => setFlipped(true)}>{t("cards.show")}</Button>
          ) : (
            <div className="grid grid-cols-4 gap-1.5">
              {([["AGAIN", "cards.again", "danger"], ["HARD", "cards.hard", "secondary"], ["GOOD", "cards.good", "secondary"], ["EASY", "cards.easy", "primary"]] as const).map(([g, key, v]) => (
                <Button key={g} variant={v} onClick={() => grade(g)}>{t(key)}</Button>
              ))}
            </div>
          )}
          <p className="text-xs text-muted">{t("cards.how")}</p>
        </Card>
      ) : (
        <EmptyState title={total ? t("cards.allDone") : t("cards.empty")}>{total ? t("cards.allDoneText") : t("cards.emptyText")}</EmptyState>
      )}

      <Card className="space-y-3">
        <CardTitle>{t("cards.add")}</CardTitle>
        <input className={inputClass} list="rp-decks" value={deck} maxLength={60} placeholder={t("cards.deckPh")} onChange={(e) => setDeck(e.target.value)} aria-label={t("cards.deck")} />
        <datalist id="rp-decks">{decks.map((d) => <option key={d.deck} value={d.deck} />)}</datalist>
        <textarea className={cx(inputClass, "min-h-16 py-2")} value={front} maxLength={500} placeholder={t("cards.frontPh")} onChange={(e) => setFront(e.target.value)} aria-label={t("cards.front")} />
        <textarea className={cx(inputClass, "min-h-16 py-2")} value={back} maxLength={1000} placeholder={t("cards.backPh")} onChange={(e) => setBack(e.target.value)} aria-label={t("cards.back")} />
        <Button onClick={() => add([{ deck, front, back }])} disabled={!front.trim() || !back.trim()}>{t("cards.addOne")}</Button>
        <details className="text-sm">
          <summary className="cursor-pointer font-semibold text-primary">{t("cards.bulk")}</summary>
          <p className="mt-2 text-xs text-muted">{t("cards.bulkHelp")}</p>
          <textarea className={cx(inputClass, "mt-2 min-h-32 py-2 font-mono text-xs")} value={bulk} onChange={(e) => setBulk(e.target.value)} placeholder={"भारत की राजधानी? | नई दिल्ली\n(a+b)² | a² + 2ab + b²"} />
          <Button className="mt-2" variant="secondary" onClick={addBulk} disabled={!bulk.trim()}>{t("cards.addAll")}</Button>
        </details>
        {msg && <Alert tone={msg.tone}>{msg.text}</Alert>}
      </Card>

      {all.length > 0 && (
        <Card>
          <CardTitle>{t("cards.mine")}</CardTitle>
          <ul className="divide-y divide-border text-sm">
            {all.map((c) => (
              <li key={c.id} className="flex items-start justify-between gap-2 py-2">
                <span className="min-w-0"><b>{c.front}</b> → {c.back} {c.deck && <span className="text-xs text-muted">· {c.deck}</span>}</span>
                <button type="button" className="shrink-0 text-xs text-muted underline" onClick={() => remove(c.id)}>✕</button>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
