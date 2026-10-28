"use client";
import { parseApiError } from "@/lib/api-client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Header } from "@/components/layout-shell";
import {
  FileDropZone,
  SplitPageCard,
  type SplitPageItemData,
  ProgressCard,
  ResultCard,
  ErrorAlert,
} from "@/components/shared";
import { toast } from "sonner";
import { getAllPdfPagesPreviews } from "@/lib/pdf-all-pages";
import { ChevronRight, ArrowRight, RefreshCcw, Info, Loader2, CheckSquare, Square } from "lucide-react";
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

export default function SplitPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<SplitPageItemData[]>([]);
  const [loadingPages, setLoadingPages] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState({ current: 0, total: 0 });
  const [activeItem, setActiveItem] = useState<SplitPageItemData | null>(null);
  const [outputBaseName, setOutputBaseName] = useState("split");

  const [status, setStatus] = useState<"idle" | "processing" | "completed" | "failed">("idle");
  const [jobId, setJobId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resultData, setResultData] = useState<{
    downloadUrl: string;
    resultSize: number;
    filename: string;
  } | null>(null);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleFile = async (files: File[]) => {
    if (files.length === 0) return;
    const selectedFile = files[0];
    setFile(selectedFile);
    setErrorMessage(null);
    setLoadingPages(true);

    try {
      const thumbnails = await getAllPdfPagesPreviews(selectedFile, (curr, total) => {
        setLoadingProgress({ current: curr, total });
      });

      const initialPages: SplitPageItemData[] = thumbnails.map((thumb, idx) => ({
        id: `split-page-${idx}-${Date.now()}`,
        originalIndex: idx,
        name: `page_${idx + 1}`,
        thumbnail: thumb,
        selected: true, // all selected by default
      }));

      setPages(initialPages);
    } catch {
      toast.error("Failed to render PDF pages");
      setFile(null);
    } finally {
      setLoadingPages(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPages([]);
    setStatus("idle");
    setJobId(null);
    setErrorMessage(null);
    setResultData(null);
    setOutputBaseName("split");
  };

  const handleToggleSelect = (id: string) => {
    setPages((prev) =>
      prev.map((p) => (p.id === id ? { ...p, selected: !p.selected } : p))
    );
  };

  const handleSelectAll = (select: boolean) => {
    setPages((prev) => prev.map((p) => ({ ...p, selected: select })));
  };

  const handleRenamePage = (id: string, newName: string) => {
    setPages((prev) =>
      prev.map((p) => (p.id === id ? { ...p, name: newName } : p))
    );
  };

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

  const selectedPages = pages.filter((p) => p.selected);

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
              filename: `${outputBaseName}.zip`,
            });
            toast.success("PDF split successfully");
          } else if (data.status === "failed") {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            setStatus("failed");
            setErrorMessage(data.error_message || "Failed to split PDF");
          }
        } catch {}
      }, 1000);
    }
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [status, jobId, outputBaseName]);

  const handleSubmit = async () => {
    if (!file || selectedPages.length === 0) return;
    setStatus("processing");
    setErrorMessage(null);

    try {
      const signRes = await fetch(`${API_BASE}/api/v1/uploads/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          size: file.size,
          contentType: file.type || "application/pdf",
        }),
      });
      if (!signRes.ok) throw new Error("Failed to sign upload URL");
      const { uploadUrl, fileUrl } = await signRes.json();

      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": "application/pdf" },
      });
      if (!uploadRes.ok) throw new Error("Failed to upload file");

      const pagesPayload = selectedPages.map((p) => ({
        originalIndex: p.originalIndex,
        name: `${p.name}.pdf`,
      }));

      const jobRes = await fetch(`${API_BASE}/api/v1/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "split-pdf",
          files: [{ url: fileUrl, name: file.name, size: file.size }],
          options: {
            mode: "visual",
            pages: pagesPayload,
            outputFilename: `${outputBaseName}.zip`,
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
      setErrorMessage(err instanceof Error ? err.message : "Failed to split file");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />

      {!file ? (
        <main className="flex-1 w-full max-w-[1600px] mx-auto px-6 lg:px-10 py-12 flex flex-col">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground mb-8">
            <Link href="/" className="hover:text-foreground transition-colors">Tools</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground">Split PDF</span>
          </nav>

          <div className="mb-12">
            <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Split PDF</h1>
            <p className="text-base font-medium text-muted-foreground">Reorder, rename, and split individual pages.</p>
          </div>

          <FileDropZone
            accept="application/pdf"
            maxFiles={1}
            maxSizeMB={100}
            onFiles={handleFile}
            disabled={status === "processing"}
          />
        </main>
      ) : loadingPages ? (
        <main className="flex-1 max-w-md w-full mx-auto px-6 py-24 flex flex-col items-center justify-center text-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-foreground" />
          <div className="text-base font-semibold">Extracting PDF pages…</div>
          <div className="text-xs font-semibold text-muted-foreground">
            Rendered {loadingProgress.current} of {loadingProgress.total} pages
          </div>
        </main>
      ) : (
        <main className="flex-1 w-full max-w-[1600px] mx-auto px-6 lg:px-10 py-8 flex flex-col lg:flex-row gap-10 items-start">
          {/* Left Canvas: Visual Page Cards for Split */}
          <section className="flex-1 w-full flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
                <Link href="/" className="hover:text-foreground transition-colors">Tools</Link>
                <ChevronRight className="h-4 w-4" />
                <span className="text-foreground">Split PDF</span>
              </nav>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => handleSelectAll(selectedPages.length !== pages.length)}
                  className="h-9 px-3.5 rounded-full border border-border bg-card hover:bg-secondary text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {selectedPages.length === pages.length ? (
                    <>
                      <Square className="h-3.5 w-3.5" />
                      <span>Deselect all</span>
                    </>
                  ) : (
                    <>
                      <CheckSquare className="h-3.5 w-3.5" />
                      <span>Select all</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="h-9 px-3.5 rounded-full border border-border bg-card hover:bg-secondary text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCcw className="h-3.5 w-3.5" />
                  <span>Change file</span>
                </button>
              </div>
            </div>

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
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                  {pages.map((item, index) => (
                    <SplitPageCard
                      key={item.id}
                      item={item}
                      index={index}
                      onToggleSelect={() => handleToggleSelect(item.id)}
                      onRename={(newName) => handleRenamePage(item.id, newName)}
                      disabled={status === "processing"}
                    />
                  ))}
                </div>
              </SortableContext>

              <DragOverlay dropAnimation={{
                duration: 250,
                easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
              }}>
                {activeItem ? (
                  <div className="cursor-grabbing">
                    <SplitPageCard
                      item={activeItem}
                      index={pages.findIndex((p) => p.id === activeItem.id)}
                      onToggleSelect={() => {}}
                      onRename={() => {}}
                    />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </section>

          {/* Right Panel: Split Actions */}
          <aside className="w-full lg:w-[380px] shrink-0 sticky top-6 flex flex-col gap-6">
            <div className="rounded-3xl border border-border bg-card p-6 flex flex-col gap-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground mb-1">Split PDF</h2>
                <p className="text-xs font-medium text-muted-foreground">
                  Drag pages to reorder. Click on page filename to rename.
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-secondary/50 p-3.5 flex items-start gap-2.5 text-muted-foreground">
                <Info className="h-4 w-4 shrink-0 text-foreground mt-0.5" />
                <p className="text-xs font-semibold leading-relaxed">
                  Only checked pages will be split and packaged into the output ZIP archive.
                </p>
              </div>

              {/* Status summary */}
              <div className="flex flex-col gap-2 pt-2 border-t border-border/80">
                <label className="text-xs font-semibold text-foreground">
                  Pages to split
                </label>
                <div className="h-11 px-4 rounded-2xl border border-border bg-background text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>{selectedPages.length} of {pages.length} pages</span>
                  <span className="text-[11px] text-muted-foreground font-normal">ZIP archive</span>
                </div>
              </div>

              {/* Output Zip Name */}
              <div className="flex flex-col gap-2">
                <label htmlFor="split-zip-name" className="text-xs font-semibold text-foreground">
                  Output archive name
                </label>
                <div className="relative flex items-center">
                  <input
                    id="split-zip-name"
                    type="text"
                    value={outputBaseName}
                    onChange={(e) => setOutputBaseName(e.target.value.replace(/\.zip$/i, ""))}
                    disabled={status === "processing"}
                    className="w-full h-11 pl-4 pr-14 rounded-2xl border border-border bg-background text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  <span className="absolute right-3 px-2 py-0.5 rounded-lg bg-secondary text-[11px] font-bold text-muted-foreground select-none pointer-events-none">
                    .zip
                  </span>
                </div>
              </div>

              {status === "failed" && errorMessage && (
                <ErrorAlert message={errorMessage} onRetry={handleSubmit} />
              )}

              {status === "processing" && (
                <ProgressCard progress={-1} label="Splitting your PDF…" />
              )}

              {status === "completed" && resultData && (
                <ResultCard
                  filename={resultData.filename}
                  sizeBytes={resultData.resultSize}
                  downloadUrl={resultData.downloadUrl}
                  onReset={handleReset}
                />
              )}

              {status !== "completed" && (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={status === "processing" || selectedPages.length === 0}
                  className="w-full h-14 rounded-full bg-primary text-primary-foreground text-base font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer"
                >
                  <span>
                    {status === "processing"
                      ? "Splitting…"
                      : `Split ${selectedPages.length} Page${selectedPages.length > 1 ? "s" : ""}`}
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </aside>
        </main>
      )}
    </div>
  );
}
