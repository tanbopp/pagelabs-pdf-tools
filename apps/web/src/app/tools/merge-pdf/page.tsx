"use client";
import { parseApiError } from "@/lib/api-client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Header } from "@/components/layout-shell";
import {
  EmptyState,
  FileDropZone,
  SortablePdfItem,
  PdfPagePreview,
  ProgressCard,
  ResultCard,
  ErrorAlert,
} from "@/components/shared";
import { toast } from "sonner";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import { Plus, ChevronRight, Info, ArrowRight, ArrowDownAZ } from "lucide-react";
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

interface UploadedFileInfo {
  url: string;
  name: string;
  size: number;
}

interface FileItem {
  id: string;
  file: File;
}

export default function MergePdfPage() {
  const [fileItems, setFileItems] = useState<FileItem[]>([]);
  const [activeItem, setActiveItem] = useState<FileItem | null>(null);
  const [outputBaseName, setOutputBaseName] = useState("merged");
  const [addBookmarks, setAddBookmarks] = useState(false);

  // Job states: idle | processing | completed | failed
  const [status, setStatus] = useState<"idle" | "processing" | "completed" | "failed">("idle");
  const [jobId, setJobId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resultData, setResultData] = useState<{
    downloadUrl: string;
    resultSize: number;
    filename: string;
  } | null>(null);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const addMoreInputRef = useRef<HTMLInputElement>(null);

  const computedFilename = `${outputBaseName.trim() || "merged"}.pdf`;

  // Instant pointer sensor (distance: 3px for immediate zero-delay pickup without accidental clicks)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleFilesAdded = (newFiles: File[]) => {
    setFileItems((prev) => {
      const remainingSlots = 20 - prev.length;
      if (remainingSlots <= 0) {
        toast.error("Maximum 20 files reached");
        return prev;
      }

      if (newFiles.length > remainingSlots) {
        toast.error(`Added only ${remainingSlots} files (max 20 allowed)`);
      }

      const filesToAdd = newFiles.slice(0, remainingSlots);
      const newItems: FileItem[] = filesToAdd.map((file) => ({
        id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        file,
      }));

      return [...prev, ...newItems];
    });
    setErrorMessage(null);
  };

  const handleRemoveFile = (idToRemove: string) => {
    if (status === "processing") return;
    setFileItems((prev) => prev.filter((item) => item.id !== idToRemove));
  };

  const handleDragStart = (event: DragStartEvent) => {
    const item = fileItems.find((f) => f.id === event.active.id);
    if (item) {
      setActiveItem(item);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveItem(null);

    if (over && active.id !== over.id) {
      setFileItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSortByName = () => {
    setFileItems((prev) =>
      [...prev].sort((a, b) =>
        a.file.name.localeCompare(b.file.name, undefined, { numeric: true, sensitivity: "base" })
      )
    );
    toast.success("Files sorted alphabetically (A-Z)");
  };

  const handleReset = () => {
    setFileItems([]);
    setStatus("idle");
    setJobId(null);
    setErrorMessage(null);
    setResultData(null);
    setOutputBaseName("merged");
    setAddBookmarks(false);
  };

  useEffect(() => {
    if (status === "processing" && jobId) {
      pollIntervalRef.current = setInterval(async () => {
        try {
          const res = await fetch(`${API_BASE}/api/v1/jobs/${jobId}`);
          if (!res.ok) throw new Error("Failed to query job status");
          const data = await res.json();

          if (data.status === "completed") {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            setStatus("completed");
            setResultData({
              downloadUrl: `${API_BASE}${data.result_url}`,
              resultSize: data.result_size || 0,
              filename: computedFilename,
            });
            toast.success("PDF merged successfully");
          } else if (data.status === "failed") {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            setStatus("failed");
            setErrorMessage(data.error_message || "Failed to process PDF");
          }
        } catch {
          // ignore transient poll error
        }
      }, 1000);
    }

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [status, jobId, computedFilename]);

  const handleSubmit = async () => {
    if (fileItems.length < 2) return;

    setStatus("processing");
    setErrorMessage(null);

    try {
      const uploadedFiles: UploadedFileInfo[] = [];

      for (const item of fileItems) {
        const file = item.file;
        const signRes = await fetch(`${API_BASE}/api/v1/uploads/sign`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: file.name,
            size: file.size,
            contentType: file.type || "application/pdf",
          }),
        });

        if (!signRes.ok) {
          const errMsg = await parseApiError(signRes, "Failed to sign upload");
          throw new Error(errMsg);
        }

        const { uploadUrl, fileUrl } = await signRes.json();

        const uploadRes = await fetch(uploadUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": "application/pdf" },
        });

        if (!uploadRes.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }

        uploadedFiles.push({
          url: fileUrl,
          name: file.name,
          size: file.size,
        });
      }

      const jobRes = await fetch(`${API_BASE}/api/v1/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "merge-pdf",
          files: uploadedFiles,
          options: {
            outputFilename: computedFilename,
            addBookmarks,
          },
        }),
      });

      if (!jobRes.ok) {
        const errMsg = await parseApiError(jobRes, "Failed to process job");
        throw new Error(errMsg);
      }

      const { jobId: newJobId } = await jobRes.json();
      setJobId(newJobId);
    } catch (err: unknown) {
      setStatus("failed");
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to process files"
      );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />

      {fileItems.length === 0 ? (
        <EmptyState
          title="Merge PDF files"
          description="Combine multiple PDF files into a single document in your chosen order."
          accept="application/pdf"
          maxFiles={20}
          maxSizeMB={100}
          formatName="PDF"
          onFiles={handleFilesAdded}
          disabled={status === "processing"}
        />
      ) : (
        <main className="flex-1 w-full flex flex-col lg:flex-row min-h-[calc(100vh-65px)]">
          {/* Left Canvas: iLovePDF Style with Light Gray / Neutral Canvas */}
          <section className="flex-1 bg-muted/30 p-6 lg:p-10 flex flex-col justify-between overflow-y-auto min-h-[500px]">
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-end">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-muted-foreground">
                    {fileItems.length} of 20 files
                  </span>
                  {fileItems.length > 1 && (
                    <button
                      type="button"
                      onClick={handleSortByName}
                      title="Sort files by name A to Z"
                      className="h-9 px-3.5 rounded-full border border-border bg-background hover:bg-secondary text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <ArrowDownAZ className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Sort A-Z</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => addMoreInputRef.current?.click()}
                    className="h-9 px-4 rounded-full border border-border bg-background hover:bg-secondary text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add files</span>
                  </button>
                </div>
              </div>

              {/* Direct Sortable Grid with DragOverlay */}
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={fileItems.map((item) => item.id)}
                  strategy={rectSortingStrategy}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                    {fileItems.map((item, index) => (
                      <SortablePdfItem
                        key={item.id}
                        id={item.id}
                        file={item.file}
                        index={index}
                        onRemove={() => handleRemoveFile(item.id)}
                        disabled={status === "processing"}
                      />
                    ))}

                    {/* Add more files dashed card */}
                    {fileItems.length < 20 && status !== "processing" && (
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => addMoreInputRef.current?.click()}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            addMoreInputRef.current?.click();
                          }
                        }}
                        className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border hover:border-foreground/40 bg-background/60 p-6 aspect-[3/4] cursor-pointer transition-colors text-muted-foreground hover:text-foreground select-none"
                      >
                        <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center mb-2.5">
                          <Plus className="h-5 w-5" />
                        </div>
                        <span className="text-xs font-semibold">Add more files</span>
                      </div>
                    )}
                  </div>
                </SortableContext>

                <DragOverlay dropAnimation={{
                  duration: 250,
                  easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
                }}>
                  {activeItem ? (
                    <div className="cursor-grabbing">
                      <PdfPagePreview
                        file={activeItem.file}
                        index={fileItems.findIndex((f) => f.id === activeItem.id)}
                        onRemove={() => { }}
                      />
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>

              <input
                ref={addMoreInputRef}
                type="file"
                multiple
                accept="application/pdf"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) {
                    handleFilesAdded(Array.from(e.target.files));
                  }
                  if (addMoreInputRef.current) {
                    addMoreInputRef.current.value = "";
                  }
                }}
              />
            </div>
          </section>

          {/* Right Panel: Sticky iLovePDF Style Options & Action */}
          <aside className="w-full lg:w-[380px] xl:w-[420px] shrink-0 border-t lg:border-t-0 lg:border-l border-border bg-background lg:sticky lg:top-16 lg:h-[calc(100vh-65px)] flex flex-col justify-between overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 lg:p-8 flex flex-col gap-5 [scrollbar-width:thin] [scrollbar-color:hsl(var(--border))_transparent]">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground mb-1">
                  Merge PDF
                </h2>
              </div>

              {/* Options */}
              <div className="flex flex-col gap-4 pt-1">
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="output-basename"
                    className="text-xs font-semibold text-foreground"
                  >
                    Output filename
                  </label>
                  <div className="relative flex items-center">
                    <input
                      id="output-basename"
                      type="text"
                      value={outputBaseName}
                      onChange={(e) => setOutputBaseName(e.target.value.replace(/\.pdf$/i, ""))}
                      disabled={status === "processing"}
                      placeholder="merged"
                      className="w-full h-10 pl-3.5 pr-14 rounded-xl border border-border bg-background text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                    <span className="absolute right-3 px-2 py-0.5 rounded-lg bg-secondary text-[11px] font-bold text-muted-foreground pointer-events-none select-none">
                      .pdf
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between py-1">
                  <label
                    htmlFor="add-bookmarks"
                    className="text-xs font-semibold text-foreground cursor-pointer"
                  >
                    Add bookmark per file
                  </label>
                  <SwitchPrimitives.Root
                    id="add-bookmarks"
                    checked={addBookmarks}
                    onCheckedChange={setAddBookmarks}
                    disabled={status === "processing"}
                    className="w-11 h-6 rounded-full border border-border bg-secondary data-[state=checked]:bg-foreground transition-colors relative focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <SwitchPrimitives.Thumb className="block w-5 h-5 rounded-full bg-background data-[state=checked]:translate-x-5 transition-transform" />
                  </SwitchPrimitives.Root>
                </div>
              </div>

              {/* Error Alert */}
              {status === "failed" && errorMessage && (
                <ErrorAlert message={errorMessage} onRetry={handleSubmit} />
              )}

              {/* Progress Card */}
              {status === "processing" && (
                <ProgressCard progress={-1} label="Merging your files…" />
              )}

              {/* Result Card */}
              {status === "completed" && resultData && (
                <ResultCard
                  filename={resultData.filename}
                  sizeBytes={resultData.resultSize}
                  downloadUrl={resultData.downloadUrl}
                  onReset={handleReset}
                />
              )}
            </div>

            {/* Pinned Primary Merge Action Button */}
            <div className="p-6 lg:p-8 border-t border-border bg-background shrink-0 flex flex-col gap-2.5">
              {status !== "completed" && (
                <>
                  <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                    <span>Order</span>
                    <span className="font-semibold text-foreground">
                      {fileItems.length} file{fileItems.length > 1 ? "s" : ""}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={fileItems.length < 2 || status === "processing"}
                    className="w-full h-14 rounded-full bg-primary text-primary-foreground text-base font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity cursor-pointer shadow-none"
                  >
                    <span>
                      {status === "processing"
                        ? "Merging…"
                        : fileItems.length < 2
                          ? "Select at least 2 files"
                          : `Merge PDF`}
                    </span>
                    {status !== "processing" && fileItems.length >= 2 && <ArrowRight className="h-4 w-4" />}
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
