import React from "react";
import { HugeAlert, HugeRefresh } from "@/components/icons";

export interface ErrorAlertProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorAlert({ message, onRetry }: ErrorAlertProps) {
  return (
    <div
      role="alert"
      className="rounded-3xl border-2 border-border bg-card p-6 flex items-start justify-between gap-4 text-foreground"
    >
      <div className="flex items-start gap-3 min-w-0">
        <HugeAlert size={20} className="shrink-0 text-foreground mt-0.5" />
        <p className="text-sm font-semibold">{message}</p>
      </div>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          aria-label="Retry action"
          className="h-8 px-3 rounded-full border border-border bg-secondary hover:bg-accent text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
        >
          <HugeRefresh size={14} />
          <span>Retry</span>
        </button>
      )}
    </div>
  );
}
