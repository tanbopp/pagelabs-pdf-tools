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
import { ChevronRight, ArrowRight, RefreshCcw, GitCompare, FileText } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function ComparePdfPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [outputBaseName, setOutputBaseName] = useState("comparison");

  const [status, setStatus] = useState<"idle" | "processing" | "completed" | "failed">("idle");
  const [jobId, setJobId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resultData, setResultData] = useState<{
    downloadUrl: string;
    resultSize: number;
    filename: string;
  } | null>(null);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleFiles = (newFiles: File[]) => {
    setFiles((prev) => {
      const merged = [...prev, ...newFiles].slice(0, 2);
      return merged;
    });
    setErrorMessage(null);
  };

  const handleReset = () => {
    setFiles([]);
    setStatus("idle");
    setJobId(null);
    setErrorMessage(null);
    setResultData(null);
    setOutputBaseName("comparison");
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
            toast.success("Comparison completed successfully");
          } else if (data.status === "failed") {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            setStatus("failed");
            setErrorMessage(data.error_message || "Failed to compare PDFs");
          }
        } catch {}
      }, 1000);
    }
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [status, jobId, outputBaseName]);

  const handleSubmit = async () => {
    if (files.length < 2) {
      toast.error("Please upload 2 PDF documents to compare");
      return;
    }

    setStatus("processing");
    setErrorMessage(null);

    try {
      const uploadedFiles = [];

      for (const f of files) {
        const signRes = await fetch(`${API_BASE}/api/v1/uploads/sign`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: f.name,
            size: f.size,
            contentType: "application/pdf",
          }),
        });
        if (!signRes.ok) throw new Error(`Failed to upload ${f.name}`);
        const { uploadUrl, fileUrl } = await signRes.json();

        const uploadRes = await fetch(uploadUrl, {
          method: "PUT",
          body: f,
          headers: { "Content-Type": "application/pdf" },
        });
        if (!uploadRes.ok) throw new Error(`Upload failed for ${f.name}`);

        uploadedFiles.push({
          url: fileUrl,
          name: f.name,
          size: f.size,
        });
      }

      const jobRes = await fetch(`${API_BASE}/api/v1/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "compare-pdf",
          files: uploadedFiles,
          options: {
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

      {files.length === 0 ? (
        <EmptyState
          title="Compare PDF"
          description="Show a side-by-side comparison to find differences between two PDFs."
          accept="application/pdf"
          maxFiles={2}
          maxSizeMB={100}
          formatName="PDF"
          onFiles={handleFiles}
          disabled={status === "processing"}
        />
      ) : (
        <ToolLayout
          onReset={handleReset}
          options={
            <>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-foreground">
                  <GitCompare className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-foreground">Compare Differences</h2>
                  <p className="text-xs font-medium text-muted-foreground">Pixel & text diff analysis</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-secondary/50 border border-border text-xs font-medium text-muted-foreground leading-relaxed">
                PageLabs visually compares both documents page-by-page and highlights additions or modifications in red/green overlays.
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
                <ProgressCard progress={-1} label="Comparing documents…" />
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
                  disabled={status === "processing" || files.length < 2}
                  className="w-full h-14 rounded-full bg-primary text-primary-foreground text-base font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer"
                >
                  <span>{status === "processing" ? "Comparing…" : "Compare PDFs"}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
            ) : null
          }
        >
          

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {files.map((f, idx) => (
                <div key={idx} className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-muted-foreground">
                    Document {idx + 1}: {idx === 0 ? "Original" : "Modified"}
                  </span>
                  <div className="rounded-3xl border border-border bg-card p-6 flex flex-col items-center justify-center gap-3 aspect-[1/1.2]">
                    <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center text-foreground">
                      <FileText className="w-7 h-7" />
                    </div>
                    <div className="text-center w-full px-2">
                      <p className="text-sm font-bold text-foreground truncate">{f.name}</p>
                      <p className="text-xs font-medium text-muted-foreground mt-0.5">{(f.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                </div>
              ))}

              {files.length === 1 && (
                <label className="border-2 border-dashed border-border hover:border-foreground/40 rounded-3xl p-6 flex flex-col items-center justify-center text-center cursor-pointer aspect-[1/1.2] transition-colors group">
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-muted-foreground group-hover:text-foreground mb-2">
                    <span className="text-2xl font-bold">+</span>
                  </div>
                  <span className="text-xs font-bold text-foreground">Add Second Document</span>
                  <span className="text-[11px] text-muted-foreground mt-0.5">PDF to compare against</span>
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) {
                        handleFiles(Array.from(e.target.files));
                      }
                    }}
                  />
                </label>
              )}
            </div>
        </ToolLayout>
      )}
    </div>
  );
}
