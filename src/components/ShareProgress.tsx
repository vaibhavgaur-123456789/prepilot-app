"use client";

/** Share today's study summary (like a fitness app's "share workout"): native share sheet, else WhatsApp. */
export function ShareProgress({ text, label }: { text: string; label: string }) {
  function share() {
    const full = `${text}\n${window.location.origin}/welcome`;
    const nav = navigator as Navigator & { share?: (d: { text: string }) => Promise<void> };
    if (nav.share) return void nav.share({ text: full }).catch(() => undefined);
    window.open(`https://wa.me/?text=${encodeURIComponent(full)}`, "_blank", "noopener");
  }
  return (
    <button type="button" onClick={share} className="press grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-border text-lg" aria-label={label} title={label}>
      📤
    </button>
  );
}
