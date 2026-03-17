"use client";

import * as React from "react";
import { Button, cx } from "@/components/ui";

export function RightPanel({
  open,
  title,
  subtitle,
  onClose,
  children,
  actions,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      {/* backdrop */}
      <div
        className={cx(
          "fixed inset-0 z-[60] bg-black/30 transition-opacity",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* panel */}
      <div
        className={cx(
          "fixed right-0 top-0 z-[70] h-screen w-[520px] max-w-[92vw]",
          "border-l border-zinc-200 bg-white shadow-xl transition-transform",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="p-4 border-b border-zinc-200/70 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-bold truncate">{title}</div>
            {subtitle ? <div className="mt-1 text-xs text-zinc-500 truncate">{subtitle}</div> : null}
          </div>
          <div className="flex items-center gap-2">
            {actions}
            <Button tone="secondary" className="h-9" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>

        <div className="p-4 overflow-auto h-[calc(100vh-72px)]">{children}</div>
      </div>
    </>
  );
}
