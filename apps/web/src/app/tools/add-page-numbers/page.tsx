"use client";
import { parseApiError } from "@/lib/api-client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Header } from "@/components/layout-shell";
import {
  FileDropZone,
  PdfPagePreview,
  ProgressCard,
  ResultCard,
  ErrorAlert,
  CustomSelect,
} from "@/components/shared";
import { toast } from "sonner";
import { ChevronRight, ArrowRight, RefreshCcw, Hash, FileText } from "lucide-react";
import { getPdfFirstPagePreview } from "@/lib/pdf-preview";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function AddPageNumbersPage() {
  const [file, setFile] = useState<File | null>(null);
  const [position, setPosition] = useState<
    "bottom-center" | "bottom-right" | "bottom-left" | "top-center" | "top-right" | "top-left"
  >("bottom-center");
  const [startNumber, setStartNumber] = useState(1);
  const [format, setFormat] = useState<"1" | "Page 1" | "1 / N">("Page 1");
  const [outputBaseName, setOutputBaseName] = useState("numbered");

  const [status, setStatus] = useState<"idle" | "processing" | "completed" | "failed">("idle");
  const [jobId, setJobId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resultData, setResultData] = useState<{
    downloadUrl: string;
    resultSize: number;
    filename: string;
  } | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleFile = (files: File[]) => {
    if (files.length > 0) {
      const selected = files[0];
      setFile(selected);
      setErrorMessage(null);
      const nameWithoutExt = selected.name.replace(/\.[^/.]+$/, "");
      setOutputBaseName(`${nameWithoutExt}-numbered`);
      setLoadingPreview(true);
      getPdfFirstPagePreview(selected, 500)
        .then((url) => {
          setPreviewUrl(url);
          setLoadingPreview(false);
        })
        .catch(() => setLoadingPreview(false));
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreviewUrl(null);
    setStatus("idle");
    setJobId(null);
    setErrorMessage(null);
    setResultData(null);
    setPosition("bottom-center");
    setStartNumber(1);
    setFormat("Page 1");
    setOutputBaseName("numbered");
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
            toast.success("Page numbers added successfully");
          } else if (data.status === "failed") {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            setStatus("failed");
            setErrorMessage(data.error_message || "Failed to add page numbers");
          }
        } catch {}
      }, 1000);
    }
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [status, jobId, outputBaseName]);

  const handleSubmit = async () => {
    if (!file) return;

    setStatus("processing");
    setErrorMessage(null);

    try {
      const signRes = await fetch(`${API_BASE}/api/v1/uploads/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          size: file.size,
          contentType: "application/pdf",
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
        const uploadErrText = await uploadRes.text().catch(() => "");
        throw new Error(`Upload failed (${uploadRes.status}): ${uploadErrText || uploadRes.statusText}`);
      }

      const jobRes = await fetch(`${API_BASE}/api/v1/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "add-page-numbers",
          files: [
            {
              url: fileUrl,
              name: file.name,
              size: file.size,
            },
          ],
          options: {
            position,
            startNumber,
            format,
            outputFilename: `${outputBaseName}.pdf`,
          },
        }),
      });

      if (!jobRes.ok) {
        const errMsg = await parseApiError(jobRes, "Failed to process job");
        throw new Error(errMsg);
      }

      const jobData = await jobRes.json();
      setJobId(jobData.job_id || jobData.jobId);
    } catch (err: unknown) {
      setStatus("failed");
      setErrorMessage(err instanceof Error ? err.message : "An unexpected error occurred");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans">
      <Header />

      {!file ? (
        <main className="flex-1 w-full max-w-[1600px] mx-auto px-6 lg:px-10 py-12 flex flex-col">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground mb-8">
            <Link href="/" className="hover:text-foreground transition-colors">Tools</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground">Page Numbers</span>
          </nav>

          <div className="mb-12">
            <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Add Page Numbers</h1>
            <p className="text-base font-medium text-muted-foreground">Add customized page numbering into your PDF documents.</p>
          </div>

          <FileDropZone
            accept="application/pdf"
            maxFiles={1}
            maxSizeMB={100}
            onFiles={handleFile}
            disabled={status === "processing"}
          />
        </main>
      ) : (
        <main className="flex-1 w-full max-w-[1600px] mx-auto px-6 lg:px-10 py-8 flex flex-col lg:flex-row items-start gap-8">
          <section className="flex-1 w-full min-w-0">
            <div className="flex items-center justify-between mb-6">
              <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
                <Link href="/" className="hover:text-foreground transition-colors">Tools</Link>
                <ChevronRight className="h-4 w-4" />
                <span className="text-foreground">Page Numbers</span>
              </nav>

              <button
                type="button"
                onClick={handleReset}
                className="h-9 px-4 rounded-full border border-border bg-card hover:bg-secondary text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCcw className="h-3.5 w-3.5" />
                <span>Change file</span>
              </button>
            </div>

            <div className="max-w-md w-full flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Interactive Live Preview</span>
                <span className="text-xs font-semibold text-muted-foreground">{file.name}</span>
              </div>

              <div className="relative aspect-[3/4] w-full rounded-2xl border border-border bg-card overflow-hidden flex items-center justify-center p-3 select-none">
                {previewUrl ? (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <img
                      src={previewUrl}
                      alt="PDF Preview"
                      className="w-full h-full object-contain pointer-events-none"
                    />

                    {/* REACIVE NUMBERING OVERLAY */}
                    <div
                      className={`absolute pointer-events-none transition-all duration-200 px-3 py-1 font-sans text-xs font-bold text-foreground bg-background/80 border border-border/80 rounded-md backdrop-blur-xs ${
                        position === "top-left"
                          ? "top-4 left-4"
                          : position === "top-center"
                          ? "top-4 left-1/2 -translate-x-1/2"
                          : position === "top-right"
                          ? "top-4 right-4"
                          : position === "bottom-left"
                          ? "bottom-4 left-4"
                          : position === "bottom-right"
                          ? "bottom-4 right-4"
                          : "bottom-4 left-1/2 -translate-x-1/2"
                      }`}
                    >
                      {format === "Page 1"
                        ? `Page ${startNumber}`
                        : format === "1"
                        ? `${startNumber}`
                        : `${startNumber} / 1`}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <FileText className="w-8 h-8 opacity-40 animate-pulse" />
                    <span className="text-xs font-semibold">Generating live preview…</span>
                  </div>
                )}
              </div>
            </div>
          </section>

          <aside className="w-full lg:w-[380px] shrink-0 sticky top-6 flex flex-col gap-6">
            <div className="rounded-3xl border border-border bg-card p-6 flex flex-col gap-6">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-foreground">
                  <Hash className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-foreground">Numbering Style</h2>
                  <p className="text-xs font-medium text-muted-foreground">Custom page positions</p>
                </div>
              </div>

              {/* Position */}
              <div className="flex flex-col gap-1.5">
                <label id="num-pos-label" className="text-xs font-semibold text-foreground">
                  Position
                </label>
                <CustomSelect
                  id="num-pos"
                  value={position}
                  onChange={(val) => setPosition(val as any)}
                  options={[
                    { value: "bottom-center", label: "Bottom Center" },
                    { value: "bottom-right", label: "Bottom Right" },
                    { value: "bottom-left", label: "Bottom Left" },
                    { value: "top-center", label: "Top Center" },
                    { value: "top-right", label: "Top Right" },
                    { value: "top-left", label: "Top Left" },
                  ]}
                />
              </div>

              {/* Format & Start */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label id="num-fmt-label" className="text-xs font-semibold text-foreground">
                    Format
                  </label>
                  <CustomSelect
                    id="num-fmt"
                    value={format}
                    onChange={(val) => setFormat(val as any)}
                    options={[
                      { value: "Page 1", label: "Page 1" },
                      { value: "1", label: "1" },
                      { value: "1 / N", label: "1 / N" },
                    ]}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="num-start" className="text-xs font-semibold text-foreground">
                    Start From
                  </label>
                  <input
                    id="num-start"
                    type="number"
                    min={1}
                    value={startNumber}
                    onChange={(e) => setStartNumber(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full h-11 px-3 rounded-2xl border border-border bg-background text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              </div>

              {/* Output Filename */}
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
                    className="w-full h-11 pl-4 pr-16 rounded-2xl border border-border bg-background text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
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
                <ProgressCard progress={-1} label="Adding page numbers…" />
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
                  disabled={status === "processing"}
                  className="w-full h-14 rounded-full bg-primary text-primary-foreground text-base font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer"
                >
                  <span>{status === "processing" ? "Adding…" : "Add Page Numbers"}</span>
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
