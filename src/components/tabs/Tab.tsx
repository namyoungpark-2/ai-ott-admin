"use client";

import * as React from "react";
import { cx } from "@/components/ui";

export function Tabs({
  items,
  value,
  onChange,
}: {
  items: { key: string; label: string; badge?: number }[];
  value: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {items.map((it) => {
        const active = value === it.key;
        return (
          <button
            key={it.key}
            onClick={() => onChange(it.key)}
            className={cx(
              "rounded-xl border px-3 py-2 text-sm transition",
              active
                ? "border-violet-200 bg-violet-50 text-violet-900"
                : "border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700"
            )}
          >
            <span className="font-semibold">{it.label}</span>
            {typeof it.badge === "number" ? (
              <span
                className={cx(
                  "ml-2 inline-flex items-center rounded-lg border px-2 py-0.5 text-xs",
                  active ? "border-violet-200 bg-white" : "border-zinc-200 bg-white"
                )}
              >
                {it.badge}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
