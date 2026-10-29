"use client";
import { parseApiError } from "@/lib/api-client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Header } from "@/components/layout-shell";
import {
  ToolLayout,
  EmptyState,
  FileDropZone,
  PdfPagePreview,
  ProgressCard,
  ResultCard,
  ErrorAlert,
} from "@/components/shared";
import { toast } from "sonner";
import { ChevronRight, ArrowRight, RefreshCcw, Crop } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function CropPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<"auto" | "manual">("auto");
  const [top, setTop] = useState(20);
  const [bottom, setBottom] = useState(20);
  const [left, setLeft] = useState(20);
  const [right, setRight] = useState(20);
  const [outputBaseName, setOutputBaseName] = useState("cropped");

  const [status, setStatus] = useState<"idle" | "processing" | "completed" | "failed">("idle");
  const [jobId, setJobId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resultData, setResultData] = useState<{
    downloadUrl: string;
    resultSize: number;
    filename: string;
  } | null>(null);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleFile = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setErrorMessage(null);
      const nameWithoutExt = files[0].name.replace(/\.[^/.]+$/, "");
      setOutputBaseName(`${nameWithoutExt}-cropped`);
    }
  };

  const handleReset = () => {
    setFile(null);
    setStatus("idle");
    setJobId(null);
    setErrorMessage(null);
    setResultData(null);
    setMode("auto");
    setTop(20);
    setBottom(20);
    setLeft(20);
    setRight(20);
    setOutputBaseName("cropped");
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
            toast.success("PDF cropped successfully");
          } else if (data.status === "failed") {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            setStatus("failed");
            setErrorMessage(data.error_message || "Failed to crop PDF margins");
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
          tool: "crop-pdf",
          files: [
            {
              url: fileUrl,
              name: file.name,
              size: file.size,
            },
          ],
          options: {
            mode,
            top: mode === "manual" ? top : 0,
            bottom: mode === "manual" ? bottom : 0,
            left: mode === "manual" ? left : 0,
            right: mode === "manual" ? right : 0,
            applyTo: "all",
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
        <EmptyState
          title="Crop PDF"
          description="Crop margins and trim PDF pages to your exact custom dimension."
          accept="application/pdf"
          maxFiles={1}
          maxSizeMB={100}
          formatName="PDF"
          onFiles={handleFile}
          disabled={status === "processing"}
        />
      ) : (
        <ToolLayout
          onReset={handleReset}
          options={
            <>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-foreground">
                  <Crop className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-foreground">Crop Margins</h2>
                  <p className="text-xs font-medium text-muted-foreground">Auto-detect or manual trim</p>
                </div>
              </div>

              {/* Crop Mode Selection */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMode("auto")}
                  className={`py-2 px-3 rounded-2xl border text-xs font-semibold transition-all cursor-pointer ${
                    mode === "auto"
                      ? "bg-secondary border-foreground/30 text-foreground"
                      : "bg-background border-border text-muted-foreground hover:border-foreground/20"
                  }`}
                >
                  Auto-crop
                </button>
                <button
                  type="button"
                  onClick={() => setMode("manual")}
                  className={`py-2 px-3 rounded-2xl border text-xs font-semibold transition-all cursor-pointer ${
                    mode === "manual"
                      ? "bg-secondary border-foreground/30 text-foreground"
                      : "bg-background border-border text-muted-foreground hover:border-foreground/20"
                  }`}
                >
                  Manual Trim
                </button>
              </div>

              {mode === "auto" ? (
                <div className="p-4 rounded-2xl bg-secondary/50 border border-border text-xs font-medium text-muted-foreground leading-relaxed">
                  Automatically detects the content bounding box on all pages and trims away unnecessary whitespace.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/80">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="crop-top" className="text-xs font-semibold text-foreground">
                      Top Margin (pt)
                    </label>
                    <input
                      id="crop-top"
                      type="number"
                      min={0}
                      value={top}
                      onChange={(e) => setTop(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full h-11 px-3 rounded-2xl border border-border bg-background text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="crop-bottom" className="text-xs font-semibold text-foreground">
                      Bottom Margin (pt)
                    </label>
                    <input
                      id="crop-bottom"
                      type="number"
                      min={0}
                      value={bottom}
                      onChange={(e) => setBottom(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full h-11 px-3 rounded-2xl border border-border bg-background text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="crop-left" className="text-xs font-semibold text-foreground">
                      Left Margin (pt)
                    </label>
                    <input
                      id="crop-left"
                      type="number"
                      min={0}
                      value={left}
                      onChange={(e) => setLeft(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full h-11 px-3 rounded-2xl border border-border bg-background text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="crop-right" className="text-xs font-semibold text-foreground">
                      Right Margin (pt)
                    </label>
                    <input
                      id="crop-right"
                      type="number"
                      min={0}
                      value={right}
                      onChange={(e) => setRight(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full h-11 px-3 rounded-2xl border border-border bg-background text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                </div>
              )}

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
                <ProgressCard progress={-1} label="Cropping PDF margins…" />
              )}

              {status === "completed" && resultData && (
                <ResultCard
                  filename={resultData.filename}
                  sizeBytes={resultData.resultSize}
                  downloadUrl={resultData.downloadUrl}
                  onReset={handleReset}
                />
              )}
            </>
          }
          actionButton={
            status !== "completed" ? (
              <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={status === "processing"}
                  className="w-full h-14 rounded-full bg-primary text-primary-foreground text-base font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer"
                >
                  <span>{status === "processing" ? "Cropping…" : "Crop PDF"}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
            ) : null
          }
        >
          

            <div className="w-full max-w-sm flex items-center justify-center">
              <PdfPagePreview
                file={file}
                index={0}
                onRemove={handleReset}
              />
            </div>
        </ToolLayout>
      )}
    </div>
  );
}
