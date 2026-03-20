"use client";

import * as React from "react";
import { cx } from "@/components/ui";

export function KeyValue({
  items,
  cols = 3,
}: {
  items: { k: string; v?: React.ReactNode }[];
  cols?: 2 | 3 | 4;
}) {
  const grid =
    cols === 2
      ? "grid-cols-1 md:grid-cols-2"
      : cols === 4
      ? "grid-cols-1 md:grid-cols-4"
      : "grid-cols-1 md:grid-cols-3";

  return (
    <div className={cx("grid gap-3", grid)}>
      {items.map((it) => (
        <div key={it.k} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm">
          <div className="text-xs font-semibold text-[rgb(var(--fg-secondary))]">{it.k}</div>
          <div className="mt-1 text-sm text-[rgb(var(--fg))] break-words">{it.v ?? <span className="text-[rgb(var(--fg-secondary))]">-</span>}</div>
        </div>
      ))}
    </div>
  );
}
