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
import {
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  RefreshCcw,
  Bold,
  Italic,
  Underline,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

type GridPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "middle-left"
  | "middle-center"
  | "middle-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export default function AddPageNumbersPage() {
  const [file, setFile] = useState<File | null>(null);

  // PRD 12 Options
  const [pageMode, setPageMode] = useState<"single" | "facing">("single");
  const [firstPageCover, setFirstPageCover] = useState<boolean>(false);
  const [position, setPosition] = useState<GridPosition>("bottom-right");
  const [margin, setMargin] = useState<"small" | "recommended" | "big">("recommended");
  const [startNumber, setStartNumber] = useState<number>(1);
  const [fromPage, setFromPage] = useState<number>(1);
  const [toPage, setToPage] = useState<number | "">("");

  const [textFormat, setTextFormat] = useState<
    "only-number" | "page-n" | "page-n-of-p" | "custom"
  >("only-number");
  const [customText, setCustomText] = useState<string>("- {n} -");

  // Font styling
  const [font, setFont] = useState<"Arial" | "Times-Roman" | "Courier">("Arial");
  const [fontSize, setFontSize] = useState<number>(12);
  const [isBold, setIsBold] = useState<boolean>(false);
  const [isItalic, setIsItalic] = useState<boolean>(false);
  const [isUnderline, setIsUnderline] = useState<boolean>(false);
  const [color, setColor] = useState<string>("#000000");

  const [outputBaseName, setOutputBaseName] = useState<string>("numbered");

  // PDF Preview & Canvas
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [numPages, setNumPages] = useState<number>(1);
  const [scale, setScale] = useState<number>(0.85);
  const [pdfDocProxy, setPdfDocProxy] = useState<any>(null);

  // Status & Job
  const [status, setStatus] = useState<"idle" | "configuring" | "processing" | "completed" | "failed">("idle");
  const [jobId, setJobId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resultData, setResultData] = useState<{
    downloadUrl: string;
    resultSize: number;
    filename: string;
  } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayRef = useRef<HTMLCanvasElement | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load PDF with PDF.js
  useEffect(() => {
    if (!file) return;

    let active = true;
    async function loadPdf() {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

        const arrayBuffer = await file!.arrayBuffer();
        const loadedPdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        if (!active) return;

        setPdfDocProxy(loadedPdf);
        setNumPages(loadedPdf.numPages);
        setCurrentPage(1);
        setToPage(loadedPdf.numPages);
        setStatus("configuring");
      } catch (err: any) {
        console.error("Failed to load PDF:", err);
        setErrorMessage("Failed to load PDF preview.");
      }
    }

    loadPdf();
    return () => {
      active = false;
    };
  }, [file]);

  // Render Base PDF Page on Canvas
  useEffect(() => {
    if (!pdfDocProxy || !canvasRef.current) return;

    let renderTask: any = null;
    async function renderPage() {
      try {
        const page = await pdfDocProxy.getPage(currentPage);
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext("2d");
        if (!context) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        if (overlayRef.current) {
          overlayRef.current.width = viewport.width;
          overlayRef.current.height = viewport.height;
        }

        renderTask = page.render({
          canvasContext: context,
          viewport: viewport,
        });
        await renderTask.promise;
        drawLivePreview();
      } catch (err: any) {
        if (err?.name !== "RenderingCancelledException") {
          console.error("Render error:", err);
        }
      }
    }

    renderPage();
    return () => {
      if (renderTask) renderTask.cancel();
    };
  }, [pdfDocProxy, currentPage, scale]);

  // Live Preview Drawing
  const drawLivePreview = () => {
    const canvas = overlayRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const endPage = typeof toPage === "number" ? toPage : numPages;

    // Check if current page is within numbered range
    if (pageMode === "facing" && firstPageCover && currentPage === 1) {
      return;
    }
    if (currentPage < fromPage || currentPage > endPage) {
      return;
    }

    // Determine current page's number value
    let numVal: number;
    if (pageMode === "facing" && firstPageCover) {
      numVal = startNumber + (currentPage - 2);
    } else {
      numVal = startNumber + (currentPage - fromPage);
    }

    // Determine label text
    let label = "";
    if (textFormat === "only-number") {
      label = `${numVal}`;
    } else if (textFormat === "page-n") {
      label = `Page ${numVal}`;
    } else if (textFormat === "page-n-of-p") {
      label = `Page ${numVal} of ${numPages}`;
    } else if (textFormat === "custom") {
      label = customText.replace("{n}", String(numVal)).replace("{p}", String(numPages));
    } else {
      label = `Page ${numVal}`;
    }

    // Font style
    let fontStyle = "";
    if (isItalic) fontStyle += "italic ";
    if (isBold) fontStyle += "bold ";
    const resolvedFont = font === "Times-Roman" ? "Times New Roman" : font;
    const scaledFontSize = Math.max(8, fontSize * scale);
    ctx.font = `${fontStyle}${scaledFontSize}px ${resolvedFont}, sans-serif`;
    ctx.fillStyle = color;

    // Margin offsets (scaled)
    let marginPx = 28 * scale;
    if (margin === "small") marginPx = 15 * scale;
    if (margin === "big") marginPx = 45 * scale;

    const textMetrics = ctx.measureText(label);
    const textWidth = textMetrics.width;

    // Facing pages alternate left/right
    let activePos = position;
    if (pageMode === "facing") {
      const isEven = currentPage % 2 === 0;
      if (position.includes("left") && isEven) {
        activePos = position.replace("left", "right") as GridPosition;
      } else if (position.includes("right") && isEven) {
        activePos = position.replace("right", "left") as GridPosition;
      }
    }

    // Calculate X coordinate
    let x = 0;
    if (activePos.includes("left")) {
      x = marginPx;
    } else if (activePos.includes("right")) {
      x = canvas.width - textWidth - marginPx;
    } else {
      x = (canvas.width - textWidth) / 2;
    }

    // Calculate Y coordinate
    let y = 0;
    if (activePos.includes("top")) {
      y = marginPx + scaledFontSize;
    } else if (activePos.includes("bottom")) {
      y = canvas.height - marginPx;
    } else {
      y = (canvas.height + scaledFontSize / 2) / 2;
    }

    // Draw preview box outline / badge to guide user
    ctx.save();
    ctx.fillStyle = "rgba(59, 130, 246, 0.15)";
    ctx.strokeStyle = "rgba(59, 130, 246, 0.8)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(x - 6, y - scaledFontSize - 3, textWidth + 12, scaledFontSize + 8);
    ctx.fillRect(x - 6, y - scaledFontSize - 3, textWidth + 12, scaledFontSize + 8);
    ctx.restore();

    ctx.fillText(label, x, y);

    if (isUnderline) {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1 * scale;
      ctx.moveTo(x, y + 2);
      ctx.lineTo(x + textWidth, y + 2);
      ctx.stroke();
    }
  };

  // Re-trigger live preview on any option change
  useEffect(() => {
    drawLivePreview();
  }, [
    pageMode,
    firstPageCover,
    position,
    margin,
    startNumber,
    fromPage,
    toPage,
    textFormat,
    customText,
    font,
    fontSize,
    isBold,
    isItalic,
    isUnderline,
    color,
    currentPage,
    scale,
  ]);

  const handleFileSelected = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setErrorMessage(null);
      const nameWithoutExt = files[0].name.replace(/\.[^/.]+$/, "");
      setOutputBaseName(`${nameWithoutExt}-numbered`);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPdfDocProxy(null);
    setStatus("idle");
    setJobId(null);
    setErrorMessage(null);
    setResultData(null);
    setPosition("bottom-right");
    setPageMode("single");
    setFirstPageCover(false);
    setMargin("recommended");
    setStartNumber(1);
    setFromPage(1);
    setTextFormat("only-number");
  };

  // Poll Job Status
  const pollJobStatus = (id: string) => {
    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/jobs/${id}`);
        if (!res.ok) {
          const errMsg = await parseApiError(res, "Failed to poll job status");
          throw new Error(errMsg);
        }
        const data = await res.json();
        if (data.status === "completed") {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          setStatus("completed");
          setResultData({
            downloadUrl: `${API_BASE}${data.result_url}`,
            resultSize: data.result_size || 0,
            filename: `${outputBaseName}.pdf`,
          });
          toast.success("Page numbers added successfully!");
        } else if (data.status === "failed") {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          setStatus("failed");
          setErrorMessage(data.error_message || "Processing failed");
          toast.error("Processing failed");
        }
      } catch (err: any) {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        setStatus("failed");
        setErrorMessage(err.message || "Network error while polling");
      }
    }, 1000);
  };

  // Submit Job to Worker
  const handleSubmit = async () => {
    if (!file) return;

    setStatus("processing");
    setErrorMessage(null);

    try {
      // 1. Get Presigned Upload URL
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
        const errMsg = await parseApiError(signRes, "Failed to initialize upload");
        throw new Error(errMsg);
      }
      const { uploadUrl, fileKey } = await signRes.json();

      // 2. Upload file to Storage
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/pdf" },
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error("Failed to upload document file");
      }

      // 3. Create Job
      const payloadOptions = {
        pageMode,
        firstPageCover,
        position,
        margin,
        startNumber,
        fromPage,
        toPage: typeof toPage === "number" ? toPage : numPages,
        format: textFormat,
        customText,
        font,
        size: fontSize,
        isBold,
        isItalic,
        isUnderline,
        color,
        outputFilename: `${outputBaseName}.pdf`,
      };

      const jobRes = await fetch(`${API_BASE}/api/v1/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "add-page-numbers",
          files: [
            {
              url: fileKey,
              name: file.name,
              size: file.size,
            },
          ],
          options: payloadOptions,
        }),
      });

      if (!jobRes.ok) {
        const errMsg = await parseApiError(jobRes, "Failed to create processing task");
        throw new Error(errMsg);
      }

      const jobData = await jobRes.json();
      setJobId(jobData.jobId);
      pollJobStatus(jobData.jobId);
    } catch (err: any) {
      setStatus("failed");
      setErrorMessage(err.message || "Failed to process PDF");
      toast.error(err.message || "Failed to process PDF");
    }
  };

  const gridPositions: GridPosition[] = [
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
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />

      <main className="flex-1 w-full max-w-[1600px] mx-auto px-6 py-8 flex flex-col">
        {/* Breadcrumb Header */}
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-6">
          <Link href="/" className="hover:text-foreground transition-colors">
            Tools
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground">Page Numbers</span>
        </div>

        {status === "idle" && (
          <div className="flex-1 flex flex-col justify-center items-center py-12">
            <div className="text-center max-w-xl mb-8">
              <h1 className="text-4xl font-bold tracking-tight text-foreground mb-3">
                Add Page Numbers
              </h1>
              <p className="text-muted-foreground text-sm">
                Insert customizable page numbers, choose margins, position on a visual 3x3 grid, and preview live.
              </p>
            </div>

            <div className="w-full max-w-xl">
              <FileDropZone
                accept="application/pdf"
                maxFiles={1}
                maxSizeMB={100}
                onFiles={handleFileSelected}
              />
            </div>
          </div>
        )}

        {(status === "configuring" || status === "processing") && (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left 7 Cols: Live Canvas Viewport */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              {/* Canvas Toolbar */}
              <div className="flex items-center justify-between p-3 bg-card border border-border rounded-xl">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-40 rounded-lg hover:bg-muted"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-semibold">
                    Page {currentPage} of {numPages}
                  </span>
                  <button
                    type="button"
                    disabled={currentPage >= numPages}
                    onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
                    className="p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-40 rounded-lg hover:bg-muted"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setScale((s) => Math.max(0.5, s - 0.1))}
                    className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted"
                    title="Zoom out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-medium w-12 text-center">
                    {Math.round(scale * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setScale((s) => Math.min(1.5, s + 0.1))}
                    className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted"
                    title="Zoom in"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted ml-2"
                    title="Change file"
                  >
                    <RefreshCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Viewport Canvas Container */}
              <div className="flex-1 bg-muted/40 border border-border rounded-xl p-6 overflow-auto flex items-center justify-center min-h-[550px]">
                <div className="relative shadow-md rounded-md overflow-hidden bg-white">
                  <canvas ref={canvasRef} className="block" />
                  <canvas ref={overlayRef} className="absolute inset-0 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Right 5 Cols: Options Panel (PRD 12 iLovePDF spec) */}
            <div className="lg:col-span-5 bg-card border border-border rounded-xl p-6 flex flex-col justify-between">
              <div className="flex flex-col gap-6 overflow-y-auto max-h-[750px] pr-1">
                {/* 1. Page Mode */}
                <div className="flex flex-col gap-2.5">
                  <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                    1. Page Mode
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPageMode("single")}
                      className={`p-3 text-xs font-semibold rounded-xl border text-center transition-colors ${
                        pageMode === "single"
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:bg-muted text-muted-foreground"
                      }`}
                    >
                      Single page
                    </button>
                    <button
                      type="button"
                      onClick={() => setPageMode("facing")}
                      className={`p-3 text-xs font-semibold rounded-xl border text-center transition-colors ${
                        pageMode === "facing"
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:bg-muted text-muted-foreground"
                      }`}
                    >
                      Facing pages
                    </button>
                  </div>
                  {pageMode === "facing" && (
                    <label className="flex items-center gap-2 mt-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={firstPageCover}
                        onChange={(e) => setFirstPageCover(e.target.checked)}
                        className="rounded border-border accent-primary"
                      />
                      <span className="text-xs text-muted-foreground">First page is cover page</span>
                    </label>
                  )}
                </div>

                {/* 2. Position (Visual 3x3 Grid) */}
                <div className="flex flex-col gap-2.5">
                  <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                    2. Position
                  </label>
                  <div className="w-36 h-36 grid grid-cols-3 grid-rows-3 gap-1.5 p-1.5 bg-muted rounded-xl border border-border">
                    {gridPositions.map((pos) => (
                      <button
                        key={pos}
                        type="button"
                        onClick={() => setPosition(pos)}
                        className={`rounded-lg transition-all border ${
                          position === pos
                            ? "bg-primary border-primary shadow-sm"
                            : "bg-card border-border/60 hover:border-primary/50"
                        }`}
                        title={pos}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] text-muted-foreground capitalize">
                    Active: {position.replace("-", " ")}
                  </span>
                </div>

                {/* 3. Margin */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                    3. Margin
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["small", "recommended", "big"] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMargin(m)}
                        className={`py-2 text-xs font-medium rounded-lg border capitalize transition-colors ${
                          margin === m
                            ? "border-primary bg-primary/10 text-primary font-semibold"
                            : "border-border hover:bg-muted text-muted-foreground"
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Pages (Range) */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                    4. Pages (Range)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] text-muted-foreground">First number</span>
                      <input
                        type="number"
                        min={1}
                        value={startNumber}
                        onChange={(e) => setStartNumber(Math.max(1, parseInt(e.target.value) || 1))}
                        className="px-2.5 py-1.5 text-xs bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] text-muted-foreground">From page</span>
                      <input
                        type="number"
                        min={1}
                        max={numPages}
                        value={fromPage}
                        onChange={(e) => setFromPage(Math.max(1, parseInt(e.target.value) || 1))}
                        className="px-2.5 py-1.5 text-xs bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] text-muted-foreground">To page</span>
                      <input
                        type="number"
                        min={1}
                        max={numPages}
                        value={toPage}
                        onChange={(e) => setToPage(e.target.value === "" ? "" : Number(e.target.value))}
                        className="px-2.5 py-1.5 text-xs bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                </div>

                {/* 5. Text Format */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                    5. Text Format
                  </label>
                  <CustomSelect
                    value={textFormat}
                    onChange={(val) => setTextFormat(val as any)}
                    options={[
                      { value: "only-number", label: "Insert only page number (e.g. 1)" },
                      { value: "page-n", label: "Page {n} (e.g. Page 1)" },
                      { value: "page-n-of-p", label: "Page {n} of {p} (e.g. Page 1 of 10)" },
                      { value: "custom", label: "Custom Format" },
                    ]}
                  />
                  {textFormat === "custom" && (
                    <input
                      type="text"
                      value={customText}
                      onChange={(e) => setCustomText(e.target.value)}
                      placeholder="e.g. - {n} - or Document Page {n}/{p}"
                      className="px-3 py-1.5 text-xs bg-muted border border-border rounded-lg text-foreground mt-1 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  )}
                </div>

                {/* 6. Font Format */}
                <div className="flex flex-col gap-3">
                  <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                    6. Font & Styling
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <CustomSelect
                      value={font}
                      onChange={(val) => setFont(val as any)}
                      options={[
                        { value: "Arial", label: "Arial / Helvetica" },
                        { value: "Times-Roman", label: "Times New Roman" },
                        { value: "Courier", label: "Courier Monospace" },
                      ]}
                    />
                    <CustomSelect
                      value={String(fontSize)}
                      onChange={(val) => setFontSize(Number(val))}
                      options={[
                        { value: "10", label: "10 pt" },
                        { value: "12", label: "12 pt" },
                        { value: "14", label: "14 pt" },
                        { value: "16", label: "16 pt" },
                        { value: "18", label: "18 pt" },
                        { value: "24", label: "24 pt" },
                      ]}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-1">
                    {/* B / I / U Toggles */}
                    <div className="flex items-center bg-muted p-1 rounded-lg border border-border">
                      <button
                        type="button"
                        onClick={() => setIsBold((b) => !b)}
                        className={`p-1.5 rounded-md transition-colors ${
                          isBold ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                        }`}
                        title="Bold"
                      >
                        <Bold className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsItalic((i) => !i)}
                        className={`p-1.5 rounded-md transition-colors ${
                          isItalic ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                        }`}
                        title="Italic"
                      >
                        <Italic className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsUnderline((u) => !u)}
                        className={`p-1.5 rounded-md transition-colors ${
                          isUnderline ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                        }`}
                        title="Underline"
                      >
                        <Underline className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Color Picker */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Color:</span>
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="w-7 h-7 rounded border-0 cursor-pointer bg-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-6 border-t border-border mt-4">
                <button
                  type="button"
                  disabled={status === "processing"}
                  onClick={handleSubmit}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-foreground text-background font-semibold text-xs rounded-xl hover:opacity-95 disabled:opacity-50 transition-opacity"
                >
                  <span>{status === "processing" ? "Adding numbers..." : "Add page numbers"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {status === "completed" && resultData && (
          <div className="flex-1 flex flex-col justify-center items-center py-12 max-w-xl mx-auto w-full">
            <ResultCard
              filename={resultData.filename}
              sizeBytes={resultData.resultSize}
              downloadUrl={resultData.downloadUrl}
              onReset={handleReset}
            />
          </div>
        )}

        {errorMessage && (
          <div className="mt-6 max-w-xl mx-auto w-full">
            <ErrorAlert message={errorMessage} onRetry={handleSubmit} />
          </div>
        )}
      </main>
    </div>
  );
}
