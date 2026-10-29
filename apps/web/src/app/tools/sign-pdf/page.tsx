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
  CustomSelect,
} from "@/components/shared";
import { toast } from "sonner";
import { ChevronRight, ArrowRight, RefreshCcw, PenTool, RotateCcw } from "lucide-react";
import SignatureCanvas from "react-signature-canvas";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function SignPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [nameText, setNameText] = useState("");
  const [signatureImageBase64, setSignatureImageBase64] = useState<string>("");
  const [page, setPage] = useState<string>("last");
  const [position, setPosition] = useState<"bottom-right" | "bottom-center" | "top-right">("bottom-right");
  const [outputBaseName, setOutputBaseName] = useState("signed");

  const sigCanvasRef = useRef<SignatureCanvas | null>(null);

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
      setOutputBaseName(`${nameWithoutExt}-signed`);
    }
  };

  const clearCanvas = () => {
    sigCanvasRef.current?.clear();
    setSignatureImageBase64("");
  };

  const handleCanvasEnd = () => {
    if (sigCanvasRef.current && !sigCanvasRef.current.isEmpty()) {
      setSignatureImageBase64(sigCanvasRef.current.getTrimmedCanvas().toDataURL("image/png"));
    }
  };

  const handleReset = () => {
    setFile(null);
    setStatus("idle");
    setJobId(null);
    setErrorMessage(null);
    setResultData(null);
    setNameText("");
    setSignatureImageBase64("");
    sigCanvasRef.current?.clear();
    setPage("last");
    setPosition("bottom-right");
    setOutputBaseName("signed");
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
            toast.success("PDF signed successfully");
          } else if (data.status === "failed") {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            setStatus("failed");
            setErrorMessage(data.error_message || "Failed to sign PDF");
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

    if (!nameText && !signatureImageBase64) {
      toast.error("Please either provide a signature name or upload a signature image");
      return;
    }

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
          tool: "sign-pdf",
          files: [
            {
              url: fileUrl,
              name: file.name,
              size: file.size,
            },
          ],
          options: {
            page: page === "last" ? "last" : Number(page),
            position,
            nameText: nameText.trim() || undefined,
            signatureImage: signatureImageBase64 || undefined,
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
          title="Sign PDF"
          description="Sign a document yourself or send signature requests to others."
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
                  <PenTool className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-foreground">Signature Options</h2>
                  <p className="text-xs font-medium text-muted-foreground">Visual overlay stamp</p>
                </div>
              </div>

              {/* Signature Canvas Pad */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground">
                    Draw Signature
                  </label>
                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Clear</span>
                  </button>
                </div>
                <div className="rounded-2xl border border-border bg-card overflow-hidden h-36 flex items-center justify-center relative">
                  <SignatureCanvas
                    ref={sigCanvasRef}
                    penColor="#000000"
                    canvasProps={{
                      className: "w-full h-full cursor-crosshair bg-white",
                    }}
                    onEnd={handleCanvasEnd}
                  />
                  {!signatureImageBase64 && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-xs text-muted-foreground/40 font-semibold">
                      Draw with mouse or finger here
                    </div>
                  )}
                </div>
              </div>

              {/* Typed signature text */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="sign-name" className="text-xs font-semibold text-foreground">
                  Or Type Your Full Name
                </label>
                <input
                  id="sign-name"
                  type="text"
                  placeholder="e.g. John Doe"
                  value={nameText}
                  onChange={(e) => setNameText(e.target.value)}
                  className="w-full h-11 px-4 rounded-2xl border border-border bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              {/* Page & Position */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/80">
                <div className="flex flex-col gap-1.5">
                  <label id="sign-page-label" className="text-xs font-semibold text-foreground">
                    Target Page
                  </label>
                  <CustomSelect
                    id="sign-page"
                    value={page}
                    onChange={(val) => setPage(val)}
                    options={[
                      { value: "last", label: "Last Page" },
                      { value: "1", label: "Page 1" },
                    ]}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label id="sign-pos-label" className="text-xs font-semibold text-foreground">
                    Position
                  </label>
                  <CustomSelect
                    id="sign-pos"
                    value={position}
                    onChange={(val) => setPosition(val as any)}
                    options={[
                      { value: "bottom-right", label: "Bottom Right" },
                      { value: "bottom-center", label: "Bottom Center" },
                      { value: "top-right", label: "Top Right" },
                    ]}
                  />
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
                <ProgressCard progress={-1} label="Affixing signature…" />
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
                  <span>{status === "processing" ? "Signing…" : "Sign PDF"}</span>
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
