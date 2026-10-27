"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Header } from "@/components/layout-shell";
import {
  FileDropZone,
  ProgressCard,
  ResultCard,
  ErrorAlert,
} from "@/components/shared";
import { toast } from "sonner";
import { getAllPdfPagesPreviews } from "@/lib/pdf-all-pages";
import {
  ChevronRight,
  ArrowRight,
  RefreshCcw,
  Trash2,
  Undo2,
  Loader2,
  FileText,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface PageThumbnailItem {
  pageNumber: number; // 1-based index
  thumbnail: string;
}

export default function RemovePagesPage() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageThumbnailItem[]>([]);
  const [removedPages, setRemovedPages] = useState<Set<number>>(new Set());
  const [loadingPages, setLoadingPages] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState({ current: 0, total: 0 });
  const [outputBaseName, setOutputBaseName] = useState("removed");

  const [status, setStatus] = useState<"idle" | "processing" | "completed" | "failed">("idle");
  const [jobId, setJobId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resultData, setResultData] = useState<{
    downloadUrl: string;
    resultSize: number;
    filename: string;
  } | null>(null);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleFile = async (files: File[]) => {
    if (files.length === 0) return;
    const selectedFile = files[0];
    setFile(selectedFile);
    setErrorMessage(null);
    setRemovedPages(new Set());
    setLoadingPages(true);

    try {
      const thumbnails = await getAllPdfPagesPreviews(selectedFile, (curr, total) => {
        setLoadingProgress({ current: curr, total });
      });

      const initialPages: PageThumbnailItem[] = thumbnails.map((thumb, idx) => ({
        pageNumber: idx + 1,
        thumbnail: thumb,
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
    setRemovedPages(new Set());
    setStatus("idle");
    setJobId(null);
    setErrorMessage(null);
    setResultData(null);
    setOutputBaseName("removed");
  };

  const togglePageRemove = (pageNumber: number) => {
    if (status === "processing") return;
    setRemovedPages((prev) => {
      const next = new Set(prev);
      if (next.has(pageNumber)) {
        next.delete(pageNumber);
      } else {
        if (next.size + 1 >= pages.length) {
          toast.error("Cannot remove all pages");
          return prev;
        }
        next.add(pageNumber);
      }
      return next;
    });
  };

  // Convert Set of removed page numbers into formatted string (e.g. "1, 3, 5")
  const pagesToRemoveString = Array.from(removedPages)
    .sort((a, b) => a - b)
    .join(", ");

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
            toast.success("Pages removed successfully");
          } else if (data.status === "failed") {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            setStatus("failed");
            setErrorMessage(data.error_message || "Failed to remove pages");
          }
        } catch {}
      }, 1000);
    }
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [status, jobId, outputBaseName]);

  const handleSubmit = async () => {
    if (!file || removedPages.size === 0) return;
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

      const jobRes = await fetch(`${API_BASE}/api/v1/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "remove-pages",
          files: [{ url: fileUrl, name: file.name, size: file.size }],
          options: {
            pages: pagesToRemoveString,
            outputFilename: `${outputBaseName}.pdf`,
          },
        }),
      });

      if (!jobRes.ok) {
        const err = await jobRes.json();
        throw new Error(err.error_message || "Failed to create remove-pages job");
      }

      const { jobId: newId } = await jobRes.json();
      setJobId(newId);
    } catch (err: unknown) {
      setStatus("failed");
      setErrorMessage(err instanceof Error ? err.message : "Failed to remove pages");
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
            <span className="text-foreground">Remove Pages</span>
          </nav>

          <div className="mb-12">
            <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Remove Pages</h1>
            <p className="text-base font-medium text-muted-foreground">Select pages to visually delete from PDF.</p>
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
          <div className="text-base font-semibold">Extracting pages preview…</div>
          <div className="text-xs font-semibold text-muted-foreground">
            Rendered {loadingProgress.current} of {loadingProgress.total} pages
          </div>
        </main>
      ) : (
        <main className="flex-1 w-full max-w-[1600px] mx-auto px-6 lg:px-10 py-8 flex flex-col lg:flex-row gap-10 items-start">
          {/* Left Canvas: Visual Grid of Pages */}
          <section className="flex-1 w-full flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
                <Link href="/" className="hover:text-foreground transition-colors">Tools</Link>
                <ChevronRight className="h-4 w-4" />
                <span className="text-foreground">Remove Pages</span>
              </nav>

              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-muted-foreground">
                  {removedPages.size} of {pages.length} pages selected for removal
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

            {/* Visual Page Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
              {pages.map((item) => {
                const isMarked = removedPages.has(item.pageNumber);
                return (
                  <div
                    key={item.pageNumber}
                    role="button"
                    tabIndex={0}
                    onClick={() => togglePageRemove(item.pageNumber)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        togglePageRemove(item.pageNumber);
                      }
                    }}
                    className={cn(
                      "group relative flex flex-col rounded-2xl border p-3 bg-card transition-all duration-150 cursor-pointer select-none",
                      isMarked
                        ? "border-foreground/80 opacity-60 bg-secondary/60"
                        : "border-border hover:border-foreground/50"
                    )}
                  >
                    {/* Top indicator: Delete/Undo button */}
                    <div className="absolute top-2.5 right-2.5 z-20">
                      <div
                        className={cn(
                          "h-7 w-7 rounded-full border flex items-center justify-center transition-colors",
                          isMarked
                            ? "bg-foreground text-background border-foreground"
                            : "bg-secondary border-border text-muted-foreground group-hover:text-foreground"
                        )}
                      >
                        {isMarked ? (
                          <Undo2 className="h-3.5 w-3.5" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </div>
                    </div>

                    {/* Page Thumbnail Canvas */}
                    <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden border border-border/40 bg-muted/20 flex items-center justify-center">
                      {item.thumbnail ? (
                        <img
                          src={item.thumbnail}
                          alt={`Page ${item.pageNumber}`}
                          className={cn(
                            "w-full h-full object-contain pointer-events-none p-1 transition-opacity",
                            isMarked && "grayscale opacity-40"
                          )}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-secondary text-muted-foreground p-4 text-center">
                          <FileText className="h-8 w-8 text-foreground/50" />
                          <span className="text-xs font-semibold">Page {item.pageNumber}</span>
                        </div>
                      )}

                      {/* Strikethrough overlay when marked for removal */}
                      {isMarked && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/50 backdrop-blur-[1px] gap-1 text-foreground font-bold">
                          <Trash2 className="h-6 w-6" />
                          <span className="text-xs tracking-wider uppercase">Removed</span>
                        </div>
                      )}
                    </div>

                    {/* Bottom label */}
                    <div className="pt-2.5 pb-0.5 px-1 flex items-center justify-between text-xs font-semibold">
                      <span className={cn(
                        "h-5 px-2 rounded-full text-[11px] font-bold flex items-center justify-center",
                        isMarked ? "bg-foreground text-background line-through" : "bg-secondary text-foreground"
                      )}>
                        Page {item.pageNumber}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {isMarked ? "Click to keep" : "Click to remove"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Right Panel: Controls & Action */}
          <aside className="w-full lg:w-[380px] shrink-0 sticky top-6 flex flex-col gap-6">
            <div className="rounded-3xl border border-border bg-card p-6 flex flex-col gap-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground mb-1">Remove Pages</h2>
                <p className="text-xs font-medium text-muted-foreground">
                  Click on any page in the grid to mark or unmark it for removal.
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-secondary/50 p-3.5 flex items-start gap-2.5 text-muted-foreground">
                <Info className="h-4 w-4 shrink-0 text-foreground mt-0.5" />
                <p className="text-xs font-semibold leading-relaxed">
                  Pages marked with &quot;Removed&quot; will be deleted. At least one page must remain.
                </p>
              </div>

              {/* Summary of marked pages */}
              <div className="flex flex-col gap-2 pt-2 border-t border-border/80">
                <label className="text-xs font-semibold text-foreground">
                  Pages to be removed
                </label>
                <div className="min-h-11 px-4 py-2.5 rounded-2xl border border-border bg-background text-xs font-semibold text-foreground flex items-center">
                  {removedPages.size > 0 ? (
                    <span className="truncate">{pagesToRemoveString}</span>
                  ) : (
                    <span className="text-muted-foreground italic">No pages marked yet</span>
                  )}
                </div>
              </div>

              {/* Output Filename */}
              <div className="flex flex-col gap-2">
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
                <ProgressCard progress={-1} label="Removing selected pages…" />
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
                  disabled={status === "processing" || removedPages.size === 0}
                  className="w-full h-14 rounded-full bg-primary text-primary-foreground text-base font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer"
                >
                  <span>
                    {status === "processing"
                      ? "Removing…"
                      : `Remove ${removedPages.size} Page${removedPages.size > 1 ? "s" : ""}`}
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
