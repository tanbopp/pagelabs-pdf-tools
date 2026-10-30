"use client";

import React from "react";
import { Download, RotateCcw, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ResultCardProps {
  filename: string;
  sizeBytes: number;
  pageCount?: number;
  downloadUrl: string;
  onReset: () => void;
  title?: string;
  downloadButtonText?: string;
  className?: string;
}

function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 B";
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
  title = "Your file is ready",
  downloadButtonText,
  className,
}: ResultCardProps) {
  const metaParts = [filename];
  if (sizeBytes > 0) {
    metaParts.push(formatBytes(sizeBytes));
  }
  if (pageCount !== undefined && pageCount > 0) {
    metaParts.push(`${pageCount} page${pageCount > 1 ? "s" : ""}`);
  }

  // Derive download label from filename extension if not provided
  let defaultDownloadText = "Download file";
  const ext = filename.split(".").pop()?.toUpperCase();
  if (ext) {
    defaultDownloadText = `Download ${ext}`;
  }

  const finalButtonText = downloadButtonText || defaultDownloadText;

  return (
    <div
      className={cn(
        "w-full max-w-md mx-auto rounded-3xl border border-border bg-card p-8 flex flex-col items-center text-center gap-6 text-foreground animate-in fade-in zoom-in-95 duration-200 shadow-none",
        className
      )}
    >
      {/* Icon Indicator */}
      <div className="h-16 w-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
        <CheckCircle2 className="h-8 w-8 stroke-[2.2]" />
      </div>

      {/* Main Title & File Info */}
      <div className="flex flex-col gap-2 max-w-sm">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground leading-tight">
          {title}
        </h2>
        <p className="text-sm font-medium text-muted-foreground break-all">
          {metaParts.join(" · ")}
        </p>
      </div>

      {/* Action Buttons: Primary Download & Secondary Process Another */}
      <div className="flex flex-col gap-3 w-full pt-2">
        <a
          href={downloadUrl}
          download={filename}
          className="w-full h-14 px-8 rounded-full bg-primary text-primary-foreground text-base font-bold flex items-center justify-center gap-3 hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer shadow-none"
        >
          <Download className="h-5 w-5" />
          <span>{finalButtonText}</span>
        </a>

        <button
          type="button"
          onClick={onReset}
          className="w-full h-12 px-6 rounded-full border border-border bg-transparent hover:bg-secondary text-foreground text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <RotateCcw className="h-4 w-4 text-muted-foreground" />
          <span>Process another file</span>
        </button>
      </div>
    </div>
  );
}
