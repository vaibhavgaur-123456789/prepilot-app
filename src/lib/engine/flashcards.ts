import { addDays } from "./dates";

export type CardGrade = "AGAIN" | "HARD" | "GOOD" | "EASY";

export interface CardState {
  intervalDays: number;
  ease: number;
  reps: number;
  lapses: number;
}

/**
 * Simplified SM-2 spacing. "Again" brings the card back tomorrow and makes it slightly harder;
 * good answers push it further out. Intervals are capped at 180 days (exam prep, not lifelong recall).
 */
export function reviewCard(card: CardState, grade: CardGrade, today: string): CardState & { dueOn: string } {
  let { intervalDays, ease, reps, lapses } = card;
  if (grade === "AGAIN") {
    lapses += 1;
    reps = 0;
    ease = Math.max(1.3, ease - 0.2);
    intervalDays = 1;
  } else {
    reps += 1;
    if (grade === "HARD") ease = Math.max(1.3, ease - 0.15);
    if (grade === "EASY") ease = Math.min(3, ease + 0.15);
    const base = reps === 1 ? 1 : reps === 2 ? 3 : Math.round(intervalDays * ease);
    const factor = grade === "HARD" ? 0.6 : grade === "EASY" ? 1.4 : 1;
    intervalDays = Math.max(1, Math.round(base * factor));
  }
  intervalDays = Math.min(180, intervalDays);
  return { intervalDays, ease: Math.round(ease * 100) / 100, reps, lapses, dueOn: addDays(today, intervalDays) };
}
