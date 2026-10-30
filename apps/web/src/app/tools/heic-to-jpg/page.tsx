"use client";

import { parseApiError } from "@/lib/api-client";
import React, { useState, useEffect, useRef } from "react";
import { Header } from "@/components/layout-shell";
import {
  ToolLayout,
  EmptyState,
  ProgressCard,
  ResultCard,
  ErrorAlert,
} from "@/components/shared";
import { toast } from "sonner";
import { ArrowRight, Image as ImageIcon, Trash2, Plus } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface HeicFileItem {
  id: string;
  file: File;
  previewUrl: string | null;
}

export default function HeicToJpgPage() {
  const [items, setItems] = useState<HeicFileItem[]>([]);
  const [quality, setQuality] = useState<"high" | "medium" | "low">("high");
  const [outputBaseName, setOutputBaseName] = useState("converted_photos");

  const [status, setStatus] = useState<"idle" | "processing" | "completed" | "failed">("idle");
  const [jobId, setJobId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resultData, setResultData] = useState<{
    downloadUrl: string;
    resultSize: number;
    filename: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const qualityOptions = [
    {
      id: "high",
      title: "High (Original)",
      desc: "Best visual fidelity (JPEG quality 95)",
    },
    {
      id: "medium",
      title: "Medium",
      desc: "Balanced size and quality (JPEG quality 75)",
    },
    {
      id: "low",
      title: "Low",
      desc: "Smallest size, web optimized (JPEG quality 50)",
    },
  ] as const;

  const handleFiles = (newFiles: File[]) => {
    if (newFiles.length === 0) return;

    const newItems: HeicFileItem[] = newFiles.map((f, i) => {
      let previewUrl: string | null = null;
      try {
        previewUrl = URL.createObjectURL(f);
      } catch {
        previewUrl = null;
      }
      return {
        id: `${f.name}-${Date.now()}-${i}`,
        file: f,
        previewUrl,
      };
    });

    setItems((prev) => [...prev, ...newItems]);
    setErrorMessage(null);

    if (items.length === 0 && newFiles.length > 0) {
      const nameWithoutExt = newFiles[0].name.replace(/\.[^/.]+$/, "");
      setOutputBaseName(`${nameWithoutExt}-jpg`);
    }
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => {
      const target = prev.find((it) => it.id === id);
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((it) => it.id !== id);
    });
  };

  const handleReset = () => {
    items.forEach((it) => {
      if (it.previewUrl) URL.revokeObjectURL(it.previewUrl);
    });
    setItems([]);
    setStatus("idle");
    setJobId(null);
    setErrorMessage(null);
    setResultData(null);
    setOutputBaseName("converted_photos");
    setQuality("high");
  };

  useEffect(() => {
    if (status === "processing" && jobId) {
      pollIntervalRef.current = setInterval(async () => {
        try {
          const res = await fetch(`${API_BASE}/api/v1/jobs/${jobId}`);
          if (!res.ok) throw new Error("Failed to query job status");
          const data = await res.json();

          if (data.status === "completed") {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            setStatus("completed");
            setResultData({
              downloadUrl: `${API_BASE}${data.result_url}`,
              resultSize: data.result_size || 0,
              filename: `${outputBaseName}.zip`,
            });
            toast.success("HEIC photos converted to JPG successfully");
          } else if (data.status === "failed") {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            setStatus("failed");
            setErrorMessage(data.error_message || "Failed to convert HEIC to JPG");
          }
        } catch {}
      }, 1000);
    }
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [status, jobId, outputBaseName]);

  const handleSubmit = async () => {
    if (items.length === 0) return;
    setStatus("processing");
    setErrorMessage(null);

    try {
      const uploadedFiles = [];

      for (const item of items) {
        const signRes = await fetch(`${API_BASE}/api/v1/uploads/sign`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: item.file.name,
            size: item.file.size,
            contentType: item.file.type || "image/heic",
          }),
        });
        if (!signRes.ok) {
          const errMsg = await parseApiError(signRes, `Failed to sign upload for ${item.file.name}`);
          throw new Error(errMsg);
        }
        const { uploadUrl, fileUrl } = await signRes.json();

        const uploadRes = await fetch(uploadUrl, {
          method: "PUT",
          body: item.file,
          headers: { "Content-Type": item.file.type || "image/heic" },
        });
        if (!uploadRes.ok) {
          throw new Error(`Upload failed for ${item.file.name}`);
        }

        uploadedFiles.push({
          url: fileUrl,
          name: item.file.name,
          size: item.file.size,
        });
      }

      const jobRes = await fetch(`${API_BASE}/api/v1/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "heic-to-jpg",
          files: uploadedFiles,
          options: {
            quality,
            outputFilename: `${outputBaseName}.zip`,
          },
        }),
      });

      if (!jobRes.ok) {
        const errMsg = await parseApiError(jobRes, "Failed to start conversion job");
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

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".heic,.heif,image/heic,image/heif"
        className="hidden"
        onChange={(e) => {
          if (e.target.files) {
            handleFiles(Array.from(e.target.files));
            e.target.value = "";
          }
        }}
      />

      {items.length === 0 ? (
        <EmptyState
          title="HEIC to JPG"
          description="Convert Apple HEIC photos to standard JPG images in seconds."
          accept=".heic,.heif,image/heic,image/heif"
          maxFiles={20}
          maxSizeMB={100}
          formatName="HEIC / HEIF"
          onFiles={handleFiles}
          disabled={status === "processing"}
        />
      ) : (
        <ToolLayout
          status={status}
          onReset={handleReset}
          changeFileText="Clear all"
          processingNode={
            <ProgressCard progress={-1} label="Converting HEIC to JPG…" />
          }
          completedNode={
            resultData ? (
              <ResultCard
                filename={resultData.filename}
                sizeBytes={resultData.resultSize}
                downloadUrl={resultData.downloadUrl}
                downloadButtonText="Download ZIP"
                title="Your JPG photos are ready"
                onReset={handleReset}
              />
            ) : null
          }
          options={
            <>
              <div>
                <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
                  Image Quality
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Choose the compression quality for converted JPG images.
                </p>
              </div>

              {/* Quality Radio Options */}
              <div className="flex flex-col gap-2.5">
                {qualityOptions.map((opt) => {
                  const isSelected = quality === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setQuality(opt.id)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-secondary border-foreground/30 text-foreground"
                          : "bg-background border-border text-muted-foreground hover:border-foreground/20"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-bold text-foreground">
                          {opt.title}
                        </span>
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected
                              ? "border-foreground bg-foreground"
                              : "border-muted-foreground/40"
                          }`}
                        >
                          {isSelected && (
                            <div className="w-1.5 h-1.5 rounded-full bg-background" />
                          )}
                        </div>
                      </div>
                      <p className="text-xs font-medium text-muted-foreground">
                        {opt.desc}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Output Name */}
              <div className="flex flex-col gap-2 pt-2 border-t border-border/80">
                <label htmlFor="output-name" className="text-xs font-semibold text-foreground">
                  Output archive name
                </label>
                <div className="relative flex items-center">
                  <input
                    id="output-name"
                    type="text"
                    value={outputBaseName}
                    onChange={(e) => setOutputBaseName(e.target.value.replace(/\.zip$/i, ""))}
                    className="w-full h-11 pl-4 pr-14 rounded-2xl border border-border bg-background text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  <span className="absolute right-3 px-2 py-0.5 rounded-lg bg-secondary text-[11px] font-bold text-muted-foreground select-none pointer-events-none">
                    .zip
                  </span>
                </div>
              </div>

              {status === "failed" && errorMessage && (
                <ErrorAlert message={errorMessage} onRetry={handleSubmit} />
              )}
            </>
          }
          actionButton={
            <button
              type="button"
              onClick={handleSubmit}
              disabled={items.length === 0}
              className="w-full h-14 rounded-full bg-primary text-primary-foreground text-base font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer shadow-none"
            >
              <span>Convert to JPG</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          }
        >
          {/* Canvas Kiri: Grid of Uploaded HEIC Items */}
          <div className="w-full flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground">
                {items.length} Photo{items.length > 1 ? "s" : ""} selected
              </span>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="h-9 px-3.5 rounded-full border border-border bg-background hover:bg-secondary text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add More</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {items.map((item, idx) => (
                <div
                  key={item.id}
                  className="group relative flex flex-col rounded-2xl border border-border bg-card p-3 text-foreground select-none hover:border-foreground/40 transition-colors"
                >
                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.id)}
                    className="absolute top-2 right-2 z-20 h-7 w-7 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center text-muted-foreground hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    title="Remove photo"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>

                  {/* Thumbnail Container */}
                  <div className="relative aspect-[3/4] w-full rounded-xl bg-muted/40 border border-border/50 overflow-hidden flex flex-col items-center justify-center p-2 text-center">
                    {item.previewUrl ? (
                      <img
                        src={item.previewUrl}
                        alt={item.file.name}
                        className="h-full w-full object-cover rounded-lg"
                        onError={(e) => {
                          // Browsers without native HEIC decoder fall back to icon
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    ) : null}

                    {/* Fallback Icon view (always rendered behind or if decoding fails) */}
                    <div className="flex flex-col items-center justify-center gap-1.5 text-muted-foreground">
                      <ImageIcon className="h-8 w-8 stroke-[1.5]" />
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-secondary px-2 py-0.5 rounded-md">
                        HEIC
                      </span>
                    </div>
                  </div>

                  {/* File Label */}
                  <div className="mt-2.5 flex items-center justify-between text-[11px] font-medium text-muted-foreground">
                    <span className="truncate max-w-[100px]" title={item.file.name}>
                      {item.file.name}
                    </span>
                    <span>{(item.file.size / (1024 * 1024)).toFixed(1)} MB</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ToolLayout>
      )}
    </div>
  );
}

