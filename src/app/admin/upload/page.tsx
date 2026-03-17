"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui";
import { useToast } from "@/components/toast";
import { apiPost } from "@/lib/http";

export default function AdminUploadPage() {
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [mode, setMode] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [autoTranscode, setAutoTranscode] = useState(true);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      toast({ type: "error", title: "파일을 선택해줘" });
      return;
    }

    setLoading(true);

    try {
      const fd = new FormData();
      fd.append("file", file);
      if (title) fd.append("title", title);
      if (mode) fd.append("mode", mode);

      const r = await fetch("/api/admin/uploads", {
        method: "POST",
        body: fd,
      });

      if (!r.ok) {
        const text = await r.text();
        throw new Error(text);
      }

      const json = await r.json();
      const contentId = json.id; // UnifiedUploadResult.id

      toast({
        type: "success",
        title: "업로드 완료",
        description: `contentId=${contentId}`,
      });

      if (autoTranscode && contentId) {
        try {
          await apiPost(`/api/admin/contents/${contentId}/transcode`, {});
          toast({
            type: "success",
            title: "자동 Transcode 시작",
          });
        } catch {
          toast({
            type: "error",
            title: "Transcode 시작 실패",
          });
        }
      }

      window.location.href = `/admin/contents/${contentId}`;
    } catch (e: any) {
      toast({
        type: "error",
        title: "업로드 실패",
        description: e?.message ?? "Unknown",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl space-y-4">
      <div>
        <div className="text-lg font-bold">Upload Content</div>
        <div className="text-sm text-zinc-500">
          업로드 후 자동 트랜스코드 가능
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Title"
          className="w-full border rounded-xl px-3 py-2"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <select
          className="w-full border rounded-xl px-3 py-2"
          value={mode}
          onChange={(e) => setMode(e.target.value)}
        >
          <option value="">Mode (optional)</option>
          <option value="A">A</option>
          <option value="B">B</option>
        </select>

        <input
          type="file"
          accept="video/*"
          className="w-full border rounded-xl px-3 py-2"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={autoTranscode}
            onChange={(e) => setAutoTranscode(e.target.checked)}
          />
          자동 Transcode
        </label>

        <Button tone="primary" disabled={!file || loading}>
          {loading ? "Uploading..." : "Upload"}
        </Button>
      </form>
    </div>
  );
}
