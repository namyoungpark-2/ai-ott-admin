import * as React from "react";

/** className 합치기 유틸 (clsx 없이 간단 버전) */
export function cx(...v: Array<string | undefined | false | null>) {
  return v.filter(Boolean).join(" ");
}

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cx(
        "rounded-2xl border border-zinc-200/70 bg-white shadow-sm",
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

type ButtonTone = "primary" | "secondary" | "danger";

export function Button({
  tone = "secondary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: ButtonTone }) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-medium transition disabled:opacity-60 disabled:pointer-events-none";

  const styles: Record<ButtonTone, string> = {
    primary: "bg-zinc-900 text-white hover:bg-zinc-800",
    secondary: "border border-zinc-200 bg-white hover:bg-zinc-50",
    danger: "bg-red-600 text-white hover:bg-red-500",
  };

  return (
    <button className={cx(base, styles[tone], className)} {...props} />
  );
}

export function Badge({
  tone = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "success" | "warning" | "danger" | "brand";
}) {
  const styles: Record<string, string> = {
    neutral: "border-zinc-200 text-zinc-700 bg-white",
    success: "border-emerald-200 text-emerald-700 bg-emerald-50",
    warning: "border-amber-200 text-amber-700 bg-amber-50",
    danger: "border-red-200 text-red-700 bg-red-50",
    brand: "border-violet-200 text-violet-700 bg-violet-50",
  };

  return (
    <span
      className={cx(
        "inline-flex items-center rounded-lg border px-2 py-1 text-xs",
        styles[tone],
        className
      )}
      {...props}
    />
  );
}

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cx(
        "h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none",
        "focus:ring-2 focus:ring-violet-200 focus:border-violet-300",
        className
      )}
      {...props}
    />
  );
}

/** 아주 단순한 skeleton */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cx(
        "animate-pulse rounded-xl bg-zinc-100",
        className ?? "h-4 w-full"
      )}
    />
  );
}
