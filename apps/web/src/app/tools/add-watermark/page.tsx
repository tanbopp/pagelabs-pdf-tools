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
import { getPdfAllPagesPreview, PdfPageItem } from "@/lib/pdf-preview";
import { toast } from "sonner";
import {
  ChevronRight,
  ArrowRight,
  RefreshCcw,
  Stamp,
  Upload,
  FileText,
  Loader2,
  ZoomIn,
  ZoomOut,
  Type,
  Image as ImageIcon,
  Bold,
  Italic,
  Underline,
  Layers,
  Check,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

type Position9 =
  | "top-left"
  | "top-center"
  | "top-right"
  | "middle-left"
  | "middle-center"
  | "middle-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export default function AddWatermarkPage() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PdfPageItem[]>([]);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  // Core Options
  const [type, setType] = useState<"text" | "image">("text");
  const [text, setText] = useState("CONFIDENTIAL");
  const [imageBase64, setImageBase64] = useState<string>("");
  const [opacity, setOpacity] = useState(0.5);

  // Advanced Options matching reference design
  const [fontFamily, setFontFamily] = useState<"Helvetica" | "Times-Roman" | "Courier">("Helvetica");
  const [fontSize, setFontSize] = useState<number>(44);
  const [isBold, setIsBold] = useState(true);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [color, setColor] = useState<string>("#e11d48"); // Default vibrant/bold accent or neutral

  const [position, setPosition] = useState<Position9>("middle-center");
  const [mosaic, setMosaic] = useState<boolean>(false);
  const [rotation, setRotation] = useState<number>(45);

  const [fromPage, setFromPage] = useState<number>(1);
  const [toPage, setToPage] = useState<number>(1);
  const [layer, setLayer] = useState<"over" | "below">("over");

  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [outputBaseName, setOutputBaseName] = useState("watermarked");

  const [status, setStatus] = useState<"idle" | "processing" | "completed" | "failed">("idle");
  const [jobId, setJobId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resultData, setResultData] = useState<{
    downloadUrl: string;
    resultSize: number;
    filename: string;
  } | null>(null);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load all pages preview when file is selected
  useEffect(() => {
    if (!file) {
      setPages([]);
      return;
    }

    let isMounted = true;
    setIsPreviewLoading(true);

    getPdfAllPagesPreview(file, 850, 30)
      .then((items) => {
        if (isMounted) {
          setPages(items);
          setIsPreviewLoading(false);
          setToPage(items.length > 0 ? items.length : 1);
        }
      })
      .catch(() => {
        if (isMounted) {
          setPages([]);
          setIsPreviewLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [file]);

  const handleFile = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setErrorMessage(null);
      const nameWithoutExt = files[0].name.replace(/\.[^/.]+$/, "");
      setOutputBaseName(`${nameWithoutExt}-watermarked`);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      const reader = new FileReader();
      reader.onload = () => {
        setImageBase64(reader.result as string);
      };
      reader.readAsDataURL(f);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPages([]);
    setStatus("idle");
    setJobId(null);
    setErrorMessage(null);
    setResultData(null);
    setType("text");
    setText("CONFIDENTIAL");
    setImageBase64("");
    setOpacity(0.5);
    setFontFamily("Helvetica");
    setFontSize(44);
    setIsBold(true);
    setIsItalic(false);
    setIsUnderline(false);
    setColor("#e11d48");
    setPosition("middle-center");
    setMosaic(false);
    setRotation(45);
    setFromPage(1);
    setToPage(1);
    setLayer("over");
    setZoomLevel(100);
    setOutputBaseName("watermarked");
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
            toast.success("Watermark applied successfully");
          } else if (data.status === "failed") {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            setStatus("failed");
            setErrorMessage(data.error_message || "Failed to stamp watermark");
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

    if (type === "text" && !text.trim()) {
      toast.error("Please enter watermark text");
      return;
    }
    if (type === "image" && !imageBase64) {
      toast.error("Please upload a watermark image");
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
          tool: "add-watermark",
          files: [
            {
              url: fileUrl,
              name: file.name,
              size: file.size,
            },
          ],
          options: {
            type,
            text: type === "text" ? text.trim() : undefined,
            image: type === "image" ? imageBase64 : undefined,
            opacity,
            position,
            mosaic,
            rotation,
            fontFamily,
            fontSize,
            isBold,
            isItalic,
            isUnderline,
            color,
            fromPage,
            toPage,
            layer,
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

  // 9-point grid alignment helper for overlay
  const getGridAlignment = (pos: Position9) => {
    switch (pos) {
      case "top-left":
        return { justify: "flex-start", align: "flex-start", p: "2.5rem" };
      case "top-center":
        return { justify: "center", align: "flex-start", p: "2.5rem 1rem 1rem 1rem" };
      case "top-right":
        return { justify: "flex-end", align: "flex-start", p: "2.5rem" };
      case "middle-left":
        return { justify: "flex-start", align: "center", p: "1rem 2.5rem" };
      case "middle-center":
        return { justify: "center", align: "center", p: "1rem" };
      case "middle-right":
        return { justify: "flex-end", align: "center", p: "1rem 2.5rem" };
      case "bottom-left":
        return { justify: "flex-start", align: "flex-end", p: "2.5rem" };
      case "bottom-center":
        return { justify: "center", align: "flex-end", p: "1rem 1rem 2.5rem 1rem" };
      case "bottom-right":
        return { justify: "flex-end", align: "flex-end", p: "2.5rem" };
      default:
        return { justify: "center", align: "center", p: "1rem" };
    }
  };

  const gridPositions: Position9[] = [
    "top-left",
    "top-center",
    "top-right",
    "middle-left",
    "middle-center",
    "middle-right",
    "bottom-left",
    "bottom-center",
    "bottom-right",
  ];

  return (
    <div className="h-screen max-h-screen flex flex-col bg-background text-foreground font-sans overflow-hidden">
      <Header />

      {!file ? (
        <EmptyState
          title="Add Watermark"
          description="Stamp an image or text over your PDF pages in seconds."
          accept="application/pdf"
          maxFiles={1}
          maxSizeMB={100}
          formatName="PDF"
          onFiles={handleFile}
          disabled={status === "processing"}
        />
      ) : (
        <ToolLayout
          status={status}
          processingNode={<ProgressCard progress={-1} label="Stamping watermark…" />}
          completedNode={resultData ? (<ResultCard
                  filename={resultData.filename}
                  sizeBytes={resultData.resultSize}
                  downloadUrl={resultData.downloadUrl}
                  onReset={handleReset}
                />) : null}
          onReset={handleReset}
          options={
            <>
              {/* Header Tab Selector: Place text vs Place image */}
              <div className="grid grid-cols-2 rounded-2xl border border-border bg-secondary/50 p-1">
                <button
                  type="button"
                  onClick={() => setType("text")}
                  className={`py-3 px-3 rounded-xl flex flex-col items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer relative ${
                    type === "text"
                      ? "bg-card text-foreground shadow-sm border border-border/80"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {type === "text" && (
                    <span className="absolute top-1.5 left-1.5 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                  )}
                  <span className="text-xl font-bold font-serif leading-none">A</span>
                  <span>Place text</span>
                </button>

                <button
                  type="button"
                  onClick={() => setType("image")}
                  className={`py-3 px-3 rounded-xl flex flex-col items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer relative ${
                    type === "image"
                      ? "bg-card text-foreground shadow-sm border border-border/80"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {type === "image" && (
                    <span className="absolute top-1.5 left-1.5 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                  )}
                  <ImageIcon className="w-5 h-5 leading-none" />
                  <span>Place image</span>
                </button>
              </div>

              {/* Text Input & Typography Controls */}
              {type === "text" ? (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="wm-text" className="text-xs font-bold text-foreground">
                      Text:
                    </label>
                    <input
                      id="wm-text"
                      type="text"
                      placeholder="e.g. iLovePDF / CONFIDENTIAL"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      className="w-full h-11 px-4 rounded-2xl border border-border bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>

                  {/* Text format row: Font family, size, bold, italic, underline, color */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-bold text-foreground">Text format:</span>
                    <div className="flex items-center flex-wrap gap-2">
                      {/* Font Family */}
                      <div className="w-28">
                        <CustomSelect
                          value={fontFamily}
                          onChange={(val) => setFontFamily(val as any)}
                          options={[
                            { value: "Helvetica", label: "Arial / Sans" },
                            { value: "Times-Roman", label: "Times / Serif" },
                            { value: "Courier", label: "Courier / Mono" },
                          ]}
                        />
                      </div>

                      {/* Font Size */}
                      <div className="w-20">
                        <CustomSelect
                          value={String(fontSize)}
                          onChange={(val) => setFontSize(Number(val))}
                          options={[
                            { value: "28", label: "28 pt" },
                            { value: "36", label: "36 pt" },
                            { value: "44", label: "44 pt" },
                            { value: "56", label: "56 pt" },
                            { value: "72", label: "72 pt" },
                          ]}
                        />
                      </div>

                      {/* Formatting icons: Bold, Italic, Underline */}
                      <div className="flex items-center rounded-2xl border border-border bg-background p-1">
                        <button
                          type="button"
                          onClick={() => setIsBold(!isBold)}
                          className={`w-8 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                            isBold ? "bg-secondary text-foreground font-black" : "text-muted-foreground hover:text-foreground"
                          }`}
                          title="Bold"
                        >
                          <Bold className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsItalic(!isItalic)}
                          className={`w-8 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                            isItalic ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
                          }`}
                          title="Italic"
                        >
                          <Italic className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsUnderline(!isUnderline)}
                          className={`w-8 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                            isUnderline ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
                          }`}
                          title="Underline"
                        >
                          <Underline className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Text Color Picker */}
                      <div className="relative flex items-center justify-center w-10 h-11 rounded-2xl border border-border bg-background cursor-pointer overflow-hidden p-1">
                        <input
                          type="color"
                          value={color}
                          onChange={(e) => setColor(e.target.value)}
                          className="w-full h-full cursor-pointer bg-transparent border-0 opacity-0 absolute inset-0"
                          title="Choose text color"
                        />
                        <div
                          className="w-6 h-6 rounded-full border border-black/20"
                          style={{ backgroundColor: color }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Place Image Upload */
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-foreground">Image:</label>
                  <label className="w-full h-14 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm">
                    <ImageIcon className="w-4 h-4" />
                    <span>{imageBase64 ? "CHANGE IMAGE" : "ADD IMAGE"}</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              )}

              {/* Position: 9-point Grid & Mosaic Checkbox */}
              <div className="flex flex-col gap-2 pt-2 border-t border-border/80">
                <span className="text-xs font-bold text-foreground">Position:</span>
                <div className="flex items-center gap-6">
                  {/* 3x3 Grid Box */}
                  <div className={`grid grid-cols-3 grid-rows-3 w-24 h-24 border border-neutral-300 dark:border-neutral-700 rounded-lg p-1 bg-background/50 ${mosaic ? "opacity-30 pointer-events-none" : ""}`}>
                    {gridPositions.map((pos) => {
                      const isSelected = position === pos;
                      return (
                        <button
                          key={pos}
                          type="button"
                          onClick={() => setPosition(pos)}
                          className="flex items-center justify-center border border-dashed border-neutral-300 dark:border-neutral-800 hover:bg-secondary/60 transition-colors cursor-pointer"
                        >
                          {isSelected && (
                            <span className="w-4 h-4 rounded-full bg-rose-500 shadow-sm animate-in zoom-in-75 duration-100" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Mosaic Checkbox */}
                  <label className="flex items-center gap-2.5 text-xs font-semibold text-foreground cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={mosaic}
                      onChange={(e) => setMosaic(e.target.checked)}
                      className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary cursor-pointer"
                    />
                    <span>Mosaic</span>
                  </label>
                </div>
              </div>

              {/* Transparency & Rotation Row */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/80">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-foreground">Transparency:</label>
                  <CustomSelect
                    value={String(opacity)}
                    onChange={(val) => setOpacity(parseFloat(val))}
                    options={[
                      { value: "1", label: "No transparency" },
                      { value: "0.75", label: "25% transparent" },
                      { value: "0.5", label: "50% transparent" },
                      { value: "0.25", label: "75% transparent" },
                    ]}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-foreground">Rotation:</label>
                  <CustomSelect
                    value={String(rotation)}
                    onChange={(val) => setRotation(parseInt(val, 10))}
                    options={[
                      { value: "0", label: "Do not rotate" },
                      { value: "45", label: "45 degrees" },
                      { value: "90", label: "90 degrees" },
                      { value: "180", label: "180 degrees" },
                      { value: "270", label: "270 degrees" },
                    ]}
                  />
                </div>
              </div>

              {/* Page Range: From page ... To ... */}
              <div className="flex flex-col gap-2 pt-2 border-t border-border/80">
                <span className="text-xs font-bold text-foreground">Pages:</span>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center rounded-2xl border border-border bg-background overflow-hidden h-11">
                    <span className="px-3 text-xs font-semibold text-muted-foreground border-r border-border shrink-0 select-none">
                      from page
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={pages.length || 1}
                      value={fromPage}
                      onChange={(e) => setFromPage(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full h-full px-3 text-xs font-bold text-foreground focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center rounded-2xl border border-border bg-background overflow-hidden h-11">
                    <span className="px-3 text-xs font-semibold text-muted-foreground border-r border-border shrink-0 select-none">
                      to
                    </span>
                    <input
                      type="number"
                      min={fromPage}
                      max={pages.length || 1}
                      value={toPage}
                      onChange={(e) => setToPage(Math.min(pages.length || 1, Math.max(fromPage, parseInt(e.target.value) || 1)))}
                      className="w-full h-full px-3 text-xs font-bold text-foreground focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Layer Placement: Over the PDF content vs Below the PDF content */}
              <div className="flex flex-col gap-2 pt-2 border-t border-border/80">
                <span className="text-xs font-bold text-foreground">Layer:</span>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setLayer("over")}
                    className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center gap-2 text-center transition-all cursor-pointer ${
                      layer === "over"
                        ? "border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold"
                        : "border-border bg-secondary/30 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Layers className="w-5 h-5 text-current" />
                    <span className="text-xs leading-tight">Over the PDF content</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLayer("below")}
                    className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center gap-2 text-center transition-all cursor-pointer ${
                      layer === "below"
                        ? "border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold"
                        : "border-border bg-secondary/30 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Layers className="w-5 h-5 text-current opacity-70" />
                    <span className="text-xs leading-tight">Below the PDF content</span>
                  </button>
                </div>
              </div>

              {/* Output Filename */}
              <div className="flex flex-col gap-2 pt-2 border-t border-border/80">
                <label htmlFor="output-name" className="text-xs font-bold text-foreground">
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
                <ProgressCard progress={-1} label="Stamping watermark…" />
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
                  className="w-full h-14 rounded-full bg-primary text-primary-foreground text-base font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer shrink-0 mt-2"
                >
                  <span>{status === "processing" ? "Stamping…" : "Add Watermark"}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
            ) : null
          }
        >
          <div className="flex items-center justify-between mb-3 shrink-0">

              <div className="flex items-center gap-3">
                {/* Zoom Controls */}
                <div className="flex items-center gap-1.5 bg-secondary/80 rounded-full p-1 border border-border/60">
                  <button
                    type="button"
                    onClick={() => setZoomLevel((prev) => Math.max(60, prev - 10))}
                    disabled={zoomLevel <= 60}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-background/80 transition-colors disabled:opacity-40 cursor-pointer"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] font-bold px-1.5 min-w-[3rem] text-center select-none text-foreground">
                    {zoomLevel}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setZoomLevel((prev) => Math.min(140, prev + 10))}
                    disabled={zoomLevel >= 140}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-background/80 transition-colors disabled:opacity-40 cursor-pointer"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleReset}
                  className="h-9 px-4 rounded-full border border-border bg-card hover:bg-secondary text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCcw className="h-3.5 w-3.5" />
                  <span>Change file</span>
                </button>
              </div>
            </div>

            {/* Document Viewer Canvas Area */}
            <div className="relative w-full flex-1 rounded-2xl bg-neutral-200/70 dark:bg-neutral-950/80 border border-neutral-300 dark:border-neutral-800 p-4 sm:p-8 flex flex-col items-center justify-start overflow-auto min-h-0">
              {isPreviewLoading && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-2 bg-background/60 backdrop-blur-xs">
                  <Loader2 className="w-7 h-7 animate-spin text-primary" />
                  <span className="text-xs font-semibold text-muted-foreground">Rendering PDF document pages…</span>
                </div>
              )}

              <div
                style={{
                  transform: `scale(${zoomLevel / 100})`,
                  transformOrigin: "top center",
                }}
                className="transition-transform duration-200 ease-out flex flex-col items-center gap-6 w-full py-2"
              >
                {pages.length > 0 ? (
                  pages.map((p) => {
                    const isWithinPageRange = p.pageNumber >= fromPage && p.pageNumber <= toPage;
                    return (
                      <div
                        key={p.pageNumber}
                        className="relative bg-white text-neutral-900 shadow-xl rounded-none border border-neutral-300 dark:border-neutral-700 overflow-hidden select-none"
                        style={{
                          width: "600px",
                          maxWidth: "100%",
                          aspectRatio: `${p.width} / ${p.height}`,
                        }}
                      >
                        {/* Rendered PDF Page Image */}
                        <img
                          src={p.dataUrl}
                          alt={`Page ${p.pageNumber}`}
                          className={`w-full h-full object-contain pointer-events-none select-none block ${
                            layer === "below" ? "relative z-10" : ""
                          }`}
                        />

                        {/* LIVE WATERMARK OVERLAY LAYER */}
                        {isWithinPageRange && (
                          <div
                            className={`absolute inset-0 pointer-events-none z-10 overflow-hidden ${
                              layer === "below" ? "!z-0 opacity-80" : ""
                            }`}
                          >
                            {mosaic ? (
                              /* Mosaic 3x4 Grid matching backend cols=3 rows=4 */
                              <div className="w-full h-full grid grid-cols-3 grid-rows-4">
                                {Array.from({ length: 12 }).map((_, i) => (
                                  <div key={i} className="flex items-center justify-center overflow-hidden">
                                    {type === "text" ? (
                                      <span
                                        className="tracking-wider text-center select-none whitespace-nowrap"
                                        style={{
                                          opacity,
                                          color,
                                          fontFamily: fontFamily === "Times-Roman" ? "Times New Roman, serif" : fontFamily === "Courier" ? "Courier New, monospace" : "Helvetica, Arial, sans-serif",
                                          fontWeight: isBold ? 800 : 400,
                                          fontStyle: isItalic ? "italic" : "normal",
                                          textDecoration: isUnderline ? "underline" : "none",
                                          fontSize: `${fontSize * 0.98}px`,
                                          transform: `rotate(${rotation}deg)`,
                                        }}
                                      >
                                        {text || "WATERMARK"}
                                      </span>
                                    ) : imageBase64 ? (
                                      <img
                                        src={imageBase64}
                                        alt="Watermark"
                                        className="w-24 h-24 object-contain"
                                        style={{ opacity, transform: `rotate(${rotation}deg)` }}
                                      />
                                    ) : null}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              /* 9-Point Grid Positioned */
                              (() => {
                                const align = getGridAlignment(position);
                                return (
                                  <div
                                    className="w-full h-full flex transition-all duration-150 ease-out"
                                    style={{
                                      justifyContent: align.justify,
                                      alignItems: align.align,
                                      padding: align.p,
                                    }}
                                  >
                                    {type === "text" ? (
                                      <span
                                        className="tracking-wider text-center select-none transition-all duration-150"
                                        style={{
                                          opacity,
                                          color,
                                          fontFamily: fontFamily === "Times-Roman" ? "Times New Roman, serif" : fontFamily === "Courier" ? "Courier New, monospace" : "Helvetica, Arial, sans-serif",
                                          fontWeight: isBold ? 800 : 400,
                                          fontStyle: isItalic ? "italic" : "normal",
                                          textDecoration: isUnderline ? "underline" : "none",
                                          fontSize: `${fontSize * 0.98}px`,
                                          transform: `rotate(${rotation}deg)`,
                                          lineHeight: 1.15,
                                          maxWidth: "90%",
                                          wordBreak: "break-word",
                                        }}
                                      >
                                        {text || "WATERMARK"}
                                      </span>
                                    ) : imageBase64 ? (
                                      <img
                                        src={imageBase64}
                                        alt="Watermark"
                                        className="w-48 h-48 object-contain transition-opacity select-none"
                                        style={{ opacity, transform: `rotate(${rotation}deg)` }}
                                      />
                                    ) : (
                                      <div
                                        className="w-36 h-36 rounded-xl border-2 border-dashed border-neutral-400 flex flex-col items-center justify-center p-3 text-center"
                                        style={{ opacity }}
                                      >
                                        <Upload className="w-6 h-6 text-neutral-500 mb-1" />
                                        <span className="text-[11px] font-bold text-neutral-600">
                                          Upload Image
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                );
                              })()
                            )}
                          </div>
                        )}

                        {/* Subtle Page Indicator in viewer corner */}
                        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/40 text-white text-[10px] font-medium backdrop-blur-xs select-none pointer-events-none">
                          {p.pageNumber} / {pages.length}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div
                    className="relative bg-white text-neutral-900 shadow-xl rounded-none border border-neutral-300 dark:border-neutral-700 overflow-hidden select-none"
                    style={{
                      width: "600px",
                      maxWidth: "100%",
                      aspectRatio: "1 / 1.4142",
                    }}
                  >
                    <div className="w-full h-full p-8 flex flex-col justify-between bg-white text-neutral-400">
                      <div className="flex items-center gap-2 border-b border-neutral-200 pb-3">
                        <FileText className="w-5 h-5 text-neutral-400" />
                        <div className="h-3 w-32 bg-neutral-200 rounded" />
                      </div>
                      <div className="space-y-4 py-8">
                        <div className="h-3 w-3/4 bg-neutral-200 rounded" />
                        <div className="h-3 w-full bg-neutral-200 rounded" />
                        <div className="h-3 w-5/6 bg-neutral-200 rounded" />
                      </div>
                      <div className="border-t border-neutral-200 pt-3 flex justify-between text-xs text-neutral-400">
                        <span>Page 1</span>
                        <span>Document</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
        </ToolLayout>
      )}
    </div>
  );
}
