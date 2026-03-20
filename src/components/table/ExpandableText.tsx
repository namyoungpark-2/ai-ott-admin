"use client";

import * as React from "react";
import { cx, Button } from "@/components/ui";

export function ExpandableText({
  text,
  clamp = 2,
  className,
}: {
  text?: string | null;
  clamp?: number;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  if (!text) return <span className="text-[rgb(var(--fg-secondary))]">-</span>;

  return (
    <div className={cx("max-w-[680px]", className)}>
      <div
        className={cx(
          "text-[rgb(var(--fg-secondary))] whitespace-pre-wrap break-words",
          !open && `line-clamp-${clamp}`
        )}
      >
        {text}
      </div>
      <div className="mt-1 flex items-center gap-2">
        <button
          className="text-xs text-[rgb(var(--fg-secondary))] hover:text-[rgb(var(--fg))]"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Collapse" : "Expand"}
        </button>

        <Button
          tone="secondary"
          className="h-7 px-2 text-xs"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(text);
            } catch {}
          }}
        >
          Copy
        </Button>
      </div>
    </div>
  );
}
