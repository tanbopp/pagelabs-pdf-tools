"use client";

import { parseApiError } from "@/lib/api-client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Header } from "@/components/layout-shell";
import {
  FileDropZone,
  OrganizePageCard,
  type OrganizePageItemData,
  ProgressCard,
  ResultCard,
  ErrorAlert,
} from "@/components/shared";
import { toast } from "sonner";
import { getAllPdfPagesPreviews } from "@/lib/pdf-all-pages";
import {
  Plus,
  ArrowRight,
  RefreshCcw,
  Info,
  Loader2,
  RotateCw,
  Trash2,
  ArrowDownAZ,
  ArrowDown10,
  Shuffle,
  FilePlus2,
  FileText,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Distinct modern color-coding palette for multi-file items (Dark/Light neutral compliant)
const FILE_COLOR_PALETTES = [
  {
    badgeBg: "bg-blue-500",
    borderClass: "border-blue-500 hover:border-blue-400",
    name: "Blue",
  },
  {
    badgeBg: "bg-emerald-500",
    borderClass: "border-emerald-500 hover:border-emerald-400",
    name: "Emerald",
  },
  {
    badgeBg: "bg-amber-500",
    borderClass: "border-amber-500 hover:border-amber-400",
    name: "Amber",
  },
  {
    badgeBg: "bg-purple-500",
    borderClass: "border-purple-500 hover:border-purple-400",
    name: "Purple",
  },
  {
    badgeBg: "bg-rose-500",
    borderClass: "border-rose-500 hover:border-rose-400",
    name: "Rose",
  },
  {
    badgeBg: "bg-cyan-500",
    borderClass: "border-cyan-500 hover:border-cyan-400",
    name: "Cyan",
  },
  {
    badgeBg: "bg-lime-500",
    borderClass: "border-lime-500 hover:border-lime-400",
    name: "Lime",
  },
  {
    badgeBg: "bg-fuchsia-500",
    borderClass: "border-fuchsia-500 hover:border-fuchsia-400",
    name: "Fuchsia",
  },
];

interface ManagedFile {
  id: string; // "file-0", "file-1"
  file: File;
  colorIndex: number;
  palette: typeof FILE_COLOR_PALETTES[0];
  pageCount: number;
}

export default function OrganizePdfPage() {
  const [filesList, setFilesList] = useState<ManagedFile[]>([]);
  const [pages, setPages] = useState<OrganizePageItemData[]>([]);
  const [selectedPageIds, setSelectedPageIds] = useState<Set<string>>(new Set());
  const [loadingPages, setLoadingPages] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState({ current: 0, total: 0 });
  const [activeItem, setActiveItem] = useState<OrganizePageItemData | null>(null);
  const [outputBaseName, setOutputBaseName] = useState("organized");

  const [status, setStatus] = useState<"idle" | "processing" | "completed" | "failed">("idle");
  const [isCanvasDragOver, setIsCanvasDragOver] = useState(false);
  const canvasDragCounter = useRef(0);
  const [jobId, setJobId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resultData, setResultData] = useState<{
    downloadUrl: string;
    resultSize: number;
    filename: string;
  } | null>(null);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const addFileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Process incoming files (Initial upload or adding more files)
  const processNewFiles = async (incomingFiles: File[]) => {
    if (incomingFiles.length === 0) return;
    setErrorMessage(null);
    setLoadingPages(true);

    try {
      const newFilesList = [...filesList];
      const newPagesList = [...pages];

      for (let i = 0; i < incomingFiles.length; i++) {
        const fileObj = incomingFiles[i];
        const nextColorIdx = newFilesList.length % FILE_COLOR_PALETTES.length;
        const palette = FILE_COLOR_PALETTES[nextColorIdx];
        const fileId = `file-${Date.now()}-${i}`;

        // Render previews
        const thumbnails = await getAllPdfPagesPreviews(fileObj, (curr, total) => {
          setLoadingProgress({ current: curr, total });
        });

        const managed: ManagedFile = {
          id: fileId,
          file: fileObj,
          colorIndex: nextColorIdx,
          palette,
          pageCount: thumbnails.length,
        };
        newFilesList.push(managed);

        const pageItems: OrganizePageItemData[] = thumbnails.map((thumb, pIdx) => ({
          id: `page-${fileId}-${pIdx}-${Date.now()}`,
          fileId,
          fileIndex: newFilesList.length - 1,
          fileName: fileObj.name,
          colorClass: palette.borderClass,
          originalIndex: pIdx,
          rotation: 0,
          thumbnail: thumb,
          isBlank: false,
        }));
        newPagesList.push(...pageItems);
      }

      setFilesList(newFilesList);
      setPages(newPagesList);
      toast.success(`Loaded ${incomingFiles.length} file${incomingFiles.length > 1 ? "s" : ""}`);
    } catch (err) {
      toast.error("Failed to render PDF pages");
    } finally {
      setLoadingPages(false);
    }
  };

  // Add a blank page
  const handleAddBlankPage = (insertIndex?: number) => {
    const blankId = `blank-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newBlankPage: OrganizePageItemData = {
      id: blankId,
      fileId: "blank",
      fileIndex: -1,
      fileName: "Blank Page",
      colorClass: "border-muted-foreground/30",
      originalIndex: 0,
      rotation: 0,
      thumbnail: "",
      isBlank: true,
    };

    setPages((prev) => {
      if (typeof insertIndex === "number" && insertIndex >= 0 && insertIndex <= prev.length) {
        const copy = [...prev];
        copy.splice(insertIndex, 0, newBlankPage);
        return copy;
      }
      return [...prev, newBlankPage];
    });
    toast.success("Added blank page");
  };

  // Selection toggle
  const handleToggleSelectPage = (id: string) => {
    setSelectedPageIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleClearSelection = () => {
    setSelectedPageIds(new Set());
  };

  // Bulk actions on selected pages
  const handleRotateSelected = () => {
    if (selectedPageIds.size === 0) return;
    setPages((prev) =>
      prev.map((p) =>
        selectedPageIds.has(p.id) && !p.isBlank
          ? { ...p, rotation: (p.rotation + 90) % 360 }
          : p
      )
    );
    toast.success(`Rotated ${selectedPageIds.size} selected page(s)`);
  };

  const handleDeleteSelected = () => {
    if (selectedPageIds.size === 0) return;
    if (pages.length - selectedPageIds.size < 1) {
      toast.error("At least one page must remain");
      return;
    }
    setPages((prev) => prev.filter((p) => !selectedPageIds.has(p.id)));
    setSelectedPageIds(new Set());
    toast.success("Deleted selected pages");
  };

  const handleInsertBlankAfterSelected = () => {
    if (selectedPageIds.size === 0) {
      handleAddBlankPage();
      return;
    }
    // Find highest index among selected
    let maxIdx = -1;
    pages.forEach((p, idx) => {
      if (selectedPageIds.has(p.id)) {
        maxIdx = Math.max(maxIdx, idx);
      }
    });
    handleAddBlankPage(maxIdx + 1);
  };

  // Single page actions
  const handleRotatePage = (id: string) => {
    setPages((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, rotation: (p.rotation + 90) % 360 } : p
      )
    );
  };

  const handleRemovePage = (id: string) => {
    if (pages.length <= 1) {
      toast.error("At least one page must remain");
      return;
    }
    setPages((prev) => prev.filter((p) => p.id !== id));
    setSelectedPageIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleRotateAll = () => {
    setPages((prev) =>
      prev.map((p) =>
        p.isBlank ? p : { ...p, rotation: (p.rotation + 90) % 360 }
      )
    );
    toast.success("Rotated all pages 90°");
  };

  // Drag & drop files directly onto canvas
  const handleCanvasDragEnter = (e: React.DragEvent) => {
    // Only respond to native OS file drags, not internal dnd-kit item dragging
    if (e.dataTransfer && e.dataTransfer.types.includes("Files")) {
      e.preventDefault();
      canvasDragCounter.current += 1;
      setIsCanvasDragOver(true);
    }
  };

  const handleCanvasDragOver = (e: React.DragEvent) => {
    if (e.dataTransfer && e.dataTransfer.types.includes("Files")) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
      if (!isCanvasDragOver) setIsCanvasDragOver(true);
    }
  };

  const handleCanvasDragLeave = (e: React.DragEvent) => {
    if (e.dataTransfer && e.dataTransfer.types.includes("Files")) {
      e.preventDefault();
      canvasDragCounter.current -= 1;
      if (canvasDragCounter.current <= 0) {
        canvasDragCounter.current = 0;
        setIsCanvasDragOver(false);
      }
    }
  };

  const handleCanvasDrop = (e: React.DragEvent) => {
    if (e.dataTransfer && e.dataTransfer.types.includes("Files")) {
      e.preventDefault();
      canvasDragCounter.current = 0;
      setIsCanvasDragOver(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        processNewFiles(Array.from(e.dataTransfer.files));
      }
    }
  };
  // 1. Sort by File Name A-Z
  const handleSortByFileName = () => {
    setPages((prev) => {
      return [...prev].sort((a, b) => a.fileName.localeCompare(b.fileName));
    });
    toast.success("Sorted pages by file name A-Z");
  };

  // 2. Sort by Page Number 1-9 (per file)
  const handleSortByPageNumber = () => {
    setPages((prev) => {
      return [...prev].sort((a, b) => {
        if (a.fileId === b.fileId) {
          return a.originalIndex - b.originalIndex;
        }
        return a.fileName.localeCompare(b.fileName);
      });
    });
    toast.success("Sorted pages by page numbers");
  };

  // 3. Interleave pages: File A p1, File B p1, File A p2, File B p2...
  const handleInterleavePages = () => {
    if (filesList.length <= 1) {
      toast.info("Need at least 2 files to interleave pages");
      return;
    }

    // Group pages by fileId
    const groups: Record<string, OrganizePageItemData[]> = {};
    filesList.forEach((f) => {
      groups[f.id] = pages.filter((p) => p.fileId === f.id);
    });

    const maxLen = Math.max(...Object.values(groups).map((arr) => arr.length));
    const interleaved: OrganizePageItemData[] = [];

    for (let i = 0; i < maxLen; i++) {
      for (const f of filesList) {
        const item = groups[f.id]?.[i];
        if (item) interleaved.push(item);
      }
    }

    // Append any blank pages at the end
    const blanks = pages.filter((p) => p.isBlank);
    interleaved.push(...blanks);

    setPages(interleaved);
    toast.success("Pages interleaved (1-1, 2-2...)");
  };

  const handleReset = () => {
    setFilesList([]);
    setPages([]);
    setSelectedPageIds(new Set());
    setStatus("idle");
    setJobId(null);
    setErrorMessage(null);
    setResultData(null);
    setOutputBaseName("organized");
  };

  // DnD Handlers
  const handleDragStart = (event: DragStartEvent) => {
    const item = pages.find((p) => p.id === event.active.id);
    if (item) setActiveItem(item);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveItem(null);

    if (over && active.id !== over.id) {
      setPages((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // Job Polling
  useEffect(() => {
    if (status === "processing" && jobId) {
      pollIntervalRef.current = setInterval(async () => {
        try {
          const res = await fetch(`${API_BASE}/api/v1/jobs/${jobId}`);
          if (!res.ok) throw new Error("Failed to query status");
          const data = await res.json();

          if (data.status === "completed") {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            setStatus("completed");
            setResultData({
              downloadUrl: `${API_BASE}${data.result_url}`,
              resultSize: data.result_size || 0,
              filename: `${outputBaseName}.pdf`,
            });
            toast.success("PDF organized successfully");
          } else if (data.status === "failed") {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            setStatus("failed");
            setErrorMessage(data.error_message || "Failed to organize PDF");
          }
        } catch { }
      }, 1000);
    }
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [status, jobId, outputBaseName]);

  // Submit Job
  const handleSubmit = async () => {
    if (filesList.length === 0 || pages.length === 0) return;
    setStatus("processing");
    setErrorMessage(null);

    try {
      // 1. Upload all unique files in filesList
      const uploadedMap = new Map<string, { url: string; name: string; size: number }>();
      const uploadedFilesArray: { url: string; name: string; size: number }[] = [];

      for (let i = 0; i < filesList.length; i++) {
        const item = filesList[i];
        const signRes = await fetch(`${API_BASE}/api/v1/uploads/sign`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: item.file.name,
            size: item.file.size,
            contentType: item.file.type || "application/pdf",
          }),
        });
        if (!signRes.ok) throw new Error("Failed to sign upload URL");
        const { uploadUrl, fileUrl } = await signRes.json();

        const uploadRes = await fetch(uploadUrl, {
          method: "PUT",
          body: item.file,
          headers: { "Content-Type": "application/pdf" },
        });
        if (!uploadRes.ok) throw new Error(`Failed to upload ${item.file.name}`);

        const fileRecord = { url: fileUrl, name: item.file.name, size: item.file.size };
        uploadedMap.set(item.id, fileRecord);
        uploadedFilesArray.push(fileRecord);
      }

      // 2. Prepare pages spec with exact fileIndex
      const pagesPayload = pages.map((p) => {
        if (p.isBlank) {
          return {
            fileId: "blank",
            fileIndex: 0,
            originalIndex: 0,
            rotation: p.rotation || 0,
          };
        }
        const fileIdx = filesList.findIndex((f) => f.id === p.fileId);
        return {
          fileId: p.fileId,
          fileIndex: fileIdx >= 0 ? fileIdx : 0,
          originalIndex: p.originalIndex,
          rotation: p.rotation || 0,
        };
      });

      const jobRes = await fetch(`${API_BASE}/api/v1/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "organize-pdf",
          files: uploadedFilesArray,
          options: {
            pages: pagesPayload,
            outputFilename: `${outputBaseName}.pdf`,
          },
        }),
      });

      if (!jobRes.ok) {
        const errMsg = await parseApiError(jobRes, "Failed to process job");
        throw new Error(errMsg);
      }

      const { jobId: newId } = await jobRes.json();
      setJobId(newId);
    } catch (err: unknown) {
      setStatus("failed");
      setErrorMessage(err instanceof Error ? err.message : "Failed to organize file");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />

      {/* Hidden file input for adding more files */}
      <input
        ref={addFileInputRef}
        type="file"
        multiple
        accept="application/pdf"
        className="hidden"
        onChange={(e) => {
          if (e.target.files) {
            processNewFiles(Array.from(e.target.files));
            e.target.value = "";
          }
        }}
      />

      {filesList.length === 0 ? (
        <FileDropZone
          accept="application/pdf"
          maxFiles={20}
          maxSizeMB={100}
          onFiles={processNewFiles}
          disabled={status === "processing"}
          title="Select PDF files"
          subtitle="or drop PDFs here"
          className="min-h-[calc(100vh-65px)] px-6 py-12"
        >
          {({ openFileDialog }) => (
            <div className="w-full max-w-2xl flex flex-col items-center text-center">
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground mb-3">
                Organize PDF
              </h1>
              <p className="text-base sm:text-lg font-medium text-muted-foreground mb-8 max-w-lg">
                Sort, rotate, insert blank pages, and merge multiple PDF pages into one document.
              </p>

              <button
                type="button"
                disabled={status === "processing"}
                onClick={openFileDialog}
                className="h-16 sm:h-20 px-8 sm:px-12 rounded-full bg-primary text-primary-foreground text-lg sm:text-xl font-bold flex items-center justify-center gap-3.5 shadow-none transition-all duration-150 cursor-pointer hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <Plus size={24} className="text-primary-foreground" />
                <span>Select PDF files</span>
              </button>

              <p className="mt-4 text-sm font-medium text-muted-foreground text-center">
                or drop PDFs here
              </p>
            </div>
          )}
        </FileDropZone>
      ) : loadingPages ? (
        <main className="flex-1 max-w-md w-full mx-auto px-6 py-24 flex flex-col items-center justify-center text-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-foreground" />
          <div className="text-base font-semibold">Processing PDF pages…</div>
          <div className="text-xs font-semibold text-muted-foreground">
            Rendered {loadingProgress.current} of {loadingProgress.total} pages
          </div>
        </main>
      ) : (
        <main className="flex-1 w-full flex flex-col lg:flex-row min-h-[calc(100vh-65px)]">
          {/* Left Canvas: Reorder Pages Grid with Color Borders & Direct File Dropzone */}
          <section
            onDragEnter={handleCanvasDragEnter}
            onDragOver={handleCanvasDragOver}
            onDragLeave={handleCanvasDragLeave}
            onDrop={handleCanvasDrop}
            className="relative flex-1 bg-muted/30 p-6 lg:p-10 flex flex-col justify-between overflow-y-auto min-h-[500px]"
          >
            {/* Active Canvas Drag Overlay */}
            {isCanvasDragOver && (
              <div className="absolute inset-4 z-50 pointer-events-none rounded-3xl border-2 border-dashed border-primary bg-background/90 backdrop-blur-sm flex flex-col items-center justify-center gap-3 animate-in fade-in zoom-in-95 duration-150">
                <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center animate-bounce shadow-none">
                  <Plus size={32} className="text-primary-foreground" />
                </div>
                <span className="text-xl font-bold text-foreground">
                  Add more PDF files to organize
                </span>
                <span className="text-xs font-semibold text-muted-foreground">
                  Release to append pages
                </span>
              </div>
            )}

            {/* Quick Sorter Vertical Floating Dock on the Right of Canvas (iLovePDF Style) */}
            <div className="hidden xl:flex absolute top-8 right-6 z-30 flex-col items-center gap-2 p-1.5 rounded-2xl border border-border bg-background/90 backdrop-blur-md shadow-md select-none">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider py-1">
                Sort
              </span>
              <button
                type="button"
                onClick={handleSortByFileName}
                title="Sort by file name A-Z"
                className="h-9 w-9 rounded-xl border border-border bg-card hover:bg-secondary text-foreground flex items-center justify-center transition-colors cursor-pointer group"
              >
                <ArrowDownAZ className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
              </button>
              <button
                type="button"
                onClick={handleSortByPageNumber}
                title="Sort by page numbers 1-9"
                className="h-9 w-9 rounded-xl border border-border bg-card hover:bg-secondary text-foreground flex items-center justify-center transition-colors cursor-pointer group"
              >
                <ArrowDown10 className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
              </button>
              <button
                type="button"
                onClick={handleInterleavePages}
                title="Interleave pages: 1-1, 2-2..."
                className="h-9 w-9 rounded-xl border border-border bg-card hover:bg-secondary text-foreground flex items-center justify-center transition-colors cursor-pointer group"
              >
                <Shuffle className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
              </button>
            </div>

            <div className="flex flex-col gap-6">
              {/* Header Bar inside Canvas */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-foreground">
                    {pages.length} Pages
                  </span>
                  <span className="text-xs font-medium text-muted-foreground">
                    ({filesList.length} PDF{filesList.length > 1 ? "s" : ""})
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap xl:pr-14">
                  {/* Add Blank Page Button */}
                  <button
                    type="button"
                    onClick={() => handleAddBlankPage()}
                    className="h-9 px-3.5 rounded-full border border-border bg-background hover:bg-secondary text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <FilePlus2 className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Add Blank Page</span>
                  </button>

                  {/* Rotate All Button */}
                  <button
                    type="button"
                    onClick={handleRotateAll}
                    title="Rotate all pages 90 degrees clockwise"
                    className="h-9 px-3.5 rounded-full border border-border bg-background hover:bg-secondary text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RotateCw className="h-3.5 w-3.5" />
                    <span>Rotate All</span>
                  </button>

                  {/* Add More Files Button */}
                  <button
                    type="button"
                    onClick={() => addFileInputRef.current?.click()}
                    title="Add more PDF files to organize"
                    className="h-9 px-3.5 rounded-full border border-border bg-background hover:bg-secondary text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Files</span>
                  </button>

                  {/* Reset Button */}
                  <button
                    type="button"
                    onClick={handleReset}
                    className="h-9 px-3.5 rounded-full border border-border bg-background hover:bg-secondary text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RefreshCcw className="h-3.5 w-3.5" />
                    <span>Reset</span>
                  </button>
                </div>
              </div>

              {/* DND Canvas Grid */}
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={pages.map((p) => p.id)}
                  strategy={rectSortingStrategy}
                >
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-5">
                    {pages.map((item, index) => (
                      <OrganizePageCard
                        key={item.id}
                        item={item}
                        index={index}
                        isSelected={selectedPageIds.has(item.id)}
                        onToggleSelect={() => handleToggleSelectPage(item.id)}
                        onRotate={() => handleRotatePage(item.id)}
                        onRemove={() => handleRemovePage(item.id)}
                        onInsertBlankLeft={() => handleAddBlankPage(index)}
                        onInsertBlankRight={() => handleAddBlankPage(index + 1)}
                        disabled={status === "processing"}
                      />
                    ))}
                  </div>
                </SortableContext>

                <DragOverlay
                  dropAnimation={{
                    duration: 220,
                    easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
                  }}
                >
                  {activeItem ? (
                    <div className="cursor-grabbing scale-105 shadow-2xl opacity-90">
                      <OrganizePageCard
                        item={activeItem}
                        index={pages.findIndex((p) => p.id === activeItem.id)}
                        onRotate={() => { }}
                        onRemove={() => { }}
                      />
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            </div>

            {/* Floating Selection Action Bar if items are selected - Fixed/Absolute on screen */}
            {selectedPageIds.size > 0 && (
              <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 p-2 rounded-full border border-border bg-background/95 backdrop-blur-md shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-150">
                <span className="px-3 text-xs font-bold text-foreground">
                  {selectedPageIds.size} Selected
                </span>
                <div className="h-4 w-px bg-border" />
                <button
                  type="button"
                  onClick={handleRotateSelected}
                  className="h-8 px-3 rounded-full bg-secondary hover:bg-muted text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCw className="h-3 w-3" />
                  <span>Rotate</span>
                </button>
                <button
                  type="button"
                  onClick={handleInsertBlankAfterSelected}
                  className="h-8 px-3 rounded-full bg-secondary hover:bg-muted text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FilePlus2 className="h-3 w-3" />
                  <span>Insert Blank Here</span>
                </button>
                <button
                  type="button"
                  onClick={handleDeleteSelected}
                  className="h-8 px-3 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Delete</span>
                </button>
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="h-8 px-2.5 rounded-full text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Clear
                </button>
              </div>
            )}
          </section>

          {/* Right Panel: Settings, File Legend & Sticky Action */}
          <aside className="w-full lg:w-[380px] shrink-0 border-t lg:border-t-0 lg:border-l border-border bg-card flex flex-col justify-between">
            <div className="p-6 lg:p-8 flex flex-col gap-6">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  Organize PDF
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Rearrange, combine, and organize pages before export.
                </p>
              </div>

              {/* Multi-file Legend List */}
              <div className="flex flex-col gap-2.5 pt-2 border-t border-border/70">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground">
                    Uploaded Files ({filesList.length})
                  </label>
                  <button
                    type="button"
                    onClick={() => addFileInputRef.current?.click()}
                    className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add PDF</span>
                  </button>
                </div>

                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                  {filesList.map((f, fIdx) => (
                    <div
                      key={f.id}
                      className="flex items-center justify-between gap-2.5 p-2.5 rounded-xl border border-border bg-background"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`h-3 w-3 rounded-full shrink-0 ${f.palette.badgeBg}`} />
                        <span className="text-xs font-semibold text-foreground truncate" title={f.file.name}>
                          {f.file.name}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-muted-foreground shrink-0">
                        {f.pageCount}p
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Output Name Input */}
              <div className="flex flex-col gap-1.5 pt-2 border-t border-border/70">
                <label htmlFor="output-name" className="text-xs font-semibold text-foreground">
                  Output filename
                </label>
                <div className="relative flex items-center">
                  <input
                    id="output-name"
                    type="text"
                    value={outputBaseName}
                    onChange={(e) => setOutputBaseName(e.target.value.replace(/\.pdf$/i, ""))}
                    className="w-full h-11 pl-4 pr-14 rounded-2xl border border-border bg-background text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  <span className="absolute right-3 px-2 py-0.5 rounded-lg bg-secondary text-[11px] font-bold text-muted-foreground select-none pointer-events-none">
                    .pdf
                  </span>
                </div>
              </div>

              {status === "failed" && errorMessage && (
                <ErrorAlert message={errorMessage} onRetry={handleSubmit} />
              )}

              {status === "processing" && (
                <ProgressCard progress={-1} label="Organizing your PDF document…" />
              )}

              {status === "completed" && resultData && (
                <ResultCard
                  filename={resultData.filename}
                  sizeBytes={resultData.resultSize}
                  downloadUrl={resultData.downloadUrl}
                  onReset={handleReset}
                />
              )}
            </div>

            {/* Pinned Action Area */}
            <div className="p-6 lg:p-8 border-t border-border bg-background shrink-0 flex flex-col gap-2.5">
              {status !== "completed" && (
                <>
                  <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                    <span>Pages to export</span>
                    <span className="font-semibold text-foreground">
                      {pages.length} Pages
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={status === "processing" || pages.length === 0}
                    className="w-full h-14 rounded-full bg-primary text-primary-foreground text-base font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer shadow-none"
                  >
                    <span>{status === "processing" ? "Organizing…" : "Organize PDF"}</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          </aside>
        </main>
      )}
    </div>
  );
}
