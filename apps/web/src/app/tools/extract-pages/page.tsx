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
import * as SwitchPrimitives from "@radix-ui/react-switch";
import { ChevronRight, ArrowRight, RefreshCcw } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function ExtractPagesPage() {
  const [file, setFile] = useState<File | null>(null);
  const [pagesStr, setPagesStr] = useState("1");
  const [pagesError, setPagesError] = useState<string | null>(null);
  const [separateFiles, setSeparateFiles] = useState(false);
  const [outputBaseName, setOutputBaseName] = useState("extracted");

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
    }
  };

  const validateRange = (val: string) => {
    setPagesStr(val);
    const cleaned = val.trim();
    if (!cleaned) {
      setPagesError("Please specify at least one page");
      return;
    }
    // Pattern: comma-separated list of numbers or ranges like 1-3, 5
    const isValid = /^(\s*\d+\s*(-\s*\d+\s*)?,?\s*)+$/.test(cleaned);
    if (!isValid) {
      setPagesError("Use format: 1-3, 5");
    } else {
      setPagesError(null);
    }
  };

  const handleReset = () => {
    setFile(null);
    setStatus("idle");
    setJobId(null);
    setErrorMessage(null);
    setResultData(null);
    setOutputBaseName("extracted");
    setPagesStr("1");
    setSeparateFiles(false);
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
            const ext = separateFiles ? ".zip" : ".pdf";
            setResultData({
              downloadUrl: `${API_BASE}${data.result_url}`,
              resultSize: data.result_size || 0,
              filename: `${outputBaseName}${ext}`,
            });
            toast.success("Pages extracted successfully");
          } else if (data.status === "failed") {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            setStatus("failed");
            setErrorMessage(data.error_message || "Failed to extract pages");
          }
        } catch {}
      }, 1000);
    }
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [status, jobId, outputBaseName, separateFiles]);

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

      const ext = separateFiles ? ".zip" : ".pdf";
      const jobRes = await fetch(`${API_BASE}/api/v1/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "extract-pages",
          files: [{ url: fileUrl, name: file.name, size: file.size }],
          options: {
            pages: pagesStr,
            separateFiles,
            outputFilename: `${outputBaseName}${ext}`,
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
      setErrorMessage(err instanceof Error ? err.message : "Failed to extract pages");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />

      {!file ? (
        <EmptyState
          title="Extract Pages"
          description="Extract selected pages from your PDF file into a new document."
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
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground">Extract Pages</h2>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="pages-extract" className="text-xs font-semibold text-foreground">
                    Pages to extract (e.g. 1-3, 5)
                  </label>
                  <button
                    type="button"
                    onClick={() => validateRange("1-999")}
                    className="text-[11px] font-bold text-muted-foreground hover:text-foreground transition-colors"
                  >
                    All pages
                  </button>
                </div>
                <input
                  id="pages-extract"
                  type="text"
                  value={pagesStr}
                  onChange={(e) => validateRange(e.target.value)}
                  placeholder="1-3, 5"
                  className={`h-11 px-4 rounded-2xl border bg-background text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-ring ${
                    pagesError ? "border-foreground ring-1 ring-foreground" : "border-border"
                  }`}
                />
                {pagesError && (
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    {pagesError}
                  </span>
                )}
              </div>

              {/* Toggle extract each page as separate file */}
              <div className="flex items-center justify-between py-1 border-t border-border/80">
                <label
                  htmlFor="separate-files"
                  className="text-xs font-semibold text-foreground cursor-pointer"
                >
                  Extract each page as separate file (ZIP)
                </label>
                <SwitchPrimitives.Root
                  id="separate-files"
                  checked={separateFiles}
                  onCheckedChange={setSeparateFiles}
                  disabled={status === "processing"}
                  className="w-11 h-6 rounded-full border border-border bg-secondary data-[state=checked]:bg-foreground transition-colors relative focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <SwitchPrimitives.Thumb className="block w-5 h-5 rounded-full bg-background data-[state=checked]:translate-x-5 transition-transform" />
                </SwitchPrimitives.Root>
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
                    onChange={(e) => setOutputBaseName(e.target.value.replace(/\.(pdf|zip)$/i, ""))}
                    className="w-full h-11 pl-4 pr-14 rounded-2xl border border-border bg-background text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  <span className="absolute right-3 px-2 py-0.5 rounded-lg bg-secondary text-[11px] font-bold text-muted-foreground select-none pointer-events-none">
                    {separateFiles ? ".zip" : ".pdf"}
                  </span>
                </div>
              </div>

              {status === "failed" && errorMessage && (
                <ErrorAlert message={errorMessage} onRetry={handleSubmit} />
              )}

              {status === "processing" && (
                <ProgressCard progress={-1} label="Extracting pages…" />
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
                  disabled={status === "processing" || !pagesStr.trim() || !!pagesError}
                  className="w-full h-14 rounded-full bg-primary text-primary-foreground text-base font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer"
                >
                  <span>
                    {status === "processing"
                      ? "Extracting…"
                      : pagesStr.trim()
                      ? `Extract Pages (${pagesStr.trim()})`
                      : "Extract Pages"}
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </button>
            ) : null
          }
        >
          <div className="flex items-center justify-between">

              <button
                type="button"
                onClick={handleReset}
                className="h-9 px-4 rounded-full border border-border bg-card hover:bg-secondary text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCcw className="h-3.5 w-3.5" />
                <span>Change file</span>
              </button>
            </div>

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
