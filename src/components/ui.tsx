import * as React from "react";

/** className 합치기 유틸 */
export function cx(...v: Array<string | undefined | false | null>) {
  return v.filter(Boolean).join(" ");
}

/* ─── Card ───────────────────────────────────────────────────────────── */
export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cx(
        "rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] shadow-sm",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("p-6 pb-3", className)} {...props} />;
}

export function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("p-6 pt-3", className)} {...props} />;
}

/* ─── Button ─────────────────────────────────────────────────────────── */
type ButtonTone = "primary" | "secondary" | "danger";

export function Button({
  tone = "secondary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: ButtonTone }) {
  const base =
    "inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition disabled:opacity-50 disabled:pointer-events-none";

  const styles: Record<ButtonTone, string> = {
    primary:
      "bg-gradient-to-r from-violet-500 to-pink-500 text-white shadow-[0_0_16px_rgba(139,92,246,.35)] hover:opacity-90 hover:shadow-[0_0_24px_rgba(139,92,246,.55)]",
    secondary:
      "border border-[rgb(var(--border))] bg-[rgb(var(--muted))] text-[rgb(var(--fg))] hover:border-violet-500/40 hover:bg-[rgb(var(--muted))]/80",
    danger:
      "bg-rose-600 text-white hover:bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,.25)]",
  };

  return (
    <button className={cx(base, styles[tone], className)} {...props} />
  );
}

/* ─── Badge ──────────────────────────────────────────────────────────── */
type BadgeTone = "neutral" | "success" | "warning" | "danger" | "brand";

export function Badge({
  tone = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  const styles: Record<BadgeTone, string> = {
    neutral: "border-[rgb(var(--border))] text-[rgb(var(--fg))]/70 bg-[rgb(var(--muted))]",
    success: "border-emerald-500/30 text-emerald-400 bg-emerald-500/10",
    warning: "border-amber-500/30 text-amber-400 bg-amber-500/10",
    danger:  "border-rose-500/30 text-rose-400 bg-rose-500/10",
    brand:   "border-violet-500/30 text-violet-400 bg-violet-500/10",
  };

  return (
    <span
      className={cx(
        "inline-flex items-center rounded-lg border px-2 py-1 text-xs font-medium",
        styles[tone],
        className
      )}
      {...props}
    />
  );
}

/* ─── Input ──────────────────────────────────────────────────────────── */
export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cx(
        "h-10 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--muted))]",
        "px-3 text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--fg))]/30 outline-none",
        "focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/50 transition",
        className
      )}
      {...props}
    />
  );
}

/* ─── Skeleton ───────────────────────────────────────────────────────── */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cx(
        "animate-pulse rounded-xl bg-[rgb(var(--muted))]",
        className ?? "h-4 w-full"
      )}
    />
  );
}
