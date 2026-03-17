"use client";

import * as React from "react";
import { Command } from "cmdk";
import { apiGet, apiPost } from "@/lib/http";
import { useToast } from "@/components/toast";

type QuickContent = { contentId: string; title?: string; uiStatus?: string };

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { toast } = useToast();
  const [q, setQ] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [results, setResults] = React.useState<QuickContent[]>([]);

  React.useEffect(() => {
    if (!open) return;
    setQ("");
    setResults([]);
  }, [open]);

  // 간단 검색: q가 2글자 이상일 때 서버 검색(없으면 contents list 가져와서 filter)
  React.useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!open) return;
      const query = q.trim();
      if (query.length < 2) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        /**
         * ✅ 조정 포인트: 검색 API가 없으면
         * - /api/admin/contents?query=... 같은 걸 만들어도 좋고
         * - 임시로 /api/admin/contents 전체 가져와서 filter도 가능(데이터 많으면 비추)
         */
        const res = await apiGet<QuickContent[]>(`/api/admin/contents/search?q=${encodeURIComponent(query)}`);
        if (!cancelled) setResults(res ?? []);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [q, open]);

  function go(path: string) {
    onOpenChange(false);
    window.location.href = path;
  }

  async function transcode(contentId: string) {
    try {
      await apiPost(`/api/admin/contents/${contentId}/transcode`, {});
      toast({ type: "success", title: "Transcode started", description: contentId });
    } catch (e: any) {
      toast({ type: "error", title: "Transcode failed", description: e?.message ?? "Unknown" });
    } finally {
      onOpenChange(false);
    }
  }

  async function retry(contentId: string) {
    try {
      await apiPost(`/api/admin/contents/${contentId}/retry`, {});
      toast({ type: "success", title: "Retry requested", description: contentId });
    } catch (e: any) {
      toast({ type: "error", title: "Retry failed", description: e?.message ?? "Unknown" });
    } finally {
      onOpenChange(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90]">
      <div className="absolute inset-0 bg-black/35" onClick={() => onOpenChange(false)} />
      <div className="absolute left-1/2 top-[12vh] w-[720px] max-w-[92vw] -translate-x-1/2">
        <div className="rounded-2xl border border-zinc-200 bg-white shadow-xl overflow-hidden">
          <Command shouldFilter={false}>
            <div className="border-b border-zinc-200/70 px-4 py-3">
              <Command.Input
                value={q}
                onValueChange={setQ}
                autoFocus
                placeholder="Search content (title/contentId) or run commands…"
                className="w-full bg-transparent outline-none text-sm"
              />
              <div className="mt-1 text-[11px] text-zinc-500">
                Enter to open • Esc to close • Try: <span className="font-mono">contents</span>, <span className="font-mono">failures</span>
              </div>
            </div>

            <Command.List className="max-h-[420px] overflow-auto p-2">
              <Command.Group heading="Navigation">
                <Item value="nav-contents" onSelect={() => go("/admin/contents")}>
                  Contents
                </Item>
                <Item value="nav-failures" onSelect={() => go("/admin/failures")}>
                  Failures
                </Item>
              </Command.Group>

              <div className="my-2 h-px bg-zinc-200/70" />

              <Command.Group heading="Search results">
                {loading ? (
                  <div className="px-3 py-2 text-sm text-zinc-500">Searching…</div>
                ) : results.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-zinc-500">
                    Type 2+ chars to search.
                  </div>
                ) : (
                  results.map((r) => (
                    <Command.Item
                      key={r.contentId}
                      value={`${r.title ?? ""} ${r.contentId}`}
                      onSelect={() => go(`/admin/contents/${r.contentId}`)}
                      className="rounded-xl px-3 py-2 text-sm hover:bg-zinc-50 aria-selected:bg-zinc-50 cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate font-semibold">{r.title ?? "Untitled"}</div>
                          <div className="truncate text-xs text-zinc-500 font-mono">{r.contentId}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            className="rounded-lg border border-zinc-200 px-2 py-1 text-xs hover:bg-white"
                            onClick={(e) => {
                              e.preventDefault(); e.stopPropagation();
                              transcode(r.contentId);
                            }}
                          >
                            Transcode
                          </button>
                          <button
                            className="rounded-lg border border-zinc-200 px-2 py-1 text-xs hover:bg-white text-red-600"
                            onClick={(e) => {
                              e.preventDefault(); e.stopPropagation();
                              retry(r.contentId);
                            }}
                          >
                            Retry
                          </button>
                        </div>
                      </div>
                    </Command.Item>
                  ))
                )}
              </Command.Group>
            </Command.List>
          </Command>
        </div>
      </div>
    </div>
  );
}

function Item({
  value,
  children,
  onSelect,
}: {
  value: string;
  children: React.ReactNode;
  onSelect: () => void;
}) {
  return (
    <Command.Item
      value={value}
      onSelect={onSelect}
      className="rounded-xl px-3 py-2 text-sm hover:bg-zinc-50 aria-selected:bg-zinc-50 cursor-pointer"
    >
      {children}
    </Command.Item>
  );
}
