"use client";

import React, { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface FileDropZoneProps {
  accept: string;
  maxFiles: number;
  maxSizeMB: number;
  onFiles: (files: File[]) => void;
  disabled?: boolean;
  title?: string;
  subtitle?: string;
  formatName?: string;
}

export function FileDropZone({
  accept,
  maxFiles,
  maxSizeMB,
  onFiles,
  disabled = false,
  title,
  subtitle,
  formatName,
}: FileDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndAddFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const filesArray = Array.from(fileList);

    if (filesArray.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files`);
      return;
    }

    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    const validFiles: File[] = [];

    // Parse accepted extensions / mime types
    const acceptTokens = accept
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    for (const file of filesArray) {
      if (file.size > maxSizeBytes) {
        toast.error(`File too large: ${file.name}`);
        continue;
      }

      if (acceptTokens.length > 0 && !acceptTokens.includes("*/*")) {
        const fileExt = `.${file.name.split(".").pop()?.toLowerCase() || ""}`;
        const fileMime = file.type.toLowerCase();

        const isAccepted = acceptTokens.some((token) => {
          if (token.startsWith(".")) {
            return fileExt === token;
          }
          if (token.endsWith("/*")) {
            const prefix = token.slice(0, -2);
            return fileMime.startsWith(prefix);
          }
          return fileMime === token;
        });

        if (!isAccepted) {
          toast.error(`Invalid file type: ${file.name}`);
          continue;
        }
      }

      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      onFiles(validFiles);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;
    validateAndAddFiles(e.dataTransfer.files);
  };

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      aria-describedby="file-dropzone-constraints"
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(e) => {
        if (!disabled && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "rounded-3xl border-2 border-dashed p-12 min-h-[280px] flex flex-col items-center justify-center gap-3 transition-colors cursor-pointer select-none",
        isDragOver
          ? "border-foreground bg-accent"
          : "border-border bg-card/40 hover:border-foreground/50",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <input
        ref={inputRef}
        type="file"
        multiple={maxFiles > 1}
        accept={accept}
        disabled={disabled}
        className="hidden"
        onChange={(e) => {
          validateAndAddFiles(e.target.files);
          if (inputRef.current) inputRef.current.value = "";
        }}
      />
      <UploadCloud className="h-10 w-10 text-foreground" />
      <div className="text-lg font-semibold text-foreground text-center">
        {title || "Drop PDF here"}
      </div>
      <div className="text-sm font-medium text-muted-foreground text-center">
        {subtitle || "or click to browse"}
      </div>
      <div
        id="file-dropzone-constraints"
        className="text-xs font-semibold text-muted-foreground mt-4 text-center"
      >
        {formatName || "PDF"} · max {maxSizeMB} MB · up to {maxFiles} files
      </div>
    </div>
  );
}
