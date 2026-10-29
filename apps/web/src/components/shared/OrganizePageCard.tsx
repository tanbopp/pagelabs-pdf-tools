"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { RotateCw, X, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export interface OrganizePageItemData {
  id: string;
  fileId: string; // e.g. "file-0", "file-1", or "blank"
  fileIndex: number;
  fileName: string;
  colorClass: string; // border color class, e.g. "border-blue-500", "border-emerald-500"
  originalIndex: number;
  rotation: number;
  thumbnail: string;
  isBlank?: boolean;
}

interface OrganizePageCardProps {
  item: OrganizePageItemData;
  index: number;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  onRotate: () => void;
  onRemove: () => void;
  onInsertBlankLeft?: () => void;
  onInsertBlankRight?: () => void;
  disabled?: boolean;
}

export function OrganizePageCard({
  item,
  index,
  isSelected = false,
  onToggleSelect,
  onRotate,
  onRemove,
  onInsertBlankLeft,
  onInsertBlankRight,
  disabled = false,
}: OrganizePageCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, disabled });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition: isDragging ? undefined : transition || undefined,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        // Only toggle selection if not clicking action buttons
        if (onToggleSelect && !(e.target as HTMLElement).closest("button")) {
          onToggleSelect();
        }
      }}
      className={cn(
        "group relative flex flex-col rounded-2xl border-2 bg-card p-3 text-foreground select-none cursor-grab active:cursor-grabbing will-change-transform transition-all duration-150 shadow-none",
        item.isBlank ? "border-dashed border-muted-foreground/40 bg-muted/10" : item.colorClass || "border-border",
        isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background scale-[1.02]",
        isDragging && "opacity-40",
        !isDragging && !isSelected && "hover:scale-[1.01]"
      )}
    >
      {/* Left Insert Blank Page button (hover on card) */}
      {onInsertBlankLeft && !disabled && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onInsertBlankLeft();
          }}
          title="Insert blank page before"
          className="absolute -left-3.5 top-1/2 -translate-y-1/2 z-30 h-7 w-7 rounded-full bg-background border border-border shadow-sm flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/80 hover:scale-110 active:scale-95 transition-all opacity-0 group-hover:opacity-100 cursor-pointer pointer-events-auto"
        >
          <div className="relative flex items-center justify-center">
            <FileText className="h-3.5 w-3.5" />
            <span className="absolute -bottom-1 -right-1 text-[9px] font-extrabold text-primary leading-none">+</span>
          </div>
        </button>
      )}

      {/* Right Insert Blank Page button (hover on card) */}
      {onInsertBlankRight && !disabled && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onInsertBlankRight();
          }}
          title="Insert blank page after"
          className="absolute -right-3.5 top-1/2 -translate-y-1/2 z-30 h-7 w-7 rounded-full bg-background border border-border shadow-sm flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/80 hover:scale-110 active:scale-95 transition-all opacity-0 group-hover:opacity-100 cursor-pointer pointer-events-auto"
        >
          <div className="relative flex items-center justify-center">
            <FileText className="h-3.5 w-3.5" />
            <span className="absolute -bottom-1 -right-1 text-[9px] font-extrabold text-primary leading-none">+</span>
          </div>
        </button>
      )}

      {/* Top action row: Rotate and Remove (X) buttons */}
      <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
        {!item.isBlank && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRotate();
            }}
            aria-label={`Rotate page ${index + 1} 90 degrees`}
            className="h-7 w-7 rounded-full bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-ring"
          >
            <RotateCw className="h-3.5 w-3.5" />
          </button>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label={`Delete page ${index + 1}`}
          className="h-7 w-7 rounded-full bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* A4 Aspect Ratio Thumbnail Canvas with CSS rotation */}
      <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden border border-border/40 bg-muted/20 flex items-center justify-center pointer-events-none">
        {item.isBlank ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-muted/30 text-muted-foreground p-4 text-center">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Blank Page
            </span>
          </div>
        ) : item.thumbnail ? (
          <img
            src={item.thumbnail}
            alt={`Page ${index + 1}`}
            style={{
              transform: `rotate(${item.rotation}deg)`,
              transition: "transform 200ms ease-out",
            }}
            className="w-full h-full object-contain pointer-events-none p-1"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-secondary text-muted-foreground p-4 text-center">
            <FileText className="h-8 w-8 text-foreground/50" />
            <span className="text-xs font-semibold">Page {item.originalIndex + 1}</span>
          </div>
        )}
      </div>

      {/* Bottom bar: New page order and origin file badge */}
      <div className="pt-2.5 pb-0.5 px-1 flex items-center justify-between text-xs font-semibold text-muted-foreground">
        <span className="h-5 px-1.5 rounded-full bg-secondary text-[11px] font-bold text-foreground shrink-0 flex items-center justify-center">
          {index + 1}
        </span>
        <span className="text-[11px] truncate max-w-[120px]" title={item.isBlank ? "Blank Page" : item.fileName}>
          {item.isBlank ? "Blank" : `p.${item.originalIndex + 1}`}
        </span>
      </div>
    </div>
  );
}
