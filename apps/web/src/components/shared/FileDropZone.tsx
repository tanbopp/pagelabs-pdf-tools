"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { HugeUpload } from "@/components/icons";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface FileDropZoneRenderProps {
  openFileDialog: () => void;
  isDragOver: boolean;
  disabled: boolean;
}

export interface FileDropZoneProps {
  accept: string;
  maxFiles: number;
  maxSizeMB: number;
  onFiles: (files: File[]) => void;
  disabled?: boolean;
  title?: string;
  subtitle?: string;
  formatName?: string;
  className?: string;
  children?: React.ReactNode | ((props: FileDropZoneRenderProps) => React.ReactNode);
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
  className,
  children,
}: FileDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const dragCounter = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndAddFiles = useCallback((fileList: FileList | File[] | null, isFromPaste = false) => {
    if (!fileList || fileList.length === 0) return;

    const filesArray = Array.from(fileList);

    if (filesArray.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} file${maxFiles > 1 ? "s" : ""}`);
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
      if (file.size > 100 * 1024 * 1024) {
        toast.error("File exceeds 100MB limit. Please upgrade to Pro (coming soon).");
        continue;
      }

      if (file.size > maxSizeBytes) {
        toast.error(`File too large: ${file.name} (Max ${maxSizeMB}MB)`);
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
      if (isFromPaste) {
        toast.success("File pasted from clipboard");
      } else if (validFiles.length === 1) {
        toast.success(`1 file added: ${validFiles[0].name}`);
      } else {
        toast.success(`${validFiles.length} files added`);
      }
      onFiles(validFiles);
    }
  }, [accept, maxFiles, maxSizeMB, onFiles]);

  // Global Paste from Clipboard (Ctrl+V) handler
  useEffect(() => {
    if (disabled) return;

    const handlePaste = (e: ClipboardEvent) => {
      // Don't intercept paste inside text inputs or textareas
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length > 0) {
        e.preventDefault();
        validateAndAddFiles(e.clipboardData.files, true);
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => {
      window.removeEventListener("paste", handlePaste);
    };
  }, [disabled, validateAndAddFiles]);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    dragCounter.current += 1;
    if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
      setIsDragOver(true);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = "copy";
    }
    if (!isDragOver) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragOver(false);
    if (disabled) return;
    validateAndAddFiles(e.dataTransfer.files);
  };

  const buttonText = title || `Select ${formatName || "PDF"} file${maxFiles > 1 ? "s" : ""}`;
  const dropText = subtitle || `or drop ${formatName || "PDF"}${maxFiles > 1 ? "s" : ""} here`;

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "relative w-full flex-1 flex flex-col items-center justify-center transition-all duration-200 select-none",
        className
      )}
    >
      <input
        ref={inputRef}
        type="file"
        multiple={maxFiles > 1}
        accept={accept}
        disabled={disabled}
        aria-label="Upload file input"
        className="hidden"
        onChange={(e) => {
          validateAndAddFiles(e.target.files);
          if (inputRef.current) inputRef.current.value = "";
        }}
      />

      {/* Drag Over Active Overlay Effect covering the entire area */}
      {isDragOver && (
        <div className="absolute inset-3 sm:inset-6 z-30 pointer-events-none rounded-3xl border-2 border-dashed border-primary bg-background/90 backdrop-blur-sm flex flex-col items-center justify-center gap-3 animate-in fade-in zoom-in-95 duration-150">
          <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center animate-bounce shadow-none">
            <HugeUpload size={30} className="text-primary-foreground" />
          </div>
          <span className="text-xl sm:text-2xl font-bold text-foreground">
            Drop your {formatName || "file"} here
          </span>
          <span className="text-xs sm:text-sm font-semibold text-muted-foreground">
            Release to instantly upload
          </span>
        </div>
      )}

      {typeof children === "function" ? (
        children({
          openFileDialog: () => inputRef.current?.click(),
          isDragOver,
          disabled,
        })
      ) : children ? (
        children
      ) : (
        <div className="w-full flex flex-col items-center justify-center p-8">
          {/* Primary iLovePDF-style Upload Button */}
          <button
            type="button"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
            className={cn(
              "h-16 sm:h-20 px-8 sm:px-12 rounded-full bg-primary text-primary-foreground text-lg sm:text-xl font-bold flex items-center justify-center gap-3.5 shadow-none transition-all duration-150 cursor-pointer hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              disabled && "opacity-50 cursor-not-allowed hover:scale-100"
            )}
          >
            <HugeUpload size={24} className="text-primary-foreground" />
            <span>{buttonText}</span>
          </button>

          {/* "or drop file here" microcopy */}
          <p className="mt-4 text-sm font-medium text-muted-foreground text-center">
            {dropText}
          </p>
        </div>
      )}
    </div>
  );
}
