"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { RotateCw, X, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export interface OrganizePageItemData {
  id: string;
  originalIndex: number;
  rotation: number;
  thumbnail: string;
}

interface OrganizePageCardProps {
  item: OrganizePageItemData;
  index: number;
  onRotate: () => void;
  onRemove: () => void;
  disabled?: boolean;
}

export function OrganizePageCard({
  item,
  index,
  onRotate,
  onRemove,
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
      className={cn(
        "group relative flex flex-col rounded-2xl border border-border bg-card p-3 text-foreground select-none cursor-grab active:cursor-grabbing will-change-transform",
        isDragging && "opacity-40 border-foreground",
        !isDragging && "hover:border-foreground/50 transition-colors duration-150"
      )}
    >
      {/* Top action row: Rotate and Remove (X) buttons */}
      <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
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
        {item.thumbnail ? (
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

      {/* Bottom bar: New page order and original index */}
      <div className="pt-2.5 pb-0.5 px-1 flex items-center justify-between text-xs font-semibold text-muted-foreground">
        <span className="h-5 px-1.5 rounded-full bg-secondary text-[11px] font-bold text-foreground shrink-0 flex items-center justify-center">
          {index + 1}
        </span>
        <span className="text-[11px] truncate">
          (Orig #{item.originalIndex + 1})
        </span>
      </div>
    </div>
  );
}
