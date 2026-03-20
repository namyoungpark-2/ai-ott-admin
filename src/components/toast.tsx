"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { cx } from "./ui";

type ToastType = "success" | "error" | "info";

export type ToastItem = {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  ttlMs?: number;
};

type ToastContextValue = {
  toast: (t: Omit<ToastItem, "id">) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

function toneClass(type: ToastType) {
  switch (type) {
    case "success":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";
    case "error":
      return "border-red-500/30 bg-red-500/10 text-red-400";
    case "info":
    default:
      return "border-[rgb(var(--border))] bg-[rgb(var(--card))] text-[rgb(var(--fg))]";
  }
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const toast = useCallback(
    (t: Omit<ToastItem, "id">) => {
      const id = crypto?.randomUUID?.() ?? String(Date.now() + Math.random());
      const ttl = t.ttlMs ?? 2600;

      setItems((prev) => [{ ...t, id }, ...prev].slice(0, 5));
      window.setTimeout(() => remove(id), ttl);
    },
    [remove]
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-[100] flex w-[360px] max-w-[92vw] flex-col gap-2">
        {items.map((it) => (
          <div
            key={it.id}
            className={cx(
              "rounded-2xl border px-4 py-3 shadow-sm backdrop-blur",
              toneClass(it.type)
            )}
            role="status"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold">{it.title}</div>
                {it.description ? (
                  <div className="mt-1 text-xs opacity-80 break-words">{it.description}</div>
                ) : null}
              </div>
              <button
                className="rounded-lg px-2 py-1 text-xs opacity-60 hover:opacity-100"
                onClick={() => remove(it.id)}
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
