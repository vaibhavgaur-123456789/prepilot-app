"use client";

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public details?: unknown) {
    super(message);
  }
}

/** JSON fetch with consistent, user-safe errors. */
export async function apiFetch<T = unknown>(url: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: init.method ?? (init.body ? "POST" : "GET"),
      headers: init.body !== undefined ? { "content-type": "application/json" } : undefined,
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      credentials: "same-origin",
    });
  } catch {
    throw new ApiError(0, "OFFLINE", "You seem to be offline. Your work is saved on this device and will sync when you're back online.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const e = (data as { error?: { code?: string; message?: string; details?: unknown } }).error;
    // Session expired: a full reload to /login (this utility runs outside React, so no router is available).
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    if (res.status === 401 && typeof window !== "undefined" && !url.includes("/auth/")) window.location.assign(`${window.location.origin}/login`);
    throw new ApiError(res.status, e?.code ?? "ERROR", e?.message ?? "Something went wrong. Please try again.", e?.details);
  }
  return data as T;
}

// ── Offline outbox: session events are queued and replayed in order (server is idempotent by clientId). ──
const OUTBOX = "pp_outbox_v1";
interface OutboxItem {
  url: string;
  body: unknown;
  queuedAt: number;
}

function readOutbox(): OutboxItem[] {
  try {
    return JSON.parse(localStorage.getItem(OUTBOX) ?? "[]");
  } catch {
    return [];
  }
}
function writeOutbox(items: OutboxItem[]) {
  try {
    localStorage.setItem(OUTBOX, JSON.stringify(items));
  } catch {
    /* storage unavailable */
  }
}

export function outboxSize() {
  return typeof window === "undefined" ? 0 : readOutbox().length;
}

/** Send now; if the network is down, queue for later and resolve with null. */
export async function sendOrQueue<T>(url: string, body: unknown): Promise<T | null> {
  try {
    return await apiFetch<T>(url, { method: "POST", body });
  } catch (e) {
    if (e instanceof ApiError && e.code === "OFFLINE") {
      writeOutbox([...readOutbox(), { url, body, queuedAt: Date.now() }]);
      return null;
    }
    throw e;
  }
}

let flushing = false;
export async function flushOutbox(): Promise<number> {
  if (flushing || typeof window === "undefined") return 0;
  flushing = true;
  let sent = 0;
  try {
    let items = readOutbox();
    while (items.length) {
      try {
        await apiFetch(items[0].url, { method: "POST", body: items[0].body });
      } catch (e) {
        if (e instanceof ApiError && e.code === "OFFLINE") break;
        // A permanent error (e.g. validation): drop it rather than block the queue forever.
      }
      items = items.slice(1);
      writeOutbox(items);
      sent++;
    }
  } finally {
    flushing = false;
  }
  return sent;
}

export function newClientId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `c${Date.now()}${Math.random().toString(36).slice(2)}`;
}
