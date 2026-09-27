"use client";

import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/client/api";
import { useT } from "@/i18n/client";
import { Alert, Badge, Button } from "./ui";

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

async function registration() {
  return (await navigator.serviceWorker.getRegistration("/")) ?? (await navigator.serviceWorker.register("/sw.js"));
}

/** Web Push on/off for this device. Permission is only requested when the student taps the button. */
export function PushToggle({ publicKey }: { publicKey: string | null }) {
  const t = useT();
  const [state, setState] = useState<"loading" | "unsupported" | "blocked" | "off" | "on">("loading");
  const [msg, setMsg] = useState<{ tone: "success" | "danger"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      if (!publicKey || !("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return setState("unsupported");
      if (Notification.permission === "denied") return setState("blocked");
      const reg = await navigator.serviceWorker.getRegistration("/");
      const sub = await reg?.pushManager.getSubscription();
      setState(sub ? "on" : "off");
    })().catch(() => setState("unsupported"));
  }, [publicKey]);

  async function enable() {
    setBusy(true);
    setMsg(null);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setState(perm === "denied" ? "blocked" : "off");
        return;
      }
      const reg = await registration();
      await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey!) });
      await apiFetch("/api/v1/push", { method: "POST", body: { action: "subscribe", subscription: sub.toJSON() } });
      setState("on");
      await apiFetch("/api/v1/push", { method: "POST", body: { action: "test" } });
    } catch (e) {
      setMsg({ tone: "danger", text: e instanceof ApiError ? e.message : "Couldn't turn on notifications on this device." });
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration("/");
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await apiFetch("/api/v1/push", { method: "POST", body: { action: "unsubscribe", endpoint: sub.endpoint } }).catch(() => undefined);
        await sub.unsubscribe();
      }
      setState("off");
    } finally {
      setBusy(false);
    }
  }

  async function test() {
    setBusy(true);
    try {
      const r = await apiFetch<{ sent: number }>("/api/v1/push", { method: "POST", body: { action: "test" } });
      setMsg({ tone: r.sent ? "success" : "danger", text: r.sent ? "✓" : "No device received it. Try turning notifications off and on again." });
    } catch (e) {
      setMsg({ tone: "danger", text: e instanceof ApiError ? e.message : "Failed." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl bg-surface-2 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold">{t("push.title")}</p>
        {state === "on" && <Badge tone="success">{t("push.on")}</Badge>}
      </div>
      <p className="mt-0.5 text-xs text-muted">{t("push.hint")}</p>
      {state === "unsupported" && <p className="mt-2 text-xs text-warning">{t("push.unsupported")}</p>}
      {state === "blocked" && <p className="mt-2 text-xs text-warning">{t("push.blocked")}</p>}
      <div className="mt-2 flex flex-wrap gap-2">
        {state === "off" && <Button disabled={busy} onClick={enable}>{t("push.enable")}</Button>}
        {state === "on" && (
          <>
            <Button variant="secondary" disabled={busy} onClick={test}>{t("push.test")}</Button>
            <Button variant="ghost" disabled={busy} onClick={disable}>{t("push.disable")}</Button>
          </>
        )}
      </div>
      {msg && <div className="mt-2"><Alert tone={msg.tone}>{msg.text}</Alert></div>}
    </div>
  );
}
