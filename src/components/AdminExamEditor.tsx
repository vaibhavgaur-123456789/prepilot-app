"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/client/api";
import { Alert, Badge, Button, Card, CardTitle, inputClass, PageHeader } from "./ui";

type Topic = { id: string; name: string; slug: string; weightage: number; difficulty: number; estimatedMinutes: number; parentId: string | null; subjectId: string; _count: { questions: number } };
type Exam = {
  id: string; name: string; durationMinutes: number; negativeMarking: number; marksPerQuestion: number; isActive: boolean;
  subjects: { id: string; name: string; weightage: number; topics: Topic[] }[];
  benchmarks: { id: string; metric: string; value: number; p25: number | null; p75: number | null; source: string; sampleSize: number }[];
  mocks: { id: string; title: string; type: string; durationMinutes: number; _count: { questions: number } }[];
};
const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

type Question = { id: string; stem: string; options: string[]; correctIndex: number; explanation: string; difficulty: number; expectedSeconds: number; isActive: boolean };

export function AdminExamEditor({ exam, topicId, questions }: { exam: Exam; topicId: string | null; questions: Question[] }) {
  const router = useRouter();
  const [msg, setMsg] = useState<{ tone: "success" | "danger"; text: string } | null>(null);
  const [draft, setDraft] = useState({ stem: "", options: ["", "", "", ""], correctIndex: 0, explanation: "", difficulty: 3, expectedSeconds: 45 });
  const topic = exam.subjects.flatMap((s) => s.topics).find((t) => t.id === topicId);

  async function op(body: Record<string, unknown>, ok: string) {
    setMsg(null);
    try {
      await apiFetch("/api/v1/admin", { method: "POST", body });
      setMsg({ tone: "success", text: ok });
      router.refresh();
    } catch (e) {
      setMsg({ tone: "danger", text: e instanceof ApiError ? e.message : "Failed." });
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader title={exam.name} subtitle={`${exam.durationMinutes} min · ${exam.marksPerQuestion} marks/question · −${exam.negativeMarking} negative`} action={<Button variant="secondary" onClick={() => op({ op: "exam.update", id: exam.id, data: { isActive: !exam.isActive } }, exam.isActive ? "Exam hidden from onboarding." : "Exam activated.")}>{exam.isActive ? "Deactivate" : "Activate"}</Button>} />
      {msg && <Alert tone={msg.tone}>{msg.text}</Alert>}
      {!exam.isActive && <Alert tone="warning" title="Hidden from students">This exam isn&apos;t offered in onboarding yet. Add subjects, topics and questions, build tests, then press Activate.</Alert>}

      <Card>
        <CardTitle>Add a subject</CardTitle>
        <form className="flex flex-wrap items-end gap-2" onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          const name = String(f.get("name") ?? "").trim();
          op({ op: "subject.create", examId: exam.id, data: { name, slug: slugify(name) || `s-${Date.now().toString(36)}`, weightage: Number(f.get("weightage") || 1), isQuantitative: f.get("quant") === "on", isMemoryBased: f.get("memory") === "on" } }, `Subject "${name}" added.`);
          e.currentTarget.reset();
        }}>
          <label className="block flex-1"><span className="mb-1 block text-xs font-medium">Name</span><input name="name" required minLength={2} maxLength={80} className={inputClass} placeholder="e.g. Mathematics" /></label>
          <label className="block w-28"><span className="mb-1 block text-xs font-medium">Weight (marks)</span><input name="weightage" type="number" min={0} max={100} defaultValue={25} className={inputClass} /></label>
          <label className="flex items-center gap-1 text-xs"><input name="quant" type="checkbox" /> Calculation-based</label>
          <label className="flex items-center gap-1 text-xs"><input name="memory" type="checkbox" /> Memory/GK-based</label>
          <Button type="submit">Add subject</Button>
        </form>
      </Card>

      <Card>
        <CardTitle>Syllabus: weightage & difficulty (1–5)</CardTitle>
        {exam.subjects.map((s) => (
          <div key={s.id} className="mb-4">
            <p className="mb-1 text-sm font-semibold">{s.name} <span className="text-xs font-normal text-muted">(subject weight {s.weightage})</span></p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead><tr className="text-left text-xs text-muted"><th className="py-1">Topic</th><th>Weight</th><th>Difficulty</th><th>Est. min</th><th>Questions</th></tr></thead>
                <tbody>
                  {s.topics.map((t) => (
                    <tr key={t.id} className="border-t border-border">
                      <td className="py-1.5">{t.parentId ? "↳ " : ""}<Link href={`/admin/exams/${exam.id}?topic=${t.id}`} className="text-primary">{t.name}</Link></td>
                      {(["weightage", "difficulty", "estimatedMinutes"] as const).map((k) => (
                        <td key={k}>
                          <input aria-label={`${t.name} ${k}`} type="number" defaultValue={t[k]} min={k === "estimatedMinutes" ? 15 : 1} max={k === "estimatedMinutes" ? 3000 : 5} className="h-9 w-20 rounded-lg border border-border bg-surface px-2"
                            onBlur={(e) => { const val = Number(e.target.value); if (val !== t[k]) op({ op: "topic.upsert", data: { id: t.id, subjectId: t.subjectId, name: t.name, slug: t.slug, weightage: t.weightage, difficulty: t.difficulty, estimatedMinutes: t.estimatedMinutes, parentId: t.parentId, [k]: val } }, `Updated ${t.name}.`); }} />
                        </td>
                      ))}
                      <td className="tabular">{t._count.questions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <form className="mt-2 flex flex-wrap items-end gap-2" onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              const name = String(f.get("name") ?? "").trim();
              op({ op: "topic.upsert", data: { subjectId: s.id, name, slug: slugify(name) || `t-${Date.now().toString(36)}`, weightage: Number(f.get("weightage") || 3), difficulty: Number(f.get("difficulty") || 3), estimatedMinutes: Number(f.get("minutes") || 180), parentId: null } }, `Topic "${name}" added to ${s.name}.`);
              e.currentTarget.reset();
            }}>
              <input name="name" required minLength={2} maxLength={80} aria-label={`New topic in ${s.name}`} className={`${inputClass} min-h-9 flex-1`} placeholder={`New topic in ${s.name}`} />
              <input name="weightage" type="number" min={1} max={5} defaultValue={3} aria-label="Weight 1-5" title="Importance 1–5" className="h-9 w-16 rounded-lg border border-border bg-surface px-2" />
              <input name="difficulty" type="number" min={1} max={5} defaultValue={3} aria-label="Difficulty 1-5" title="Difficulty 1–5" className="h-9 w-16 rounded-lg border border-border bg-surface px-2" />
              <input name="minutes" type="number" min={15} max={3000} defaultValue={180} aria-label="Study minutes" title="Minutes to learn" className="h-9 w-20 rounded-lg border border-border bg-surface px-2" />
              <Button type="submit" variant="secondary">Add topic</Button>
            </form>
          </div>
        ))}
        {exam.subjects.length === 0 && <p className="text-sm text-muted">No subjects yet. Add one above.</p>}
      </Card>

      {topic && (
        <Card>
          <CardTitle>Questions: {topic.name} ({questions.length})</CardTitle>
          <ul className="mb-4 space-y-2">
            {questions.map((q) => (
              <li key={q.id} className="rounded-xl border border-border p-3 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <p>{q.stem}</p>
                  <button className="text-xs font-semibold text-primary" onClick={() => op({ op: "question.upsert", data: { ...q, topicId: topic.id, isActive: !q.isActive } }, q.isActive ? "Question retired." : "Question restored.")}>{q.isActive ? "Retire" : "Restore"}</button>
                </div>
                <p className="mt-1 text-xs text-muted">Answer: {q.options[q.correctIndex]} · difficulty {q.difficulty} {!q.isActive && <Badge>retired</Badge>}</p>
              </li>
            ))}
          </ul>
          <form className="space-y-2" onSubmit={(e) => { e.preventDefault(); op({ op: "question.upsert", data: { ...draft, topicId: topic.id, isActive: true } }, "Question added."); setDraft({ ...draft, stem: "", options: ["", "", "", ""], explanation: "" }); }}>
            <p className="text-sm font-semibold">Add a question</p>
            <textarea required className={`${inputClass} min-h-20 py-2`} placeholder="Question" value={draft.stem} onChange={(e) => setDraft({ ...draft, stem: e.target.value })} />
            {draft.options.map((o, i) => (
              <label key={i} className="flex items-center gap-2">
                <input type="radio" name="correct" checked={draft.correctIndex === i} onChange={() => setDraft({ ...draft, correctIndex: i })} aria-label={`Option ${i + 1} is correct`} />
                <input required className={inputClass} placeholder={`Option ${String.fromCharCode(65 + i)}`} value={o} onChange={(e) => setDraft({ ...draft, options: draft.options.map((x, j) => (j === i ? e.target.value : x)) })} />
              </label>
            ))}
            <textarea className={`${inputClass} min-h-16 py-2`} placeholder="Explanation" value={draft.explanation} onChange={(e) => setDraft({ ...draft, explanation: e.target.value })} />
            <Button type="submit">Add question</Button>
          </form>
        </Card>
      )}

      <Card>
        <CardTitle>Benchmarks</CardTitle>
        <p className="mb-2 text-xs text-muted">REFERENCE values are editable and always labelled &quot;illustrative&quot; to students. AGGREGATE values are computed from opted-in students (k ≥ 20) by the benchmarks cron job and can&apos;t be edited.</p>
        <ul className="space-y-2">
          {exam.benchmarks.map((b) => (
            <li key={b.id} className="flex flex-wrap items-center gap-2 text-sm">
              <span className="w-40 font-medium">{b.metric}</span><Badge tone={b.source === "AGGREGATE" ? "success" : "warning"}>{b.source.toLowerCase()}</Badge>
              {b.source === "REFERENCE" ? (
                <input aria-label={`${b.metric} median`} type="number" defaultValue={b.value} className="h-9 w-24 rounded-lg border border-border bg-surface px-2" onBlur={(e) => Number(e.target.value) !== b.value && op({ op: "benchmark.update", id: b.id, data: { value: Number(e.target.value), p25: b.p25, p75: b.p75 } }, "Benchmark updated.")} />
              ) : <span className="tabular">{b.value} (n={b.sampleSize})</span>}
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <CardTitle action={<Button variant="secondary" onClick={() => op({ op: "mocks.build", examId: exam.id }, "Tests rebuilt from the question bank.")}>Build / refresh tests</Button>}>Official mocks</CardTitle>
        <p className="mb-2 text-xs text-muted">Builds a full mock (following the exam pattern), a sectional test per subject and a baseline diagnostic from the questions above. Tests students already took are kept.</p>
        <ul className="text-sm">{exam.mocks.map((m) => <li key={m.id} className="py-1">{m.title} · {m.type.toLowerCase()} · {m._count.questions} q · {m.durationMinutes} min</li>)}</ul>
      </Card>
    </div>
  );
}
