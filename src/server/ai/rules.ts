import { formatMinutes } from "@/lib/engine/dates";
import { MISTAKE_FIXES } from "@/lib/engine/mistakes";
import type { CoachContext } from "./context";

export type Intent = "TODAY" | "MISSED" | "LIMITED_TIME" | "SUBJECT_FALLING" | "WHY_WRONG" | "REVISION_PLAN" | "LAST_MOCK" | "READINESS" | "GENERAL";

export function detectIntent(text: string): { intent: Intent; hours?: number; subject?: string } {
  const t = text.toLowerCase();
  const hours = t.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h\b|ghante)/);
  if (hours) return { intent: "LIMITED_TIME", hours: Number(hours[1]) };
  if (/miss|skipped|couldn'?t study|didn'?t study|nahi padh|chhut/.test(t)) return { intent: "MISSED" };
  if (/mock|test result|last test|analy[sz]e/.test(t)) return { intent: "LAST_MOCK" };
  if (/why .*wrong|getting .*wrong|mistake|galat/.test(t)) return { intent: "WHY_WRONG" };
  if (/revis/.test(t)) return { intent: "REVISION_PLAN" };
  if (/falling|dropping|declin|worse|gir/.test(t)) return { intent: "SUBJECT_FALLING" };
  if (/ready|readiness|chance|selection|clear the exam/.test(t)) return { intent: "READINESS" };
  if (/today|study now|what should i|aaj|kya padh/.test(t)) return { intent: "TODAY" };
  return { intent: "GENERAL" };
}

const pct = (v: number | null | undefined) => (v === null || v === undefined ? "–" : `${Math.round(v * (v <= 1 ? 100 : 1))}%`);

