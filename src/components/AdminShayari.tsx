"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, apiFetch } from "@/lib/client/api";
import { Alert, Badge, Button, Card, CardTitle, cx, inputClass } from "./ui";

type Item = { id: string; text: string; poet: string; source: string; meaning: string; lang: string; active: boolean };

export function AdminShayari({ items }: { items: Item[] }) {
  const router = useRouter();
  const [raw, setRaw] = useState("");
  const [lang, setLang] = useState("hi");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "success" | "danger"; text: string } | null>(null);

  async function add() {
    setBusy(true);
    setMsg(null);
    try {
      const r = await apiFetch<{ added: number; skipped: string[] }>("/api/v1/admin/shayari", { body: { action: "add", raw, lang } });
      setMsg({ tone: "success", text: `${r.added} added.${r.skipped.length ? ` Skipped ${r.skipped.length}: ${r.skipped.slice(0, 5).join("; ")}` : ""}` });
      if (r.added) setRaw("");
      router.refresh();
    } catch (e) {
      setMsg({ tone: "danger", text: e instanceof ApiError ? e.message : "Couldn't add." });
    } finally {
      setBusy(false);
    }
  }

  async function op(body: object) {
    await apiFetch("/api/v1/admin/shayari", { body }).catch(() => undefined);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <CardTitle>Add lines</CardTitle>
        <p className="text-sm text-muted">
          One line per entry: <code>text || poet || source || meaning</code>. Use <code> / </code> between the two verses of a sher or doha.
          Poet is required. Source and meaning are optional. Example:
        </p>
        <pre className="overflow-x-auto rounded-xl bg-surface-2 p-2 text-xs">करत करत अभ्यास के, जड़मति होत सुजान। / रसरी आवत जात ते, सिल पर परत निसान॥ || वृंद || दोहा || लगातार अभ्यास से कमज़ोर भी होशियार बनता है।</pre>
        <textarea className={cx(inputClass, "min-h-40 py-2 font-mono text-xs")} value={raw} onChange={(e) => setRaw(e.target.value)} placeholder="Paste lines here…" />
        <div className="flex flex-wrap items-center gap-2">
          <select className={cx(inputClass, "w-auto")} value={lang} onChange={(e) => setLang(e.target.value)} aria-label="Language">
            <option value="hi">Hindi</option><option value="ur">Urdu shayari</option><option value="sa">Sanskrit</option><option value="en">English</option><option value="bn">Bengali</option>
          </select>
          <Button onClick={add} disabled={busy || !raw.trim()}>{busy ? "Adding…" : "Add lines"}</Button>
        </div>
        <p className="text-xs text-muted">Please add only real, famous lines by named poets, and avoid copyrighted work by modern poets unless you have permission.</p>
        {msg && <Alert tone={msg.tone}>{msg.text}</Alert>}
      </Card>

      <Card>
        <CardTitle>Added by you ({items.length})</CardTitle>
        {items.length === 0 ? <p className="text-sm text-muted">Nothing added yet. The built-in lines are always shown.</p> : (
          <ul className="divide-y divide-border">
            {items.map((x) => (
              <li key={x.id} className="flex items-start justify-between gap-3 py-2.5">
                <div className="min-w-0 text-sm">
                  <p className="whitespace-pre-line">{x.text.split(" / ").join("\n")}</p>
                  <p className="text-xs text-muted">— {x.poet}{x.source ? ` · ${x.source}` : ""} <Badge>{x.lang}</Badge> {!x.active && <Badge tone="warning">hidden</Badge>}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button variant="secondary" onClick={() => op({ action: "toggle", id: x.id, active: !x.active })}>{x.active ? "Hide" : "Show"}</Button>
                  <Button variant="ghost" onClick={() => window.confirm("Delete this line?") && op({ action: "delete", id: x.id })}>Delete</Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
