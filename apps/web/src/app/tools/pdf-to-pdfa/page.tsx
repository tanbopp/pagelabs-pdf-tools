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
} from "@/components/shared";
import { toast } from "sonner";
import { ChevronRight, ArrowRight, RefreshCcw, Archive } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function PdfToPdfaPage() {
  const [file, setFile] = useState<File | null>(null);
  const [conformance, setConformance] = useState<"PDF/A-2b" | "PDF/A-3b">("PDF/A-2b");
  const [outputBaseName, setOutputBaseName] = useState("archival");

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
      setOutputBaseName(`${nameWithoutExt}-pdfa`);
    }
  };

  const handleReset = () => {
    setFile(null);
    setStatus("idle");
    setJobId(null);
    setErrorMessage(null);
    setResultData(null);
    setOutputBaseName("archival");
    setConformance("PDF/A-2b");
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
            toast.success("Converted to PDF/A successfully");
          } else if (data.status === "failed") {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            setStatus("failed");
            setErrorMessage(data.error_message || "Failed to convert to PDF/A");
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
        const uploadErrText = await uploadRes.text().catch(() => "");
        throw new Error(`Upload failed (${uploadRes.status}): ${uploadErrText || uploadRes.statusText}`);
      }

      const jobRes = await fetch(`${API_BASE}/api/v1/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "pdf-to-pdfa",
          files: [
            {
              url: fileUrl,
              name: file.name,
              size: file.size,
            },
          ],
          options: {
            conformance,
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

  const conformanceLevels = [
    {
      id: "PDF/A-2b",
      title: "PDF/A-2b (Recommended)",
      desc: "Standard archival compliance based on ISO 32000-1 (PDF 1.7)",
    },
    {
      id: "PDF/A-3b",
      title: "PDF/A-3b",
      desc: "Archival compliance allowing embedded arbitrary file attachments",
    },
  ] as const;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans">
      <Header />

      {!file ? (
        <main className="flex-1 w-full max-w-[1600px] mx-auto px-6 lg:px-10 py-12 flex flex-col">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground mb-8">
            <Link href="/" className="hover:text-foreground transition-colors">Tools</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground">PDF to PDF/A</span>
          </nav>

          <div className="mb-12">
            <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">PDF to PDF/A</h1>
            <p className="text-base font-medium text-muted-foreground">Convert standard PDF to long-term preservation format.</p>
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
                <span className="text-foreground">PDF to PDF/A</span>
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

            <div className="max-w-sm">
              <PdfPagePreview
                file={file}
                index={0}
                onRemove={handleReset}
              />
            </div>
          </section>

          <aside className="w-full lg:w-[380px] shrink-0 sticky top-6 flex flex-col gap-6">
            <div className="rounded-3xl border border-border bg-card p-6 flex flex-col gap-6">
              <div className="flex items-center gap-2">
                <Archive className="w-5 h-5 text-muted-foreground" />
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-foreground">PDF/A Format</h2>
                  <p className="text-xs font-medium text-muted-foreground">ISO preservation standard.</p>
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                {conformanceLevels.map((lvl) => {
                  const isSelected = conformance === lvl.id;
                  return (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => setConformance(lvl.id)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-secondary border-foreground/30 text-foreground"
                          : "bg-background border-border text-muted-foreground hover:border-foreground/20"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-bold text-foreground">{lvl.title}</span>
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected ? "border-foreground bg-foreground" : "border-muted-foreground/40"
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-background" />}
                        </div>
                      </div>
                      <p className="text-xs font-medium text-muted-foreground">{lvl.desc}</p>
                    </button>
                  );
                })}
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
                <ProgressCard progress={-1} label="Converting to PDF/A…" />
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
                  <span>{status === "processing" ? "Converting…" : "Convert to PDF/A"}</span>
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
