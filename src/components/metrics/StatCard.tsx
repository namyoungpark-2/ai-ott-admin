"use client";

import * as React from "react";
import { cx } from "@/components/ui";

export function StatCard({
  label,
  value,
  hint,
  tone = "neutral",
  active = false,
  onClick,
}: {
  label: string;
  value: number;
  hint?: string;
  tone?: "neutral" | "success" | "warning" | "danger" | "brand";
  active?: boolean;
  onClick?: () => void;
}) {
  const toneCls: Record<string, string> = {
    neutral: "border-[rgb(var(--border))] bg-[rgb(var(--card))]",
    success: "border-emerald-500/30 bg-emerald-500/10",
    warning: "border-amber-500/30 bg-amber-500/10",
    danger: "border-red-500/30 bg-red-500/10",
    brand: "border-[rgb(var(--brand))]/40 bg-violet-500/10",
  };

  return (
    <button
      onClick={onClick}
      className={cx(
        "w-full text-left rounded-2xl border p-4 shadow-sm transition",
        "hover:shadow-md hover:-translate-y-[1px]",
        toneCls[tone],
        active && "ring-2 ring-[rgb(var(--brand))]/40"
      )}
    >
      <div className="text-xs font-semibold text-[rgb(var(--fg-secondary))]">{label}</div>
      <div className="mt-1 text-2xl font-extrabold tracking-tight text-[rgb(var(--fg))]">
        {value.toLocaleString()}
      </div>
      {hint ? <div className="mt-1 text-xs text-[rgb(var(--fg-secondary))]">{hint}</div> : null}
    </button>
  );
}
