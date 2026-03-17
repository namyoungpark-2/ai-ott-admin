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
        <div key={it.k} className="rounded-2xl border border-zinc-200/70 bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold text-zinc-500">{it.k}</div>
          <div className="mt-1 text-sm text-zinc-900 break-words">{it.v ?? <span className="text-zinc-400">-</span>}</div>
        </div>
      ))}
    </div>
  );
}
