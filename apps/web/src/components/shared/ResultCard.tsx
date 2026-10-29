import React from "react";
import { HugeDownload, HugeRefresh, HugeCheck } from "@/components/icons";

export interface ResultCardProps {
  filename: string;
  sizeBytes: number;
  pageCount?: number;
  downloadUrl: string;
  onReset: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export function ResultCard({
  filename,
  sizeBytes,
  pageCount,
  downloadUrl,
  onReset,
}: ResultCardProps) {
  const metaParts = [filename, formatBytes(sizeBytes)];
  if (pageCount !== undefined && pageCount > 0) {
    metaParts.push(`${pageCount} page${pageCount > 1 ? "s" : ""}`);
  }

  return (
    <div className="rounded-3xl border border-border bg-card p-6 flex flex-col gap-5 text-foreground">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full border border-border bg-secondary flex items-center justify-center shrink-0">
          <HugeCheck size={16} className="text-foreground" />
        </div>
        <div className="text-base font-semibold leading-tight">Your file is ready</div>
      </div>

      <div className="text-xs font-semibold text-muted-foreground truncate">
        {metaParts.join(" · ")}
      </div>

      <div className="flex flex-col gap-2.5 pt-1">
        <a
          href={downloadUrl}
          download={filename}
          className="w-full h-11 px-5 rounded-full bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity whitespace-nowrap"
        >
          <HugeDownload size={16} className="shrink-0" />
          <span>Download PDF</span>
        </a>

        <button
          type="button"
          onClick={onReset}
          className="w-full h-11 px-5 rounded-full border border-border bg-transparent text-foreground text-xs font-semibold flex items-center justify-center gap-2 hover:bg-secondary transition-colors whitespace-nowrap"
        >
          <HugeRefresh size={14} className="shrink-0" />
          <span>Process another</span>
        </button>
      </div>
    </div>
  );
}
