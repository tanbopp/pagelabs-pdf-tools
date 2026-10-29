import React from "react";
import { HugePdfFile, HugeClose } from "@/components/icons";
import { toast } from "sonner";

export interface FileChipProps {
  file: File;
  onRemove: () => void;
  draggable?: boolean;
  dragHandleProps?: Record<string, unknown>;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export function FileChip({
  file,
  onRemove,
  draggable = false,
  dragHandleProps,
}: FileChipProps) {
  return (
    <div
      {...dragHandleProps}
      className="rounded-full border border-border bg-card px-4 py-2 flex items-center justify-between gap-3 text-foreground"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <HugePdfFile size={16} className="shrink-0 text-muted-foreground" />
        <span className="text-sm font-semibold truncate max-w-[240px]">
          {file.name}
        </span>
        <span className="text-xs font-semibold text-muted-foreground shrink-0">
          {formatBytes(file.size)}
        </span>
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          toast.info(`Removed ${file.name}`);
          onRemove();
        }}
        aria-label={`Remove ${file.name}`}
        className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
      >
        <HugeClose size={15} />
      </button>
    </div>
  );
}
