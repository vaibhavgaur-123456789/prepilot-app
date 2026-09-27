"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { apiFetch, ApiError } from "@/lib/client/api";
import { Alert, Button, inputClass } from "./ui";

const OAUTH_ERRORS: Record<string, string> = {
  google_disabled: "Google sign-in isn't configured on this server yet.",
  google_state: "Google sign-in expired. Please try again.",
  google_token: "Google sign-in failed. Please try again.",
  google_profile: "Couldn't read your Google profile. Please try again.",
  google_failed: "Google sign-in failed. Please try again.",
};

export function AuthForm({ mode, googleEnabled }: { mode: "login" | "signup"; googleEnabled: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(OAUTH_ERRORS[params.get("error") ?? ""] ?? null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const f = new FormData(e.currentTarget);
    try {
      const res = await apiFetch<{ next: string }>(`/api/v1/auth/${mode}`, {
        method: "POST",
        body: {
          email: f.get("email"),
          password: f.get("password"),
          ...(mode === "signup" ? { name: f.get("name"), timezone: Intl.DateTimeFormat().resolvedOptions().timeZone } : {}),
        },
      });
      const next = params.get("next");
      router.replace(next && next.startsWith("/") && !next.startsWith("//") && res.next === "/" ? next : res.next);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate={false}>
      {error && <Alert tone="danger">{error}</Alert>}
      {mode === "signup" && (
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Your name</span>
          <input name="name" required maxLength={80} autoComplete="name" className={inputClass} />
        </label>
      )}
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Email</span>
        <input name="email" type="email" required autoComplete="email" className={inputClass} />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Password</span>
        <input name="password" type="password" required minLength={mode === "signup" ? 8 : 1} autoComplete={mode === "signup" ? "new-password" : "current-password"} className={inputClass} />
        {mode === "signup" && <span className="mt-1 block text-xs text-muted">At least 8 characters.</span>}
      </label>
      <Button type="submit" disabled={busy} className="w-full">
        {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
      </Button>
      {googleEnabled && (
        <a href="/api/v1/auth/google" className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface text-sm font-semibold hover:bg-surface-2">
          Continue with Google
        </a>
      )}
      <p className="text-center text-sm text-muted">
        {mode === "login" ? (
          <>New here? <Link href="/signup" className="font-semibold text-primary">Create an account</Link></>
        ) : (
          <>Already have an account? <Link href="/login" className="font-semibold text-primary">Sign in</Link></>
        )}
      </p>
    </form>
  );
}
