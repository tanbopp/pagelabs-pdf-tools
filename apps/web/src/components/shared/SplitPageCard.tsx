"use client";

import React, { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FileText, GripVertical, Check, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SplitPageItemData {
  id: string;
  originalIndex: number;
  name: string; // custom page filename without extension
  thumbnail: string;
  selected: boolean;
}

interface SplitPageCardProps {
  item: SplitPageItemData;
  index: number;
  onToggleSelect: () => void;
  onRename: (newName: string) => void;
  disabled?: boolean;
}

export function SplitPageCard({
  item,
  index,
  onToggleSelect,
  onRename,
  disabled = false,
}: SplitPageCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(item.name);

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

  const handleFinishEditing = () => {
    setIsEditing(false);
    const trimmed = tempName.trim() || `page_${item.originalIndex + 1}`;
    onRename(trimmed);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "group relative flex flex-col rounded-2xl border bg-card p-3 text-foreground select-none cursor-grab active:cursor-grabbing will-change-transform transition-colors duration-150",
        item.selected ? "border-foreground/80 ring-1 ring-foreground/20" : "border-border hover:border-foreground/40",
        isDragging && "opacity-40 border-foreground scale-95"
      )}
    >
      {/* Top Bar: Sequence index, Drag indicator & Checkbox */}
      <div className="absolute top-2.5 left-2.5 right-2.5 z-20 flex items-center justify-between pointer-events-none">
        <span className="h-6 w-6 rounded-full bg-secondary/90 border border-border text-[11px] font-bold text-foreground flex items-center justify-center">
          {index + 1}
        </span>

        {/* Action button: Toggle split selection */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect();
          }}
          aria-label={item.selected ? "Deselect for split" : "Select for split"}
          className={cn(
            "h-6 w-6 rounded-full border flex items-center justify-center transition-colors pointer-events-auto cursor-pointer",
            item.selected
              ? "bg-foreground text-background border-foreground"
              : "bg-secondary/90 border-border text-muted-foreground hover:text-foreground"
          )}
        >
          {item.selected ? <Check className="h-3.5 w-3.5" /> : <GripVertical className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* A4 Aspect Ratio Thumbnail Canvas */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          onToggleSelect();
        }}
        className="relative w-full aspect-[3/4] rounded-xl overflow-hidden border border-border/40 bg-muted/20 flex items-center justify-center cursor-pointer"
      >
        {item.thumbnail ? (
          <img
            src={item.thumbnail}
            alt={item.name}
            className="w-full h-full object-contain pointer-events-none p-1"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-secondary text-muted-foreground p-4 text-center">
            <FileText className="h-8 w-8 text-foreground/50" />
            <span className="text-xs font-semibold">Page {item.originalIndex + 1}</span>
          </div>
        )}

        {/* Selected badge overlay */}
        {item.selected && (
          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-foreground text-background text-[10px] font-bold tracking-wide uppercase">
            To Split
          </div>
        )}
      </div>

      {/* Editable Filename at bottom */}
      <div className="pt-2.5 pb-0.5 px-0.5 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
        {isEditing ? (
          <div className="flex items-center gap-1 w-full">
            <input
              type="text"
              value={tempName}
              autoFocus
              onChange={(e) => setTempName(e.target.value.replace(/[^a-zA-Z0-9._-]/g, ""))}
              onBlur={handleFinishEditing}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleFinishEditing();
              }}
              className="w-full h-7 px-2 rounded-lg border border-foreground bg-background text-xs font-semibold text-foreground focus:outline-none"
            />
            <span className="text-[10px] font-semibold text-muted-foreground">.pdf</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="group/btn flex items-center justify-between w-full h-7 px-2 rounded-lg hover:bg-secondary text-left transition-colors cursor-text"
          >
            <span className="text-xs font-semibold text-foreground truncate flex-1" title={item.name}>
              {item.name}.pdf
            </span>
            <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover/btn:opacity-100 transition-opacity ml-1 shrink-0" />
          </button>
        )}
      </div>
    </div>
  );
}
