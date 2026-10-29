"use client";
import { parseApiError } from "@/lib/api-client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Header } from "@/components/layout-shell";
import {
  ToolLayout,
  EmptyState,
  FileDropZone,
  ProgressCard,
  ResultCard,
  ErrorAlert,
  CustomSelect,
} from "@/components/shared";
import { toast } from "sonner";
import { ChevronRight, ArrowRight, RefreshCcw, Image as ImageIcon, Trash2 } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function JpgToPdfPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
  const [pageSize, setPageSize] = useState<"a4" | "letter" | "fit">("a4");
  const [margin, setMargin] = useState<"none" | "small" | "big">("none");
  const [outputBaseName, setOutputBaseName] = useState("images-converted");

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
        setOutputBaseName(`${nameWithoutExt}-converted`);
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
    setOutputBaseName("images-converted");
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
              filename: `${outputBaseName.trim() || "images"}.pdf`,
            });
            toast.success("Images converted to PDF successfully!");
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
    if (files.length === 0) {
      toast.error("Please add at least one image file");
      return;
    }

    setStatus("processing");
    setErrorMessage(null);

    try {
      const fileIds: string[] = [];

      for (const f of files) {
        const uploadRes = await fetch(`${API_BASE}/api/v1/upload`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: f.name,
            contentType: f.type || "image/jpeg",
            size: f.size,
          }),
        });

        if (!uploadRes.ok) {
          throw new Error(`Failed to upload ${f.name}`);
        }

        const { uploadId, uploadUrl } = await uploadRes.json();

        const putRes = await fetch(uploadUrl, {
          method: "PUT",
          headers: {
            "Content-Type": f.type || "image/jpeg",
          },
          body: f,
        });

        if (!putRes.ok) {
          throw new Error(`Failed to upload binary for ${f.name}`);
        }

        fileIds.push(uploadId);
      }

      const jobRes = await fetch(`${API_BASE}/api/v1/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "jpg-to-pdf",
          file_id: fileIds[0],
          file_ids: fileIds,
          options: {
            orientation,
            pageSize,
            margin,
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

      {files.length === 0 ? (
        <EmptyState
          title="JPG to PDF"
          description="Convert JPG, PNG, and other images to PDF in seconds."
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          maxFiles={30}
          maxSizeMB={50}
          formatName="image"
          onFiles={handleFiles}
          disabled={status === "processing"}
        />
      ) : (
        <ToolLayout
          onReset={handleReset}
          options={
            <>
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground">Layout Options</h2>
              </div>

              {/* Orientation */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-foreground">
                  Page Orientation
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOrientation("portrait")}
                    className={`py-2 px-3 rounded-2xl border text-xs font-semibold transition-all cursor-pointer ${
                      orientation === "portrait"
                        ? "bg-secondary border-foreground/30 text-foreground"
                        : "bg-background border-border text-muted-foreground hover:border-foreground/20"
                    }`}
                  >
                    Portrait
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrientation("landscape")}
                    className={`py-2 px-3 rounded-2xl border text-xs font-semibold transition-all cursor-pointer ${
                      orientation === "landscape"
                        ? "bg-secondary border-foreground/30 text-foreground"
                        : "bg-background border-border text-muted-foreground hover:border-foreground/20"
                    }`}
                  >
                    Landscape
                  </button>
                </div>
              </div>

              {/* Page Size */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-foreground">
                  Page Size
                </label>
                <CustomSelect
                  value={pageSize}
                  onChange={(val) => setPageSize(val as any)}
                  options={[
                    { value: "a4", label: "A4 (Standard)" },
                    { value: "letter", label: "US Letter" },
                    { value: "fit", label: "Fit to Image" },
                  ]}
                />
              </div>

              {/* Margin */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-foreground">
                  Margin
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["none", "small", "big"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMargin(m)}
                      className={`py-2 px-2 capitalize rounded-2xl border text-xs font-semibold transition-all cursor-pointer ${
                        margin === m
                          ? "bg-secondary border-foreground/30 text-foreground"
                          : "bg-background border-border text-muted-foreground hover:border-foreground/20"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
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
                <ProgressCard progress={-1} label="Converting Images to PDF…" />
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
                  disabled={status === "processing" || files.length === 0}
                  className="w-full h-14 rounded-full bg-primary text-primary-foreground text-base font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer"
                >
                  <span>{status === "processing" ? "Converting…" : "Convert to PDF"}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
            ) : null
          }
        >
          

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
                    title="Remove image"
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
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) {
                      handleFiles(Array.from(e.target.files));
                    }
                  }}
                />
              </label>
            </div>
        </ToolLayout>
      )}
    </div>
  );
}
