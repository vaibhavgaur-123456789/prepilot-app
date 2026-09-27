import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

export function Card({ className, children, ...rest }: ComponentProps<"section">) {
  return (
    <section className={cx("animate-in rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow)] sm:p-5", className)} {...rest}>
      {children}
    </section>
  );
}

export function CardTitle({ children, action, eyebrow }: { children: ReactNode; action?: ReactNode; eyebrow?: ReactNode }) {
  return (
    <div className="mb-3 flex items-start justify-between gap-3">
      <div>
        {eyebrow && <p className="text-xs font-semibold uppercase tracking-wide text-muted">{eyebrow}</p>}
        <h2 className="text-base font-semibold">{children}</h2>
      </div>
      {action}
    </div>
  );
}

type Variant = "primary" | "secondary" | "ghost" | "danger";
const variants: Record<Variant, string> = {
  primary: "bg-grad text-white shadow-[0_4px_14px_rgb(59_85_230/0.35)] hover:brightness-110",
  secondary: "border border-border bg-surface text-text hover:bg-surface-2",
  ghost: "text-primary hover:bg-primary-soft",
  danger: "bg-danger text-white hover:opacity-90",
};
const base = "press inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50";

export function Button({ variant = "primary", className, ...rest }: ComponentProps<"button"> & { variant?: Variant }) {
  return <button className={cx(base, variants[variant], className)} {...rest} />;
}

export function LinkButton({ variant = "primary", className, ...rest }: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={cx(base, variants[variant], className)} {...rest} />;
}

type Tone = "neutral" | "primary" | "success" | "warning" | "danger";
const tones: Record<Tone, string> = {
  neutral: "bg-surface-2 text-muted",
  primary: "bg-primary-soft text-primary",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
};
export function Badge({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={cx("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold", tones[tone], className)}>{children}</span>;
}

/** Progress bar. The value is always also shown as text, so meaning never depends on colour alone. */
export function Progress({ value, max = 100, label, tone = "primary", showValue = true }: { value: number; max?: number; label: string; tone?: Tone; showValue?: boolean }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  const bar = { neutral: "bg-muted", primary: "bg-grad", success: "bg-success", warning: "bg-warning", danger: "bg-danger" }[tone];
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-muted">
        <span>{label}</span>
        {showValue && <span className="tabular font-medium text-text">{Math.round(pct)}%</span>}
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-label={label} aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
        <div className={cx("animate-grow-x h-full rounded-full transition-[width] duration-700", bar)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function Stat({ label, value, sub, className }: { label: string; value: ReactNode; sub?: ReactNode; className?: string }) {
  return (
    <div className={cx("rounded-xl bg-surface-2 p-3", className)}>
      <p className="text-xs text-muted">{label}</p>
      <p className="tabular mt-0.5 text-lg font-semibold">{value}</p>
      {sub && <p className="text-xs text-muted">{sub}</p>}
    </div>
  );
}

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-border p-6 text-center">
      <p className="font-medium">{title}</p>
      {children && <div className="mt-1 text-sm text-muted">{children}</div>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function Alert({ tone = "primary", title, children }: { tone?: Tone; title?: string; children: ReactNode }) {
  return (
    <div role="status" className={cx("rounded-xl p-3 text-sm", tones[tone])}>
      {title && <p className="font-semibold">{title}</p>}
      <div className={title ? "mt-0.5" : ""}>{children}</div>
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}

/** Label for data provenance: measured / estimate / benchmark / projection. */
export function Provenance({ kind }: { kind: "measured" | "estimate" | "benchmark" | "projection" | "self-reported" }) {
  const map = { measured: "success", estimate: "primary", benchmark: "warning", projection: "neutral", "self-reported": "neutral" } as const;
  return <Badge tone={map[kind]} className="font-medium">{kind[0].toUpperCase() + kind.slice(1)}</Badge>;
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("skeleton rounded-xl", className)} aria-hidden />;
}

export const inputClass = "min-h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-[var(--ring)]";
