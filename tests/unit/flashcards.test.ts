import { describe, expect, it } from "vitest";
import { reviewCard } from "@/lib/engine/flashcards";

const fresh = { intervalDays: 0, ease: 2.5, reps: 0, lapses: 0 };

describe("flashcard spacing", () => {
  it("grows the interval with good answers", () => {
    const a = reviewCard(fresh, "GOOD", "2026-10-01");
    expect(a.intervalDays).toBe(1);
    expect(a.dueOn).toBe("2026-10-02");
    const b = reviewCard(a, "GOOD", "2026-10-02");
    expect(b.intervalDays).toBe(3);
    const c = reviewCard(b, "GOOD", "2026-10-05");
    expect(c.intervalDays).toBe(8);
  });
  it("sends a forgotten card back to tomorrow and lowers ease", () => {
    const c = reviewCard({ intervalDays: 20, ease: 2.5, reps: 5, lapses: 0 }, "AGAIN", "2026-10-01");
    expect(c.dueOn).toBe("2026-10-02");
    expect(c.lapses).toBe(1);
    expect(c.ease).toBeLessThan(2.5);
    expect(c.reps).toBe(0);
  });
  it("never goes beyond 180 days or below ease 1.3", () => {
    let s = { ...fresh, ease: 3 };
    for (let i = 0; i < 20; i++) s = reviewCard(s, "EASY", "2026-10-01");
    expect(s.intervalDays).toBe(180);
    let h = fresh;
    for (let i = 0; i < 20; i++) h = reviewCard(h, "AGAIN", "2026-10-01");
    expect(h.ease).toBe(1.3);
  });
});
