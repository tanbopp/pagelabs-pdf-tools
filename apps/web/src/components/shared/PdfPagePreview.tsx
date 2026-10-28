"use client";

import React, { useEffect, useState } from "react";
import { X, GripVertical, FileText } from "lucide-react";
import { toast } from "sonner";
import { getPdfFirstPagePreview } from "@/lib/pdf-preview";
import { cn } from "@/lib/utils";

export interface PdfPagePreviewProps {
  file: File;
  index: number;
  onRemove: () => void;
  isDragging?: boolean;
}

export function PdfPagePreview({
  file,
  index,
  onRemove,
  isDragging = false,
}: PdfPagePreviewProps) {
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;
    setLoading(true);

    getPdfFirstPagePreview(file)
      .then((url) => {
        if (!isCancelled) {
          setThumbnail(url);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [file]);

  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-2xl border border-border bg-card p-3 text-foreground select-none cursor-grab active:cursor-grabbing will-change-transform",
        isDragging && "opacity-40 border-foreground",
        !isDragging && "hover:border-foreground/50 transition-colors duration-150"
      )}
    >
      {/* Top action button in the corner:
          - Default state: Drag indicator icon (subtle)
          - Hover state: Replaced by Remove (X) button cleanly */}
      <div className="absolute top-2.5 right-2.5 z-20">
        <div
          aria-hidden="true"
          title="Drag handle"
          className="h-7 w-7 rounded-full bg-secondary border border-border flex items-center justify-center text-muted-foreground group-hover:hidden transition-colors"
        >
          <GripVertical className="h-4 w-4" />
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toast.info(`Removed ${file.name}`);
            onRemove();
          }}
          aria-label={`Remove file ${file.name}`}
          className="hidden group-hover:flex h-7 w-7 rounded-full bg-secondary border border-border items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Clean A4 Preview Canvas */}
      <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden border border-border/40 bg-muted/20 flex items-center justify-center pointer-events-none">
        {loading ? (
          <div className="w-full h-full animate-pulse bg-secondary flex flex-col items-center justify-center gap-2">
            <FileText className="h-8 w-8 text-muted-foreground opacity-30" />
            <span className="text-xs font-semibold text-muted-foreground">Rendering…</span>
          </div>
        ) : thumbnail ? (
          <img
            src={thumbnail}
            alt={`Preview of ${file.name}`}
            className="w-full h-full object-contain pointer-events-none"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-secondary text-muted-foreground p-4 text-center">
            <FileText className="h-10 w-10 text-foreground/50" />
            <span className="text-xs font-semibold truncate max-w-full">PDF Page</span>
          </div>
        )}
      </div>

      {/* Bottom row: Page number & filename */}
      <div className="pt-3 pb-0.5 px-1 flex items-center gap-2 min-w-0">
        <span className="h-5 px-1.5 rounded-full bg-secondary text-[11px] font-bold text-muted-foreground shrink-0 flex items-center justify-center">
          {index + 1}
        </span>
        <p className="text-xs font-semibold text-foreground truncate min-w-0 flex-1" title={file.name}>
          {file.name}
        </p>
      </div>
    </div>
  );
}
