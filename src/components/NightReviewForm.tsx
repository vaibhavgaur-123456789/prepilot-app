"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/client/api";
import { Alert, Button, Card, CardTitle, cx, inputClass } from "./ui";

export function NightReviewForm({ date, question, blockers, current, reviewed }: { date: string; question: string | null; blockers: Record<string, string>; current: string | null; reviewed: boolean }) {
  const router = useRouter();
  const [blocker, setBlocker] = useState<string | null>(current);
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState<{ tone: "success" | "danger"; text: string } | null>(reviewed ? { tone: "success", text: "Already reviewed. You can update your answer." } : null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      const r = await apiFetch<{ hint: string }>("/api/v1/review", { method: "POST", body: { kind: "night", data: { date, blocker, note } } });
      setMsg({ tone: "success", text: `Saved. ${r.hint}` });
      router.refresh();
    } catch (e) {
      setMsg({ tone: "danger", text: e instanceof ApiError ? e.message : "Couldn't save." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardTitle>{question ?? "Anything that got in the way today?"}</CardTitle>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {Object.entries(blockers).map(([k, l]) => (
          <button key={k} type="button" aria-pressed={blocker === k} onClick={() => setBlocker(blocker === k ? null : k)} className={cx("min-h-11 rounded-xl border px-3 text-sm font-medium", blocker === k ? "border-primary bg-primary-soft text-primary" : "border-border")}>{l}</button>
        ))}
      </div>
      <textarea className={cx(inputClass, "mt-3 min-h-20 py-2")} placeholder="Note (optional)" maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />
      {msg && <div className="mt-3"><Alert tone={msg.tone}>{msg.text}</Alert></div>}
      <Button className="mt-3" onClick={submit} disabled={busy}>Save review</Button>
    </Card>
  );
}
