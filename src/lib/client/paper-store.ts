"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Paper timer: the student solves a printed/PDF paper; the app only keeps time.
 * Derived from timestamps (like the focus timer), so it survives reloads and a sleeping phone.
 */
export interface PaperState {
  clientId: string | null;
  title: string;
  plannedMinutes: number;
  totalQuestions: number | null;
  startedAt: number | null;
  phase: "idle" | "running" | "paused";
  segmentStart: number | null;
  accumulated: number; // ms
  pauseCount: number;
  laps: number[]; // active seconds at which each section was finished
  warned: number[]; // minutes-left alerts already given
  start: (s: { clientId: string; title: string; plannedMinutes: number; totalQuestions: number | null }) => void;
  pause: () => void;
  resume: () => void;
  lap: () => void;
  markWarned: (min: number) => void;
  reset: () => void;
}

const idle = { clientId: null, title: "", plannedMinutes: 0, totalQuestions: null, startedAt: null, phase: "idle" as const, segmentStart: null, accumulated: 0, pauseCount: 0, laps: [], warned: [] };

export const usePaper = create<PaperState>()(
  persist(
    (set, get) => ({
      ...idle,
      start: (s) => {
        const now = Date.now();
        set({ ...idle, ...s, startedAt: now, phase: "running", segmentStart: now });
      },
      pause: () => {
        const st = get();
        if (st.phase !== "running" || !st.segmentStart) return;
        set({ phase: "paused", accumulated: st.accumulated + (Date.now() - st.segmentStart), segmentStart: null, pauseCount: st.pauseCount + 1 });
      },
      resume: () => {
        if (get().phase === "paused") set({ phase: "running", segmentStart: Date.now() });
      },
      lap: () => set({ laps: [...get().laps, Math.round(paperMs(get()) / 1000)].slice(0, 20) }),
      markWarned: (min) => set({ warned: [...get().warned, min] }),
      reset: () => set({ ...idle }),
    }),
    { name: "rp_paper_v1" },
  ),
);

export function paperMs(s: Pick<PaperState, "phase" | "segmentStart" | "accumulated">, now = Date.now()) {
  return s.accumulated + (s.phase === "running" && s.segmentStart ? now - s.segmentStart : 0);
}
