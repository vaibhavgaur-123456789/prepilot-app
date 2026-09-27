"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/client/api";
import { Alert, Button, Card, CardTitle, inputClass } from "./ui";

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

/** Create a new exam (e.g. CDS, CUET, UPSSSC PET). It starts hidden until you activate it. */
export function AdminNewExam() {
  const router = useRouter();
  const [f, setF] = useState({ name: "", shortName: "", category: "GENERAL", durationMinutes: 60, totalQuestions: 100, marksPerQuestion: 1, negativeMarking: 0.25 });
  const [msg, setMsg] = useState<{ tone: "success" | "danger"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const exam = await apiFetch<{ id: string }>("/api/v1/admin", { method: "POST", body: { op: "exam.create", data: { ...f, slug: slugify(f.shortName || f.name) || `exam-${Date.now().toString(36)}` } } });
      router.push(`/admin/exams/${exam.id}`);
    } catch (err) {
      setMsg({ tone: "danger", text: err instanceof ApiError ? err.message : "Couldn't create the exam." });
      setBusy(false);
    }
  }

  const num = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: Number(e.target.value) });
  return (
    <Card>
      <CardTitle>Add a new exam</CardTitle>
      <form onSubmit={create} className="grid gap-3 sm:grid-cols-2">
        <label className="block sm:col-span-2"><span className="mb-1 block text-sm font-medium">Full name</span><input required minLength={2} maxLength={100} className={inputClass} placeholder="e.g. CDS Exam (Combined Defence Services)" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
        <label className="block"><span className="mb-1 block text-sm font-medium">Short name</span><input required minLength={2} maxLength={30} className={inputClass} placeholder="e.g. CDS" value={f.shortName} onChange={(e) => setF({ ...f, shortName: e.target.value })} /></label>
        <label className="block"><span className="mb-1 block text-sm font-medium">Category</span>
          <select className={inputClass} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>
            {["SSC", "RAILWAY", "BANKING", "STATE", "DEFENCE", "CUET", "TEACHING", "POLICE", "GENERAL"].map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <label className="block"><span className="mb-1 block text-sm font-medium">Duration (min)</span><input type="number" min={5} max={600} className={inputClass} value={f.durationMinutes} onChange={num("durationMinutes")} /></label>
        <label className="block"><span className="mb-1 block text-sm font-medium">Total questions</span><input type="number" min={1} max={500} className={inputClass} value={f.totalQuestions} onChange={num("totalQuestions")} /></label>
        <label className="block"><span className="mb-1 block text-sm font-medium">Marks per question</span><input type="number" step="0.25" min={0.25} max={10} className={inputClass} value={f.marksPerQuestion} onChange={num("marksPerQuestion")} /></label>
        <label className="block"><span className="mb-1 block text-sm font-medium">Negative marks per wrong answer</span><input type="number" step="0.01" min={0} max={10} className={inputClass} value={f.negativeMarking} onChange={num("negativeMarking")} /></label>
        <div className="sm:col-span-2">
          {msg && <div className="mb-2"><Alert tone={msg.tone}>{msg.text}</Alert></div>}
          <Button type="submit" disabled={busy}>{busy ? "Creating…" : "Create exam"}</Button>
          <p className="mt-2 text-xs text-muted">Next: add subjects → topics → questions, build tests, then activate. Students only see active exams.</p>
        </div>
      </form>
    </Card>
  );
}
