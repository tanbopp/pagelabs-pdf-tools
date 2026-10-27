import React from "react";
import { Loader2 } from "lucide-react";

export interface ProgressCardProps {
  progress: number; // 0-100, or -1 for indeterminate
  label: string;
}

export function ProgressCard({ progress, label }: ProgressCardProps) {
  const isIndeterminate = progress < 0;
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div
      role="progressbar"
      aria-valuenow={isIndeterminate ? undefined : clampedProgress}
      aria-valuemin={0}
      aria-valuemax={100}
      className="rounded-3xl border border-border bg-card p-8 flex flex-col gap-4 text-foreground"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="text-base font-semibold">{label}</span>
        </div>
        {!isIndeterminate && (
          <span className="text-sm font-semibold">{clampedProgress}%</span>
        )}
      </div>

      <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
        <div
          className="h-full rounded-full bg-foreground transition-all duration-300 ease-out"
          style={{
            width: isIndeterminate ? "40%" : `${clampedProgress}%`,
          }}
        />
      </div>
    </div>
  );
}
