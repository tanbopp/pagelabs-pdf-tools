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
import { ChevronRight, ArrowRight, RefreshCcw } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function PdfToJpgPage() {
  const [file, setFile] = useState<File | null>(null);
  const [dpi, setDpi] = useState<number>(150);
  const [format, setFormat] = useState<"jpg" | "png">("jpg");
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
      const nameWithoutExt = files[0].name.replace(/\.[^/.]+$/, "");
      setOutputBaseName(`${nameWithoutExt}-images`);
    }
  };

  const handleReset = () => {
    setFile(null);
    setStatus("idle");
    setJobId(null);
    setErrorMessage(null);
    setResultData(null);
    setOutputBaseName("extracted");
    setDpi(150);
    setFormat("jpg");
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
            // Check if result is zip or single image
            const isZip = data.result_url?.endsWith(".zip");
            const ext = isZip ? "zip" : format;
            setResultData({
              downloadUrl: `${API_BASE}${data.result_url}`,
              resultSize: data.result_size || 0,
              filename: `${outputBaseName}.${ext}`,
            });
            toast.success("PDF pages converted to images successfully");
          } else if (data.status === "failed") {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            setStatus("failed");
            setErrorMessage(data.error_message || "Failed to convert PDF to JPG");
          }
        } catch {}
      }, 1000);
    }
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [status, jobId, outputBaseName, format]);

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
          tool: "pdf-to-jpg",
          files: [
            {
              url: fileUrl,
              name: file.name,
              size: file.size,
            },
          ],
          options: {
            dpi,
            format,
            outputFilename: `${outputBaseName}.zip`,
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
            <span className="text-foreground">PDF to JPG</span>
          </nav>

          <div className="mb-12">
            <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">PDF to JPG</h1>
            <p className="text-base font-medium text-muted-foreground">Extract PDF pages to high-resolution JPG or PNG images.</p>
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
                <span className="text-foreground">PDF to JPG</span>
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
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground mb-1">Image Options</h2>
                <p className="text-xs font-medium text-muted-foreground">Choose image format and resolution.</p>
              </div>

              {/* Format selection */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-foreground">
                  Format
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormat("jpg")}
                    className={`py-2 px-3 rounded-2xl border text-xs font-semibold transition-all cursor-pointer ${
                      format === "jpg"
                        ? "bg-secondary border-foreground/30 text-foreground"
                        : "bg-background border-border text-muted-foreground hover:border-foreground/20"
                    }`}
                  >
                    JPG
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormat("png")}
                    className={`py-2 px-3 rounded-2xl border text-xs font-semibold transition-all cursor-pointer ${
                      format === "png"
                        ? "bg-secondary border-foreground/30 text-foreground"
                        : "bg-background border-border text-muted-foreground hover:border-foreground/20"
                    }`}
                  >
                    PNG
                  </button>
                </div>
              </div>

              {/* DPI selection */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-foreground">
                  Resolution (DPI)
                </label>
                <CustomSelect
                  value={String(dpi)}
                  onChange={(val) => setDpi(Number(val))}
                  options={[
                    { value: "72", label: "72 DPI (Web / Smallest file)" },
                    { value: "150", label: "150 DPI (Medium - Recommended)" },
                    { value: "300", label: "300 DPI (High Print Quality)" },
                  ]}
                />
              </div>

              <div className="p-4 rounded-2xl bg-secondary/50 border border-border text-xs font-medium text-muted-foreground leading-relaxed">
                Multi-page PDFs will be packaged into a clean ZIP archive with individual images for each page.
              </div>

              <div className="flex flex-col gap-2 pt-2 border-t border-border/80">
                <label htmlFor="output-name" className="text-xs font-semibold text-foreground">
                  Archive / File name
                </label>
                <div className="relative flex items-center">
                  <input
                    id="output-name"
                    type="text"
                    value={outputBaseName}
                    onChange={(e) => setOutputBaseName(e.target.value.replace(/\.(zip|jpg|png)$/i, ""))}
                    className="w-full h-11 pl-4 pr-16 rounded-2xl border border-border bg-background text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
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
                <ProgressCard progress={-1} label="Rendering PDF to Images…" />
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
                  <span>{status === "processing" ? "Converting…" : "Convert to JPG"}</span>
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
