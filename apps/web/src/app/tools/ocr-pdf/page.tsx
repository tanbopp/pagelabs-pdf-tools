"use client";

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
import * as SwitchPrimitives from "@radix-ui/react-switch";
import { ChevronRight, ArrowRight, RefreshCcw } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function OcrPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState("English");
  const [addTextLayerOnly, setAddTextLayerOnly] = useState(true);
  const [forceOcr, setForceOcr] = useState(false);
  const [outputBaseName, setOutputBaseName] = useState("ocr");

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
      setOutputBaseName(`${nameWithoutExt}-searchable`);
    }
  };

  const handleReset = () => {
    setFile(null);
    setStatus("idle");
    setJobId(null);
    setErrorMessage(null);
    setResultData(null);
    setOutputBaseName("ocr");
    setLanguage("English");
    setAddTextLayerOnly(true);
    setForceOcr(false);
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
            toast.success("OCR completed successfully");
          } else if (data.status === "failed") {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            setStatus("failed");
            setErrorMessage(data.error_message || "Failed to OCR PDF");
          }
        } catch {}
      }, 1000);
    }
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [status, jobId, outputBaseName]);

  const handleSubmit = async (overrideForce?: boolean) => {
    if (!file) return;
    setStatus("processing");
    setErrorMessage(null);

    const isForce = overrideForce !== undefined ? overrideForce : forceOcr;

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
        const signErr = await signRes.json().catch(() => ({}));
        throw new Error(signErr.error_message || "Failed to sign upload URL");
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
          tool: "ocr-pdf",
          files: [
            {
              url: fileUrl,
              name: file.name,
              size: file.size,
            },
          ],
          options: {
            language,
            add_text_layer_only: addTextLayerOnly,
            force_ocr: isForce,
            outputFilename: `${outputBaseName}.pdf`,
          },
        }),
      });

      if (!jobRes.ok) {
        const errorJson = await jobRes.json();
        throw new Error(errorJson.error_message || errorJson.message || "Failed to create OCR job");
      }

      const jobData = await jobRes.json();
      setJobId(jobData.job_id || jobData.jobId);
    } catch (err: unknown) {
      setStatus("failed");
      setErrorMessage(err instanceof Error ? err.message : "An unexpected error occurred");
    }
  };

  const languages = [
    { label: "English", value: "English" },
    { label: "Indonesian (Bahasa Indonesia)", value: "Indonesian" },
    { label: "Spanish (Español)", value: "Spanish" },
    { label: "French (Français)", value: "French" },
    { label: "German (Deutsch)", value: "German" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans">
      <Header />

      {!file ? (
        <main className="flex-1 w-full max-w-[1600px] mx-auto px-6 lg:px-10 py-12 flex flex-col">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground mb-8">
            <Link href="/" className="hover:text-foreground transition-colors">Tools</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground">OCR PDF</span>
          </nav>

          <div className="mb-12">
            <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">OCR PDF</h1>
            <p className="text-base font-medium text-muted-foreground">Make scanned PDFs searchable and selectable.</p>
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
                <span className="text-foreground">OCR PDF</span>
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
                <h2 className="text-2xl font-bold tracking-tight text-foreground mb-1">OCR Settings</h2>
                <p className="text-xs font-medium text-muted-foreground">Configure recognition options.</p>
              </div>

              {/* Language Selection */}
              <div className="flex flex-col gap-2">
                <label id="language-select-label" className="text-xs font-semibold text-foreground">
                  Document Language
                </label>
                <CustomSelect
                  id="language-select"
                  value={language}
                  onChange={(val) => setLanguage(val)}
                  options={languages.map((l) => ({ value: l.value, label: l.label }))}
                />
              </div>

              {/* Add Text Layer Only Toggle */}
              <div className="flex items-center justify-between py-1 border-t border-border/80">
                <label
                  htmlFor="text-layer-only"
                  className="text-xs font-semibold text-foreground cursor-pointer pr-4"
                >
                  Add text layer only (preserve scanned pages)
                </label>
                <SwitchPrimitives.Root
                  id="text-layer-only"
                  checked={addTextLayerOnly}
                  onCheckedChange={setAddTextLayerOnly}
                  disabled={status === "processing"}
                  className="w-11 h-6 rounded-full border border-border bg-secondary data-[state=checked]:bg-foreground transition-colors relative focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                >
                  <SwitchPrimitives.Thumb className="block w-5 h-5 rounded-full bg-background data-[state=checked]:translate-x-5 transition-transform" />
                </SwitchPrimitives.Root>
              </div>

              {/* Force OCR Toggle (for files with existing text) */}
              <div className="flex items-center justify-between py-1 border-t border-border/80">
                <div>
                  <label
                    htmlFor="force-ocr"
                    className="text-xs font-semibold text-foreground cursor-pointer block"
                  >
                    Force re-OCR
                  </label>
                  <span className="text-[11px] text-muted-foreground block">
                    Run OCR even if document already has text
                  </span>
                </div>
                <SwitchPrimitives.Root
                  id="force-ocr"
                  checked={forceOcr}
                  onCheckedChange={setForceOcr}
                  disabled={status === "processing"}
                  className="w-11 h-6 rounded-full border border-border bg-secondary data-[state=checked]:bg-foreground transition-colors relative focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                >
                  <SwitchPrimitives.Thumb className="block w-5 h-5 rounded-full bg-background data-[state=checked]:translate-x-5 transition-transform" />
                </SwitchPrimitives.Root>
              </div>

              {/* Output Name */}
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
                <div className="flex flex-col gap-2">
                  <ErrorAlert message={errorMessage} onRetry={handleSubmit} />
                  {errorMessage.includes("searchable text") && (
                    <button
                      type="button"
                      onClick={() => {
                        setForceOcr(true);
                        handleSubmit(true);
                      }}
                      className="w-full py-2.5 px-4 rounded-2xl bg-secondary hover:bg-secondary/80 border border-border text-foreground text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <span>Force re-OCR anyway</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              )}

              {status === "processing" && (
                <ProgressCard progress={-1} label="Extracting text layer…" />
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
                  onClick={() => handleSubmit()}
                  disabled={status === "processing"}
                  className="w-full h-14 rounded-full bg-primary text-primary-foreground text-base font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer"
                >
                  <span>{status === "processing" ? "Processing OCR…" : "Start OCR"}</span>
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
