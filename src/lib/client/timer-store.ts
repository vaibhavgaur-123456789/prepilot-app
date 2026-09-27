"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Focus-session timer. State is derived from timestamps (not a ticking counter),
 * so it survives reloads, sleeping phones and offline periods.
 */
export interface TimerState {
  clientId: string | null;
  taskId: string | null;
  topicId: string | null;
  title: string;
  mode: "TIMER" | "STOPWATCH";
  plannedMinutes: number;
  startedAt: number | null; // epoch ms
  phase: "idle" | "running" | "paused" | "break";
  segmentStart: number | null; // when the current running/break segment began
  accumulatedActive: number; // ms of active time in finished segments
  accumulatedBreak: number;
  pauseCount: number;
  distractions: number;
  start: (s: { clientId: string; taskId: string | null; topicId: string | null; title: string; mode: "TIMER" | "STOPWATCH"; plannedMinutes: number }) => void;
  pause: () => void;
  resume: () => void;
  startBreak: () => void;
  addDistraction: () => void;
  reset: () => void;
}

const idle = {
  clientId: null, taskId: null, topicId: null, title: "", mode: "TIMER" as const, plannedMinutes: 0, startedAt: null,
  phase: "idle" as const, segmentStart: null, accumulatedActive: 0, accumulatedBreak: 0, pauseCount: 0, distractions: 0,
};

export const useTimer = create<TimerState>()(
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
        set({ phase: "paused", accumulatedActive: st.accumulatedActive + (Date.now() - st.segmentStart), segmentStart: null, pauseCount: st.pauseCount + 1 });
      },
      resume: () => {
        const st = get();
        const now = Date.now();
        if (st.phase === "break" && st.segmentStart) set({ accumulatedBreak: st.accumulatedBreak + (now - st.segmentStart) });
        if (st.phase === "paused" || st.phase === "break") set({ phase: "running", segmentStart: now });
      },
      startBreak: () => {
        const st = get();
        const now = Date.now();
        const extra = st.phase === "running" && st.segmentStart ? now - st.segmentStart : 0;
        set({ phase: "break", accumulatedActive: st.accumulatedActive + extra, segmentStart: now });
      },
      addDistraction: () => set({ distractions: get().distractions + 1 }),
      reset: () => set({ ...idle }),
    }),
    { name: "pp_timer_v1" },
  ),
);

export function activeMs(s: Pick<TimerState, "phase" | "segmentStart" | "accumulatedActive">, now = Date.now()) {
  return s.accumulatedActive + (s.phase === "running" && s.segmentStart ? now - s.segmentStart : 0);
}
export function breakMs(s: Pick<TimerState, "phase" | "segmentStart" | "accumulatedBreak">, now = Date.now()) {
  return s.accumulatedBreak + (s.phase === "break" && s.segmentStart ? now - s.segmentStart : 0);
}
export function fmtClock(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
