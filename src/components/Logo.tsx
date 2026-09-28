import { BRAND } from "@/config/brand";

/**
 * Brand mark: an open book (study) with a rising amber arrow (progress), on the brand gradient.
 * Pure SVG, so it is sharp at every size and also renders inside next/og ImageResponse.
 */
export function LogoMark({ size = 32, className, title }: { size?: number; className?: string; title?: string }) {
  const id = `ppg${size}`;
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" className={className} role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3b55e6" />
          <stop offset="0.55" stopColor="#6a4ef0" />
          <stop offset="1" stopColor="#8b4fe6" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="118" fill={`url(#${id})`} />
      {/* open book */}
      <path d="M92 176c58-26 116-24 158 8v206c-42-30-100-34-158-8z" fill="#ffffff" />
      <path d="M262 184c42-32 100-34 158-8v206c-58-26-116-22-158 8z" fill="#ffffff" fillOpacity="0.78" />
      {/* rising progress arrow */}
      <path d="M140 330l74-62 50 36 104-100" fill="none" stroke="#fbbf24" strokeWidth="34" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M318 196h66v66" fill="none" stroke="#fbbf24" strokeWidth="34" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Mark + name, for headers. */
export function Logo({ size = 32, showName = true, nameClassName = "" }: { size?: number; showName?: boolean; nameClassName?: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <LogoMark size={size} className="shrink-0 drop-shadow-[0_4px_10px_rgb(59_85_230/0.35)]" />
      {showName && <span className={`font-extrabold tracking-tight ${nameClassName}`}>{BRAND.name}</span>}
    </span>
  );
}
