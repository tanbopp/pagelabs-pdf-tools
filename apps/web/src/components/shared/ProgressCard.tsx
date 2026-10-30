"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export interface ProgressCardProps {
  progress?: number; // 0-100, or -1 / omitted for indeterminate
  label?: string;
  className?: string;
  showTips?: boolean;
}

const DID_YOU_KNOW_TIPS = [
  "Did you know? PageLabs purges your uploaded and processed files automatically for complete privacy.",
  "Tip: You can reorder pages and merge up to 20 PDF documents at once in PageLabs.",
  "Fun fact: PageLabs runs with zero tracking cookies and strictly minimal shadowless aesthetics.",
  "Did you know? PDF files can be compressed by up to 80% without noticeable text clarity degradation.",
  "Tip: You can keyboard navigate PageLabs with Tab and Space/Enter for full accessibility.",
];

export function ProgressCard({
  progress = -1,
  label = "Processing your file...",
  className,
  showTips = true,
}: ProgressCardProps) {
  const isIndeterminate = progress === undefined || progress < 0;
  const clampedProgress = Math.min(100, Math.max(0, progress));
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    if (!showTips) return;
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % DID_YOU_KNOW_TIPS.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [showTips]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center min-h-[60vh] w-full max-w-xl mx-auto px-6 text-center gap-7 animate-in fade-in duration-200 select-none",
        className
      )}
    >
      {/* Primary Status Text */}
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
        {label}
      </h2>

      {/* Large Spinner (iLovePDF Style) */}
      <div className="relative flex items-center justify-center my-2">
        <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full border-4 border-muted/50 border-t-primary animate-spin" />
        {!isIndeterminate && (
          <span className="absolute text-sm sm:text-base font-bold text-foreground">
            {clampedProgress}%
          </span>
        )}
      </div>

      {/* Determinate progress bar if percentage provided */}
      {!isIndeterminate && (
        <div className="w-full max-w-xs h-2 rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300 rounded-full"
            style={{ width: `${clampedProgress}%` }}
          />
        </div>
      )}

      {/* Rotating Helpful Tip Box */}
      {showTips && (
        <p className="text-xs sm:text-sm font-medium text-muted-foreground/80 max-w-md transition-opacity duration-300">
          {DID_YOU_KNOW_TIPS[tipIndex]}
        </p>
      )}
    </div>
  );
}
