"use client";

import React, { useState, useEffect } from "react";
import { Loader2, Lightbulb } from "lucide-react";

export interface ProgressCardProps {
  progress: number; // 0-100, or -1 for indeterminate
  label: string;
}

const DID_YOU_KNOW_TIPS = [
  "Did you know? PageLabs purges your uploaded and processed files automatically for complete privacy.",
  "Tip: You can reorder pages and merge up to 20 PDF documents at once in PageLabs.",
  "Fun fact: PageLabs runs with zero tracking cookies and strictly minimal shadowless aesthetics.",
  "Did you know? PDF files can be compressed by up to 80% without noticeable text clarity degradation.",
  "Tip: You can keyboard navigate PageLabs with Tab and Space/Enter for full accessibility.",
];

export function ProgressCard({ progress, label }: ProgressCardProps) {
  const isIndeterminate = progress < 0;
  const clampedProgress = Math.min(100, Math.max(0, progress));
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % DID_YOU_KNOW_TIPS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      role="progressbar"
      aria-valuenow={isIndeterminate ? undefined : clampedProgress}
      aria-valuemin={0}
      aria-valuemax={100}
      className="rounded-3xl border border-border bg-card p-8 flex flex-col gap-5 text-foreground"
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

      <div className="pt-2 border-t border-border/60 flex items-start gap-2.5 text-xs text-muted-foreground font-medium">
        <Lightbulb className="w-3.5 h-3.5 text-foreground shrink-0 mt-0.5" />
        <span className="animate-fade-in transition-opacity duration-300">
          {DID_YOU_KNOW_TIPS[tipIndex]}
        </span>
      </div>
    </div>
  );
}
