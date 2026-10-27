"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { PdfPagePreview } from "./PdfPagePreview";

interface SortablePdfItemProps {
  id: string;
  file: File;
  index: number;
  onRemove: () => void;
  disabled?: boolean;
}

export function SortablePdfItem({
  id,
  file,
  index,
  onRemove,
  disabled = false,
}: SortablePdfItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style: React.CSSProperties = {
    // When actively dragging, transform immediately (no lag/delay)
    // When released or moving into place, animate smoothly
    transform: CSS.Translate.toString(transform),
    transition: isDragging ? undefined : transition || undefined,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <PdfPagePreview
        file={file}
        index={index}
        onRemove={onRemove}
        isDragging={isDragging}
      />
    </div>
  );
}