/** Deterministic, data-driven answers. Used when no LLM is configured or it is unavailable. */
export function ruleBasedAnswer(text: string, c: CoachContext): { intent: Intent; answer: string } {
  const { intent, hours } = detectIntent(text);
  const lines: string[] = [];
  const top = c.priorities.slice(0, 3);

  switch (intent) {
    case "TODAY": {
      const open = c.today.tasks.filter((t) => t.status !== "DONE" && t.status !== "SKIPPED");
      if (open.length === 0) lines.push("Today's plan is complete. If you have energy left, a 20-minute revision of a due topic is the best use of it.");
      else {
        lines.push(`You have ${open.length} block${open.length === 1 ? "" : "s"} left today (${formatMinutes(open.reduce((s, t) => s + t.minutes, 0))}). Start with:`);
        open.slice(0, 3).forEach((t, i) => lines.push(`${i + 1}. ${t.title} (${t.minutes} min)${t.reasons.length ? `, because ${t.reasons.join(", ")}` : ""}`));
      }
      if (c.revisionsDue.length) lines.push(`Also due: revision of ${c.revisionsDue.slice(0, 3).map((r) => r.topic).join(", ")}.`);
      break;
    }
    case "MISSED": {
      const missed = c.last7Days.filter((d) => d.planned > 0 && d.actual < d.planned * 0.5).length;
      lines.push("Missing a day doesn't undo your preparation. Your unfinished work was re-scheduled, reduced or merged, and nothing was silently dropped.");
      if (missed >= 3) lines.push(`${missed} of the last 7 days were below half the plan, so the planner may switch to recovery mode with a smaller, high-value daily plan.`);
      lines.push("Restart with one focused block today:");
      if (top[0]) lines.push(`→ ${top[0].topic}: ${top[0].reasons.join(", ")}`);
      lines.push("Then do any due revision. Two good blocks beat one exhausting catch-up day.");
      break;
    }
    case "LIMITED_TIME": {
      const mins = Math.round((hours ?? 2) * 60);
      lines.push(`With ${formatMinutes(mins)} today, here's the highest-value split:`);
      let left = mins;
      let revised: string | null = null;
      if (c.revisionsDue.length && left >= 40) {
        revised = c.revisionsDue[0].topic;
        lines.push(`• 20 min: revise ${revised}${c.revisionsDue[0].overdueDays ? ` (overdue ${c.revisionsDue[0].overdueDays}d)` : ""}`);
        left -= 20;
      }
      for (const p of c.priorities.filter((x) => !revised || !x.topic.endsWith(`: ${revised}`)).slice(0, 3)) {
        if (left < 20) break;
        const m = Math.min(left, 45);
        lines.push(`• ${m} min: ${p.topic} (${p.reasons[0] ?? "high priority"})`);
        left -= m;
      }
      lines.push("Update your plan to match in Plan → Regenerate, or edit blocks directly.");
      break;
    }
    case "SUBJECT_FALLING": {
      const falling = c.subjects.filter((s) => s.recentAccuracy !== null && s.previousAccuracy !== null && s.recentAccuracy < s.previousAccuracy).sort((a, b) => (a.recentAccuracy! - a.previousAccuracy!) - (b.recentAccuracy! - b.previousAccuracy!));
      if (!falling.length) lines.push("I don't see a measurable decline in any subject yet. Recent accuracy is at or above the previous two-week window. Keep practising so the trend has enough data.");
      else {
        const f = falling[0];
        lines.push(`${f.name} accuracy moved from ${f.previousAccuracy}% to ${f.recentAccuracy}% over the last two weeks.`);
        const weakIn = c.weakTopics.filter((w) => w.subject === f.name);
        if (weakIn.length) lines.push(`Main contributors: ${weakIn.map((w) => `${w.topic} (${pct(w.accuracy)})`).join(", ")}.`);
        lines.push("Plan: concept recap → 15 easy questions → 15 medium → timed set → re-test. These weak topics are already on that recovery pathway in your plan.");
      }
      break;
    }
    case "WHY_WRONG": {
      const m = c.mistakes;
      if (!m.open) lines.push("Your mistake book is empty. Take a mock or topic test so I can see patterns.");
      else {
        if (m.top) lines.push(m.top.message, `Fix: ${m.top.fix}`);
        if (m.byTopic.length) lines.push(`Most mistakes are in: ${m.byTopic.slice(0, 3).map(([t, n]) => `${t} (${n})`).join(", ")}.`);
        const w = c.weakTopics[0];
        if (w) lines.push(`${w.topic}: ${pct(w.accuracy)} over ${w.attempts} questions, trend ${w.trend.toLowerCase()}.`);
      }
      break;
    }
    case "REVISION_PLAN": {
      if (!c.revisionsDue.length) lines.push("No revisions are due today. Your spaced schedule (1-3-7-14-30 days) is up to date.");
      else {
        lines.push(`${c.revisionsDue.length} revision${c.revisionsDue.length === 1 ? " is" : "s are"} due. Do them in this order (most overdue first), about 20 minutes each:`);
        c.revisionsDue.slice(0, 6).forEach((r, i) => lines.push(`${i + 1}. ${r.topic}${r.overdueDays ? ` (overdue ${r.overdueDays}d)` : ""}`));
        lines.push("Rate your recall honestly after each. Topics you forget come back sooner.");
      }
      break;
    }
    case "LAST_MOCK": {
      const m = c.lastMock;
      if (!m) lines.push("You haven't submitted a mock yet. Take one from the Tests tab and I'll analyse it here.");
      else {
        lines.push(`${m.title}: ${m.percent}% score, ${pct(m.accuracy)} accuracy, ${pct(m.attemptRate)} of questions attempted.`);
        const subj = [...m.bySubject].filter((s) => s.accuracy !== null).sort((a, b) => (a.accuracy ?? 0) - (b.accuracy ?? 0));
        if (subj.length) lines.push(`Weakest section: ${subj[0].name} (${pct(subj[0].accuracy)}). Strongest: ${subj[subj.length - 1].name} (${pct(subj[subj.length - 1].accuracy)}).`);
        m.insights.slice(0, 3).forEach((i) => lines.push(`• ${i}`));
      }
      break;
    }
    case "READINESS": {
      if (!c.readiness) lines.push("I don't have a readiness estimate yet.");
      else {
        lines.push(`Your Preparation Readiness is ${c.readiness.score}/100 (confidence: ${c.readiness.confidence.toLowerCase()}). This is an estimate from your measured data, not a probability of selection.`);
        const comps = Object.entries(c.readiness.components).filter(([, v]) => v !== null).sort((a, b) => (a[1] as number) - (b[1] as number));
        if (comps.length) lines.push(`Lowest component: ${comps[0][0]} (${comps[0][1]}). Improving it moves the score most.`);
      }
      lines.push(c.pace.summary);
      break;
    }
    default: {
      lines.push(`Here's where you stand: ${c.student.daysLeft} days to ${c.student.exam}.`);
      if (top.length) lines.push(`Top priorities: ${top.map((p) => p.topic).join("; ")}.`);
      if (c.mistakes.top) lines.push(`Recurring mistake type: ${c.mistakes.top.category.toLowerCase().replace("_", " ")}. ${MISTAKE_FIXES[c.mistakes.top.category]}`);
      lines.push("You can ask: \"What should I study today?\", \"I have only 2 hours\", \"Analyze my last mock\", \"Create a revision plan\".");
    }
  }
  return { intent, answer: lines.join("\n") };
}

export const COACH_SYSTEM = `You are PrepPilot's study coach for a student preparing for a competitive exam.
Answer using the student's measured data in the JSON context: cite specific numbers, topics and dates from it.
Prefer concrete next actions (what to study, for how long, in what order) over motivation.
Keep answers under about 180 words, using short lines or a numbered list.
Never claim or imply a probability of selection or a guaranteed result. Readiness is an estimate of preparation, not a prediction.
Distinguish measured data from estimates. If the data needed to answer isn't in the context, say what's missing and how the student can generate it (for example, take a mock).
Be supportive and factual, never shaming.`;
