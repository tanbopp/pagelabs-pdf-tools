"use client";

import React from "react";
import { RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ToolLayoutProps {
  children: React.ReactNode; // Left Column / Canvas Content
  options: React.ReactNode; // Right Settings Content (scrollable)
  actionButton?: React.ReactNode; // Bottom Sticky Action Area
  onReset?: () => void; // Optional Change File trigger
  changeFileText?: string;
  canvasClassName?: string;
  panelClassName?: string;
  className?: string;
  /**
   * Tool operational status:
   * - "idle" | "failed": standard split canvas + right panel layout
   * - "processing": hides right panel and canvas, renders centered loading in full viewport
   * - "completed": hides right panel and canvas, renders centered result card in full viewport
   */
  status?: "idle" | "processing" | "completed" | "failed";
  /** Optional custom loading node for processing state */
  processingNode?: React.ReactNode;
  /** Optional custom result node for completed state */
  completedNode?: React.ReactNode;
}

export function ToolLayout({
  children,
  options,
  actionButton,
  onReset,
  changeFileText = "Change file",
  canvasClassName,
  panelClassName,
  className,
  status = "idle",
  processingNode,
  completedNode,
}: ToolLayoutProps) {
  // 1. Full-screen Centered State when processing
  if (status === "processing") {
    return (
      <main
        className={cn(
          "w-full h-[calc(100vh-65px)] flex flex-col items-center justify-center bg-background text-foreground overflow-y-auto px-6",
          className
        )}
      >
        <div className="flex flex-col items-center justify-center min-h-[70vh] w-full max-w-2xl mx-auto px-6 text-center animate-in fade-in duration-200">
          {processingNode}
        </div>
      </main>
    );
  }

  // 2. Full-screen Centered State when completed (Download)
  if (status === "completed") {
    return (
      <main
        className={cn(
          "w-full h-[calc(100vh-65px)] flex flex-col items-center justify-center bg-background text-foreground overflow-y-auto px-6",
          className
        )}
      >
        <div className="flex flex-col items-center justify-center min-h-[70vh] w-full max-w-2xl mx-auto px-6 text-center animate-in fade-in duration-200">
          {completedNode}
        </div>
      </main>
    );
  }

  // 3. Normal Workspace State (idle / failed with ErrorAlert)
  return (
    <main
      className={cn(
        "flex flex-col lg:flex-row w-full h-[calc(100vh-65px)] overflow-hidden bg-background text-foreground",
        className
      )}
    >
      {/* KOLOM KIRI (CANVAS): Full height, centered PDF workspace with scrollable content */}
      <div
        className={cn(
          "relative flex-1 flex flex-col items-center justify-center p-6 lg:p-10 overflow-y-auto bg-muted/30 min-h-0",
          canvasClassName
        )}
      >
        {/* Tombol Change file di pojok kanan atas canvas */}
        {onReset && (
          <div className="absolute top-6 right-6 z-20">
            <button
              type="button"
              onClick={onReset}
              className="h-9 px-4 rounded-full border border-border bg-background hover:bg-secondary text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-none"
            >
              <RefreshCcw className="h-3.5 w-3.5" />
              <span>{changeFileText}</span>
            </button>
          </div>
        )}

        {/* PDF Preview Container (centered horizontally and vertically) */}
        <div className="w-full flex-1 flex flex-col items-center justify-center min-h-0">
          {children}
        </div>
      </div>

      {/* KOLOM KANAN (PANEL SETTINGS): Fixed width, full height docked panel */}
      <aside
        className={cn(
          "w-full lg:w-[380px] shrink-0 border-t lg:border-t-0 lg:border-l border-border bg-background flex flex-col h-full min-h-0 relative z-10",
          panelClassName
        )}
      >
        {/* Settings Options (Scrollable independently) */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8 flex flex-col gap-6">
          {options}
        </div>

        {/* Action Button at bottom */}
        {actionButton && (
          <div className="p-6 lg:p-8 border-t border-border bg-background shrink-0 mt-auto">
            {actionButton}
          </div>
        )}
      </aside>
    </main>
  );
}
