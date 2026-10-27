"use client";

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
import { ChevronRight, ArrowRight, RefreshCcw, Info, Loader2 } from "lucide-react";
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

export default function OrganizePdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<OrganizePageItemData[]>([]);
  const [loadingPages, setLoadingPages] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState({ current: 0, total: 0 });
  const [activeItem, setActiveItem] = useState<OrganizePageItemData | null>(null);
  const [outputBaseName, setOutputBaseName] = useState("organized");

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

      const initialPages: OrganizePageItemData[] = thumbnails.map((thumb, idx) => ({
        id: `page-${idx}-${Date.now()}`,
        originalIndex: idx,
        rotation: 0,
        thumbnail: thumb,
      }));

      setPages(initialPages);
    } catch (err) {
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
    setOutputBaseName("organized");
  };

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
        } catch {}
      }, 1000);
    }
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [status, jobId, outputBaseName]);

  const handleSubmit = async () => {
    if (!file || pages.length === 0) return;
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

      const pagesPayload = pages.map((p) => ({
        originalIndex: p.originalIndex,
        rotation: p.rotation,
      }));

      const jobRes = await fetch(`${API_BASE}/api/v1/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "organize-pdf",
          files: [{ url: fileUrl, name: file.name, size: file.size }],
          options: {
            pages: pagesPayload,
            outputFilename: `${outputBaseName}.pdf`,
          },
        }),
      });

      if (!jobRes.ok) {
        const err = await jobRes.json();
        throw new Error(err.error_message || "Failed to create organize job");
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

      {!file ? (
        <main className="flex-1 w-full max-w-[1600px] mx-auto px-6 lg:px-10 py-12 flex flex-col">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground mb-8">
            <Link href="/" className="hover:text-foreground transition-colors">Tools</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground">Organize PDF</span>
          </nav>

          <div className="mb-12">
            <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Organize PDF</h1>
            <p className="text-base font-medium text-muted-foreground">Reorder, rotate, or delete pages.</p>
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
          <div className="text-base font-semibold">Loading PDF pages…</div>
          <div className="text-xs font-semibold text-muted-foreground">
            Processed {loadingProgress.current} of {loadingProgress.total} pages
          </div>
        </main>
      ) : (
        <main className="flex-1 w-full max-w-[1600px] mx-auto px-6 lg:px-10 py-8 flex flex-col lg:flex-row gap-10 items-start">
          {/* Left Canvas: Reorder Pages Grid */}
          <section className="flex-1 w-full flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
                <Link href="/" className="hover:text-foreground transition-colors">Tools</Link>
                <ChevronRight className="h-4 w-4" />
                <span className="text-foreground">Organize PDF</span>
              </nav>

              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-muted-foreground">
                  {pages.length} pages
                </span>
                <button
                  type="button"
                  onClick={handleReset}
                  className="h-9 px-4 rounded-full border border-border bg-card hover:bg-secondary text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
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
                    <OrganizePageCard
                      key={item.id}
                      item={item}
                      index={index}
                      onRotate={() => handleRotatePage(item.id)}
                      onRemove={() => handleRemovePage(item.id)}
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
                    <OrganizePageCard
                      item={activeItem}
                      index={pages.findIndex((p) => p.id === activeItem.id)}
                      onRotate={() => {}}
                      onRemove={() => {}}
                    />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </section>

          {/* Right Panel */}
          <aside className="w-full lg:w-[380px] shrink-0 sticky top-6 flex flex-col gap-6">
            <div className="rounded-3xl border border-border bg-card p-6 flex flex-col gap-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground mb-1">Organize PDF</h2>
                <p className="text-xs font-medium text-muted-foreground">Drag pages to reorder. Hover to rotate or delete.</p>
              </div>

              <div className="rounded-2xl border border-border bg-secondary/50 p-3.5 flex items-start gap-2.5 text-muted-foreground">
                <Info className="h-4 w-4 shrink-0 text-foreground mt-0.5" />
                <p className="text-xs font-semibold leading-relaxed">
                  Drag any card to arrange. Hover over a page card to rotate 90° or remove it.
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-2 border-t border-border/80">
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
                <ProgressCard progress={-1} label="Organizing your PDF…" />
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
                  disabled={status === "processing" || pages.length === 0}
                  className="w-full h-14 rounded-full bg-primary text-primary-foreground text-base font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer"
                >
                  <span>{status === "processing" ? "Organizing…" : "Organize PDF"}</span>
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
