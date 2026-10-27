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
import { ChevronRight, ArrowRight, RefreshCcw, Image as ImageIcon, Trash2 } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function ScanToPdfPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [autoDeskew, setAutoDeskew] = useState(false);
  const [outputBaseName, setOutputBaseName] = useState("scanned");

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
    if (newFiles.length > 0) {
      setFiles((prev) => [...prev, ...newFiles]);
      setErrorMessage(null);
      if (files.length === 0) {
        const nameWithoutExt = newFiles[0].name.replace(/\.[^/.]+$/, "");
        setOutputBaseName(`${nameWithoutExt}-scanned`);
      }
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleReset = () => {
    setFiles([]);
    setStatus("idle");
    setJobId(null);
    setErrorMessage(null);
    setResultData(null);
    setAutoDeskew(false);
    setOutputBaseName("scanned");
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
            toast.success("Photos converted to PDF successfully");
          } else if (data.status === "failed") {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            setStatus("failed");
            setErrorMessage(data.error_message || "Failed to convert scanned photos to PDF");
          }
        } catch {}
      }, 1000);
    }
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [status, jobId, outputBaseName]);

  const handleSubmit = async () => {
    if (files.length === 0) {
      toast.error("Please add at least one scanned photo");
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
            contentType: f.type || "image/jpeg",
          }),
        });
        if (!signRes.ok) throw new Error(`Failed to upload ${f.name}`);
        const { uploadUrl, fileUrl } = await signRes.json();

        const uploadRes = await fetch(uploadUrl, {
          method: "PUT",
          body: f,
          headers: { "Content-Type": f.type || "image/jpeg" },
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
          tool: "scan-to-pdf",
          files: uploadedFiles,
          options: {
            autoDeskew,
            outputFilename: `${outputBaseName}.pdf`,
          },
        }),
      });

      if (!jobRes.ok) {
        const errorJson = await jobRes.json();
        throw new Error(errorJson.error_message || errorJson.message || "Failed to create conversion job");
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
        <main className="flex-1 w-full max-w-[1600px] mx-auto px-6 lg:px-10 py-12 flex flex-col">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground mb-8">
            <Link href="/" className="hover:text-foreground transition-colors">Tools</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground">Scan to PDF</span>
          </nav>

          <div className="mb-12">
            <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Scan to PDF</h1>
            <p className="text-base font-medium text-muted-foreground">Convert paper document photos and scans into a clean PDF.</p>
          </div>

          <FileDropZone
            accept=".jpg,.jpeg,.png,image/jpeg,image/png"
            maxFiles={30}
            maxSizeMB={100}
            onFiles={handleFiles}
            disabled={status === "processing"}
            title="Drop scanned photos here"
            subtitle="or click to browse multiple photos"
            formatName="JPG, PNG"
          />
        </main>
      ) : (
        <main className="flex-1 w-full max-w-[1600px] mx-auto px-6 lg:px-10 py-8 flex flex-col lg:flex-row items-start gap-8">
          <section className="flex-1 w-full min-w-0">
            <div className="flex items-center justify-between mb-6">
              <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
                <Link href="/" className="hover:text-foreground transition-colors">Tools</Link>
                <ChevronRight className="h-4 w-4" />
                <span className="text-foreground">Scan to PDF</span>
              </nav>

              <button
                type="button"
                onClick={handleReset}
                className="h-9 px-4 rounded-full border border-border bg-card hover:bg-secondary text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCcw className="h-3.5 w-3.5" />
                <span>Reset all</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {files.map((f, idx) => (
                <div
                  key={idx}
                  className="relative group rounded-3xl border border-border bg-card p-4 flex flex-col items-center justify-center aspect-square text-center"
                >
                  <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-foreground mb-2">
                    <ImageIcon className="w-6 h-6 text-foreground/80" />
                  </div>
                  <span className="text-xs font-bold text-foreground truncate w-full px-1">
                    {f.name}
                  </span>
                  <span className="text-[11px] font-medium text-muted-foreground mt-0.5">
                    {(f.size / 1024).toFixed(0)} KB
                  </span>

                  <button
                    onClick={() => handleRemoveFile(idx)}
                    className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              <label className="border-2 border-dashed border-border hover:border-foreground/40 rounded-3xl p-4 flex flex-col items-center justify-center aspect-square text-center cursor-pointer transition-colors group">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground group-hover:text-foreground mb-1.5">
                  <span className="text-xl font-bold">+</span>
                </div>
                <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground">
                  Add more
                </span>
                <input
                  type="file"
                  multiple
                  accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) {
                      handleFiles(Array.from(e.target.files));
                    }
                  }}
                />
              </label>
            </div>
          </section>

          <aside className="w-full lg:w-[380px] shrink-0 sticky top-6 flex flex-col gap-6">
            <div className="rounded-3xl border border-border bg-card p-6 flex flex-col gap-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground mb-1">Scan Options</h2>
                <p className="text-xs font-medium text-muted-foreground">Adjust deskew enhancement.</p>
              </div>

              {/* Auto Deskew Toggle */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-secondary/40 border border-border">
                <div>
                  <span className="text-xs font-bold text-foreground block">Auto-deskew</span>
                  <span className="text-[11px] text-muted-foreground">Straighten tilted photo angles</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoDeskew(!autoDeskew)}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    autoDeskew ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                      autoDeskew ? "translate-x-7" : "translate-x-1"
                    }`}
                  />
                </button>
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
                <ProgressCard progress={-1} label="Converting Scanned Photos to PDF…" />
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
                  disabled={status === "processing" || files.length === 0}
                  className="w-full h-14 rounded-full bg-primary text-primary-foreground text-base font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer"
                >
                  <span>{status === "processing" ? "Converting…" : "Convert to PDF"}</span>
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
