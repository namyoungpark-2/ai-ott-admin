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
                ? "border-[rgb(var(--brand))]/40 bg-violet-500/10 text-violet-300"
                : "border-[rgb(var(--border))] bg-[rgb(var(--card))] hover:bg-[rgb(var(--muted))] text-[rgb(var(--fg-secondary))]"
            )}
          >
            <span className="font-semibold">{it.label}</span>
            {typeof it.badge === "number" ? (
              <span
                className={cx(
                  "ml-2 inline-flex items-center rounded-lg border px-2 py-0.5 text-xs",
                  active ? "border-[rgb(var(--brand))]/40 bg-[rgb(var(--card))]" : "border-[rgb(var(--border))] bg-[rgb(var(--card))]"
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
