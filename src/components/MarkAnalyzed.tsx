"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/client/api";
import { Button } from "./ui";

export function MarkAnalyzed({ attemptId }: { attemptId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="secondary"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await apiFetch(`/api/v1/attempts/${attemptId}`, { method: "POST", body: { action: "analyzed" } }).catch(() => undefined);
        router.refresh();
      }}
    >
      ✓ I&apos;ve reviewed this analysis
    </Button>
  );
}
