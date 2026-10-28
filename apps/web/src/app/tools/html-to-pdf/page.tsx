"use client";
import { parseApiError } from "@/lib/api-client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Header } from "@/components/layout-shell";
import {
  FileDropZone,
  ProgressCard,
  ResultCard,
  ErrorAlert,
  CustomSelect,
} from "@/components/shared";
import { toast } from "sonner";
import { ChevronRight, ArrowRight, RefreshCcw, Code } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function HtmlToPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [pageSize, setPageSize] = useState<"a4" | "letter">("a4");
  const [outputBaseName, setOutputBaseName] = useState("webpage-converted");

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
      setOutputBaseName(`${nameWithoutExt}-converted`);
    }
  };

  const handleReset = () => {
    setFile(null);
    setStatus("idle");
    setJobId(null);
    setErrorMessage(null);
    setResultData(null);
    setOutputBaseName("webpage-converted");
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
              downloadUrl: `${API_BASE}/api/v1/download/${data.result_id}`,
              resultSize: data.result_size || 0,
              filename: `${outputBaseName.trim() || "webpage"}.pdf`,
            });
            toast.success("HTML successfully converted to PDF!");
          } else if (data.status === "failed") {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            setStatus("failed");
            setErrorMessage(data.error_message || "Conversion failed. Please try again.");
            toast.error("Conversion failed");
          }
        } catch (err: any) {
          console.error(err);
        }
      }, 1000);
    }

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [status, jobId, outputBaseName]);

  const handleSubmit = async () => {
    if (!file) {
      toast.error("Please upload an HTML document first");
      return;
    }

    setStatus("processing");
    setErrorMessage(null);

    try {
      const uploadRes = await fetch(`${API_BASE}/api/v1/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type || "text/html",
          size: file.size,
        }),
      });

      if (!uploadRes.ok) {
        throw new Error("Failed to obtain upload ticket");
      }

      const { uploadId, uploadUrl } = await uploadRes.json();

      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type || "text/html",
        },
        body: file,
      });

      if (!putRes.ok) {
        throw new Error("Failed to upload HTML file");
      }

      const jobRes = await fetch(`${API_BASE}/api/v1/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "html-to-pdf",
          file_id: uploadId,
          options: {
            pageSize,
          },
        }),
      });

      if (!jobRes.ok) {
        const errMsg = await parseApiError(jobRes, "Failed to process job");
        throw new Error(errMsg);
      }

      const { id } = await jobRes.json();
      setJobId(id);
    } catch (err: any) {
      setStatus("failed");
      setErrorMessage(err.message || "An unexpected error occurred");
      toast.error(err.message || "An error occurred");
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
            <span className="text-foreground">HTML to PDF</span>
          </nav>

          <div className="mb-12">
            <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">HTML to PDF</h1>
            <p className="text-base font-medium text-muted-foreground">Render HTML files with CSS and fonts into high-quality PDF documents.</p>
          </div>

          <FileDropZone
            accept=".html,.htm,text/html"
            maxFiles={1}
            maxSizeMB={50}
            onFiles={handleFile}
            disabled={status === "processing"}
            title="Drop HTML or HTM file here"
            subtitle="or click to browse HTML files"
            formatName="HTML, HTM"
          />
        </main>
      ) : (
        <main className="flex-1 w-full max-w-[1600px] mx-auto px-6 lg:px-10 py-8 flex flex-col lg:flex-row items-start gap-8">
          <section className="flex-1 w-full min-w-0">
            <div className="flex items-center justify-between mb-6">
              <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
                <Link href="/" className="hover:text-foreground transition-colors">Tools</Link>
                <ChevronRight className="h-4 w-4" />
                <span className="text-foreground">HTML to PDF</span>
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

            <div className="max-w-sm rounded-3xl border border-border bg-card p-6 flex flex-col items-center justify-center gap-4 aspect-[1/1.3]">
              <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center text-foreground">
                <Code className="w-8 h-8" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-foreground truncate max-w-[240px]">{file.name}</p>
                <p className="text-xs font-medium text-muted-foreground mt-1">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            </div>
          </section>

          <aside className="w-full lg:w-[380px] shrink-0 sticky top-6 flex flex-col gap-6">
            <div className="rounded-3xl border border-border bg-card p-6 flex flex-col gap-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground mb-1">Render Options</h2>
                <p className="text-xs font-medium text-muted-foreground">Select print format.</p>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-foreground">
                  Page Format
                </label>
                <CustomSelect
                  value={pageSize}
                  onChange={(val) => setPageSize(val as any)}
                  options={[
                    { value: "a4", label: "A4 (Standard)" },
                    { value: "letter", label: "US Letter" },
                  ]}
                />
              </div>

              <div className="p-4 rounded-2xl bg-secondary/50 border border-border text-xs font-medium text-muted-foreground leading-relaxed">
                Chromium renders layout, custom fonts, CSS flexbox/grid, and background graphics with 100% fidelity.
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
                <ProgressCard progress={-1} label="Rendering HTML to PDF…" />
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
