import { addDays, diffDays } from "./dates";

/**
 * Consecutive qualifying days ending today (or yesterday, if today isn't done yet).
 * One missed day per rolling 7 days is forgiven, so a single rest day doesn't wipe out weeks of work.
 * Days the student marked as leave (`rest`) neither count nor break the streak.
 */
export function currentStreak(qualifying: Set<string>, today: string, rest: Set<string> = new Set()): { streak: number; forgivenOn: string | null } {
  let d = qualifying.has(today) || rest.has(today) ? today : addDays(today, -1);
  let streak = 0;
  let lastForgiven: string | null = null;
  let forgivenOn: string | null = null;
  for (let guard = 0; guard < 3650; guard++) {
    if (qualifying.has(d)) {
      streak++;
    } else if (rest.has(d)) {
      // planned leave: skip over it
    } else {
      const prev = addDays(d, -1);
      const canForgive = streak > 0 && (qualifying.has(prev) || rest.has(prev)) && (lastForgiven === null || diffDays(d, lastForgiven) >= 7);
      if (!canForgive) break;
      lastForgiven = d;
      forgivenOn ??= d;
    }
    d = addDays(d, -1);
  }
  return { streak, forgivenOn };
}

export function bestStreak(qualifying: Set<string>, rest: Set<string> = new Set()): number {
  const days = [...qualifying].sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of days) {
    let bridged = false;
    if (prev) {
      // consecutive, or only leave days in between
      bridged = true;
      for (let x = addDays(prev, 1); x < d; x = addDays(x, 1)) if (!rest.has(x)) bridged = false;
    }
    run = bridged ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}
