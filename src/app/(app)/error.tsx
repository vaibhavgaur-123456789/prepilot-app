"use client";

import { Button, Card } from "@/components/ui";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Card className="mx-auto mt-10 max-w-md text-center">
      <h1 className="text-lg font-semibold">This page couldn&apos;t load</h1>
      <p className="mt-1 text-sm text-muted">
        {typeof navigator !== "undefined" && !navigator.onLine ? "You're offline. Your timer and saved work are safe on this device." : "Something went wrong on our side. Your data is safe."}
      </p>
      {error.digest && <p className="mt-1 text-xs text-muted">Reference: {error.digest}</p>}
      <Button className="mt-4" onClick={reset}>Try again</Button>
    </Card>
  );
}
