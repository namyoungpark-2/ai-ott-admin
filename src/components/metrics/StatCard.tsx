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
    neutral: "border-zinc-200 bg-white",
    success: "border-emerald-200 bg-emerald-50",
    warning: "border-amber-200 bg-amber-50",
    danger: "border-red-200 bg-red-50",
    brand: "border-violet-200 bg-violet-50",
  };

  return (
    <button
      onClick={onClick}
      className={cx(
        "w-full text-left rounded-2xl border p-4 shadow-sm transition",
        "hover:shadow-md hover:-translate-y-[1px]",
        toneCls[tone],
        active && "ring-2 ring-violet-200"
      )}
    >
      <div className="text-xs font-semibold text-zinc-600">{label}</div>
      <div className="mt-1 text-2xl font-extrabold tracking-tight text-zinc-900">
        {value.toLocaleString()}
      </div>
      {hint ? <div className="mt-1 text-xs text-zinc-600">{hint}</div> : null}
    </button>
  );
}
