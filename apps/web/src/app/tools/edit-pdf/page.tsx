"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Header } from "@/components/layout-shell";
import {
  FileDropZone,
  ResultCard,
  ErrorAlert,
} from "@/components/shared";
import { toast } from "sonner";
import {
  ChevronRight,
  RefreshCcw,
  Type,
  Highlighter,
  Pencil,
  Square,
  Circle,
  Eraser,
  Undo2,
  Redo2,
  Save,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  Sparkles,
} from "lucide-react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

type AnnotationType = "text" | "highlight" | "draw" | "rectangle" | "circle";

interface Annotation {
  id: string;
  type: AnnotationType;
  page: number;
  x: number;
  y: number;
  width?: number;
  height?: number;
  text?: string;
  points?: { x: number; y: number }[];
  color: string;
  strokeWidth: number;
  fontSize: number;
  opacity?: number;
}

export default function EditPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<"annotate" | "edit">("annotate");
  const [activeTool, setActiveTool] = useState<AnnotationType | "eraser">("draw");

  // Annotation options
  const [color, setColor] = useState<string>("#ef4444");
  const [strokeWidth, setStrokeWidth] = useState<number>(3);
  const [fontSize, setFontSize] = useState<number>(18);
  const [textInput, setTextInput] = useState<string>("Sample Text");

  // PDF & Page state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [numPages, setNumPages] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [pdfDocProxy, setPdfDocProxy] = useState<any>(null);

  // Annotations & History
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [history, setHistory] = useState<Annotation[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Drawing state
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [currentPoints, setCurrentPoints] = useState<{ x: number; y: number }[]>([]);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);

  // Process / Result state
  const [status, setStatus] = useState<"idle" | "editing" | "processing" | "completed" | "failed">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resultData, setResultData] = useState<{
    downloadUrl: string;
    resultSize: number;
    filename: string;
  } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Initialize PDF.js
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
        setStatus("editing");
      } catch (err: any) {
        console.error("Failed to load PDF:", err);
        setErrorMessage("Failed to load PDF file preview.");
      }
    }

    loadPdf();
    return () => {
      active = false;
    };
  }, [file]);

  // Render Current PDF Page
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
          redrawAnnotations();
        }

        renderTask = page.render({
          canvasContext: context,
          viewport: viewport,
        });
        await renderTask.promise;
      } catch (err: any) {
        if (err?.name !== "RenderingCancelledException") {
          console.error("Error rendering PDF page:", err);
        }
      }
    }

    renderPage();
    return () => {
      if (renderTask) renderTask.cancel();
    };
  }, [pdfDocProxy, currentPage, scale]);

  // Redraw annotations on overlay canvas
  const redrawAnnotations = () => {
    const canvas = overlayRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const pageAnnots = annotations.filter((a) => a.page === currentPage);
    for (const annot of pageAnnots) {
      ctx.save();
      ctx.strokeStyle = annot.color;
      ctx.fillStyle = annot.color;
      ctx.lineWidth = annot.strokeWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (annot.type === "draw" && annot.points && annot.points.length > 0) {
        ctx.beginPath();
        ctx.moveTo(annot.points[0].x * scale, annot.points[0].y * scale);
        for (let i = 1; i < annot.points.length; i++) {
          ctx.lineTo(annot.points[i].x * scale, annot.points[i].y * scale);
        }
        ctx.stroke();
      } else if (annot.type === "highlight") {
        ctx.globalAlpha = annot.opacity || 0.35;
        ctx.fillRect(
          annot.x * scale,
          annot.y * scale,
          (annot.width || 50) * scale,
          (annot.height || 20) * scale
        );
      } else if (annot.type === "rectangle") {
        ctx.strokeRect(
          annot.x * scale,
          annot.y * scale,
          (annot.width || 50) * scale,
          (annot.height || 50) * scale
        );
      } else if (annot.type === "circle") {
        const rx = Math.abs((annot.width || 40) / 2) * scale;
        const ry = Math.abs((annot.height || 40) / 2) * scale;
        const cx = (annot.x + (annot.width || 40) / 2) * scale;
        const cy = (annot.y + (annot.height || 40) / 2) * scale;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (annot.type === "text") {
        ctx.font = `${annot.fontSize * scale}px sans-serif`;
        ctx.fillText(
          annot.text || "",
          annot.x * scale,
          (annot.y + annot.fontSize) * scale
        );
      }
      ctx.restore();
    }
  };

  useEffect(() => {
    redrawAnnotations();
  }, [annotations, currentPage, scale]);

  const pushState = (newAnnots: Annotation[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newAnnots);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setAnnotations(newAnnots);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setAnnotations(history[historyIndex - 1]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setAnnotations(history[historyIndex + 1]);
    }
  };

  // Canvas Mouse / Pointer Interaction
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = overlayRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (mode === "edit") return;
    const { x, y } = getCanvasCoords(e);

    if (activeTool === "eraser") {
      const remaining = annotations.filter((a) => {
        if (a.page !== currentPage) return true;
        const dist = Math.hypot(a.x - x, a.y - y);
        return dist > 30;
      });
      if (remaining.length !== annotations.length) {
        pushState(remaining);
      }
      return;
    }

    if (activeTool === "text") {
      const newAnnot: Annotation = {
        id: Math.random().toString(36).substring(7),
        type: "text",
        page: currentPage,
        x,
        y,
        text: textInput || "Text",
        color,
        strokeWidth,
        fontSize,
      };
      pushState([...annotations, newAnnot]);
      return;
    }

    setIsDrawing(true);
    setDragStart({ x, y });

    if (activeTool === "draw") {
      setCurrentPoints([{ x, y }]);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || mode === "edit") return;
    const { x, y } = getCanvasCoords(e);

    if (activeTool === "draw") {
      setCurrentPoints((prev) => [...prev, { x, y }]);
      const canvas = overlayRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = "round";
      ctx.beginPath();
      if (currentPoints.length > 0) {
        ctx.moveTo(
          currentPoints[currentPoints.length - 1].x * scale,
          currentPoints[currentPoints.length - 1].y * scale
        );
        ctx.lineTo(x * scale, y * scale);
        ctx.stroke();
      }
      ctx.restore();
    } else if (dragStart && (activeTool === "rectangle" || activeTool === "circle" || activeTool === "highlight")) {
      redrawAnnotations();
      const canvas = overlayRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const w = x - dragStart.x;
      const h = y - dragStart.y;

      ctx.save();
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = strokeWidth;

      if (activeTool === "highlight") {
        ctx.globalAlpha = 0.35;
        ctx.fillRect(
          Math.min(dragStart.x, x) * scale,
          Math.min(dragStart.y, y) * scale,
          Math.abs(w) * scale,
          Math.abs(h) * scale
        );
      } else if (activeTool === "rectangle") {
        ctx.strokeRect(
          Math.min(dragStart.x, x) * scale,
          Math.min(dragStart.y, y) * scale,
          Math.abs(w) * scale,
          Math.abs(h) * scale
        );
      } else if (activeTool === "circle") {
        const rx = (Math.abs(w) / 2) * scale;
        const ry = (Math.abs(h) / 2) * scale;
        const cx = (dragStart.x + w / 2) * scale;
        const cy = (dragStart.y + h / 2) * scale;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
        ctx.stroke();
      }
      ctx.restore();
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || mode === "edit") return;
    setIsDrawing(false);
    const { x, y } = getCanvasCoords(e);

    if (activeTool === "draw") {
      if (currentPoints.length > 1) {
        const newAnnot: Annotation = {
          id: Math.random().toString(36).substring(7),
          type: "draw",
          page: currentPage,
          x: currentPoints[0].x,
          y: currentPoints[0].y,
          points: currentPoints,
          color,
          strokeWidth,
          fontSize,
        };
        pushState([...annotations, newAnnot]);
      }
      setCurrentPoints([]);
    } else if (dragStart) {
      const w = x - dragStart.x;
      const h = y - dragStart.y;
      if (Math.abs(w) > 5 || Math.abs(h) > 5) {
        const newAnnot: Annotation = {
          id: Math.random().toString(36).substring(7),
          type: activeTool as AnnotationType,
          page: currentPage,
          x: Math.min(dragStart.x, x),
          y: Math.min(dragStart.y, y),
          width: Math.abs(w),
          height: Math.abs(h),
          color,
          strokeWidth,
          fontSize,
          opacity: activeTool === "highlight" ? 0.35 : 1,
        };
        pushState([...annotations, newAnnot]);
      }
      setDragStart(null);
    }
  };

  // Save changes & download PDF
  const handleSaveChanges = async () => {
    if (!file) return;

    setStatus("processing");
    try {
      const fileBytes = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(fileBytes);
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

      // Apply annotations to each page
      const pages = pdfDoc.getPages();

      for (const annot of annotations) {
        const pageIndex = annot.page - 1;
        if (pageIndex < 0 || pageIndex >= pages.length) continue;

        const targetPage = pages[pageIndex];
        const { height: pageHeight } = targetPage.getSize();

        const hex = annot.color.replace("#", "");
        const r = parseInt(hex.substring(0, 2), 16) / 255 || 0;
        const g = parseInt(hex.substring(2, 4), 16) / 255 || 0;
        const b = parseInt(hex.substring(4, 6), 16) / 255 || 0;

        if (annot.type === "text" && annot.text) {
          targetPage.drawText(annot.text, {
            x: annot.x,
            y: pageHeight - annot.y - annot.fontSize,
            size: annot.fontSize,
            font,
            color: rgb(r, g, b),
          });
        } else if (annot.type === "highlight") {
          targetPage.drawRectangle({
            x: annot.x,
            y: pageHeight - annot.y - (annot.height || 20),
            width: annot.width || 60,
            height: annot.height || 20,
            color: rgb(r, g, b),
            opacity: annot.opacity || 0.35,
          });
        } else if (annot.type === "rectangle") {
          targetPage.drawRectangle({
            x: annot.x,
            y: pageHeight - annot.y - (annot.height || 50),
            width: annot.width || 50,
            height: annot.height || 50,
            borderColor: rgb(r, g, b),
            borderWidth: annot.strokeWidth,
          });
        } else if (annot.type === "circle") {
          const rx = (annot.width || 40) / 2;
          const ry = (annot.height || 40) / 2;
          targetPage.drawEllipse({
            x: annot.x + rx,
            y: pageHeight - annot.y - ry,
            xScale: rx,
            yScale: ry,
            borderColor: rgb(r, g, b),
            borderWidth: annot.strokeWidth,
          });
        } else if (annot.type === "draw" && annot.points && annot.points.length > 1) {
          for (let i = 0; i < annot.points.length - 1; i++) {
            const p1 = annot.points[i];
            const p2 = annot.points[i + 1];
            targetPage.drawLine({
              start: { x: p1.x, y: pageHeight - p1.y },
              end: { x: p2.x, y: pageHeight - p2.y },
              thickness: annot.strokeWidth,
              color: rgb(r, g, b),
            });
          }
        }
      }

      const modifiedPdfBytes = await pdfDoc.save();
      const blob = new Blob([new Uint8Array(modifiedPdfBytes)], { type: "application/pdf" });
      const downloadUrl = URL.createObjectURL(blob);
      const filename = file.name.replace(/\.[^/.]+$/, "") + "-edited.pdf";

      setResultData({
        downloadUrl,
        resultSize: blob.size,
        filename,
      });

      setStatus("completed");
      toast.success("PDF changes saved successfully!");
    } catch (err: any) {
      console.error("Save error:", err);
      setErrorMessage(err.message || "Failed to save edited PDF");
      setStatus("failed");
    }
  };

  const handleReset = () => {
    setFile(null);
    setPdfDocProxy(null);
    setAnnotations([]);
    setHistory([[]]);
    setHistoryIndex(0);
    setStatus("idle");
    setResultData(null);
    setErrorMessage(null);
  };

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
          <span className="text-foreground">Edit PDF</span>
        </div>

        {status === "idle" && (
          <div className="flex-1 flex flex-col justify-center items-center py-12">
            <div className="text-center max-w-xl mb-8">
              <h1 className="text-4xl font-bold tracking-tight text-foreground mb-3">
                Edit PDF
              </h1>
              <p className="text-muted-foreground text-sm">
                Add annotations, highlights, drawings, and shapes to your PDF directly in your browser.
              </p>
            </div>

            <div className="w-full max-w-xl">
              <FileDropZone
                accept="application/pdf"
                maxFiles={1}
                maxSizeMB={100}
                onFiles={(files: File[]) => {
                  if (files.length > 0) setFile(files[0]);
                }}
              />
            </div>
          </div>
        )}

        {(status === "editing" || status === "processing") && (
          <div className="flex-1 flex flex-col gap-4">
            {/* Top Toolbar: Mode Switch & Page Nav */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-card border border-border rounded-xl">
              <div className="flex items-center gap-2">
                {/* Mode Selector */}
                <div className="flex bg-muted p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setMode("annotate")}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                      mode === "annotate"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Annotate
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("edit")}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                      mode === "edit"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Edit (Text)
                  </button>
                </div>

                <div className="h-4 w-px bg-border mx-1" />

                {/* Page Navigation */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-40 rounded-lg hover:bg-muted"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-medium">
                    {currentPage} / {numPages}
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

                <div className="h-4 w-px bg-border mx-1" />

                {/* Zoom */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setScale((s) => Math.max(0.6, s - 0.1))}
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
                    onClick={() => setScale((s) => Math.min(2.0, s + 0.1))}
                    className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted"
                    title="Zoom in"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Undo / Redo */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={historyIndex <= 0}
                  onClick={handleUndo}
                  className="p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-40 rounded-lg hover:bg-muted"
                  title="Undo"
                >
                  <Undo2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={historyIndex >= history.length - 1}
                  onClick={handleRedo}
                  className="p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-40 rounded-lg hover:bg-muted"
                  title="Redo"
                >
                  <Redo2 className="w-4 h-4" />
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

            {/* 2-Column Workspace: Left Canvas, Right Property Panel */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[600px]">
              {/* Left Column: Canvas Viewport */}
              <div
                ref={containerRef}
                className="lg:col-span-3 bg-muted/40 border border-border rounded-xl p-4 overflow-auto flex items-center justify-center relative min-h-[500px]"
              >
                {mode === "edit" ? (
                  <div className="flex flex-col items-center justify-center text-center p-8 max-w-md bg-card/80 border border-border rounded-xl backdrop-blur-sm">
                    <Sparkles className="w-10 h-10 text-primary mb-3 animate-pulse" />
                    <h3 className="text-lg font-bold mb-1">Direct PDF Text Editing</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                      Direct text layer replacement engine (Aspose.PDF FOSS) is preparing for general release. Use <strong>Annotate Mode</strong> above to add text overlays, highlights, shapes, and freehand drawing right now!
                    </p>
                    <button
                      type="button"
                      onClick={() => setMode("annotate")}
                      className="px-4 py-2 bg-foreground text-background text-xs font-semibold rounded-lg hover:opacity-95 transition-opacity"
                    >
                      Switch to Annotate Mode
                    </button>
                  </div>
                ) : (
                  <div className="relative shadow-md rounded-md overflow-hidden bg-white">
                    <canvas ref={canvasRef} className="block" />
                    <canvas
                      ref={overlayRef}
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      className="absolute inset-0 cursor-crosshair"
                    />
                  </div>
                )}
              </div>

              {/* Right Column: Tools & Properties Panel */}
              <div className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between">
                <div className="flex flex-col gap-6">
                  <div>
                    <h3 className="text-sm font-bold text-foreground mb-1">
                      {mode === "annotate" ? "Annotation Tools" : "Edit Properties"}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Select tool and adjust styling properties
                    </p>
                  </div>

                  {mode === "annotate" && (
                    <>
                      {/* Tool Buttons Grid */}
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveTool("draw")}
                          className={`flex flex-col items-center gap-1.5 p-2.5 rounded-lg border text-xs font-medium transition-colors ${
                            activeTool === "draw"
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border hover:bg-muted text-muted-foreground"
                          }`}
                        >
                          <Pencil className="w-4 h-4" />
                          <span>Draw</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveTool("highlight")}
                          className={`flex flex-col items-center gap-1.5 p-2.5 rounded-lg border text-xs font-medium transition-colors ${
                            activeTool === "highlight"
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border hover:bg-muted text-muted-foreground"
                          }`}
                        >
                          <Highlighter className="w-4 h-4" />
                          <span>Highlight</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveTool("text")}
                          className={`flex flex-col items-center gap-1.5 p-2.5 rounded-lg border text-xs font-medium transition-colors ${
                            activeTool === "text"
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border hover:bg-muted text-muted-foreground"
                          }`}
                        >
                          <Type className="w-4 h-4" />
                          <span>Text</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveTool("rectangle")}
                          className={`flex flex-col items-center gap-1.5 p-2.5 rounded-lg border text-xs font-medium transition-colors ${
                            activeTool === "rectangle"
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border hover:bg-muted text-muted-foreground"
                          }`}
                        >
                          <Square className="w-4 h-4" />
                          <span>Square</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveTool("circle")}
                          className={`flex flex-col items-center gap-1.5 p-2.5 rounded-lg border text-xs font-medium transition-colors ${
                            activeTool === "circle"
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border hover:bg-muted text-muted-foreground"
                          }`}
                        >
                          <Circle className="w-4 h-4" />
                          <span>Circle</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveTool("eraser")}
                          className={`flex flex-col items-center gap-1.5 p-2.5 rounded-lg border text-xs font-medium transition-colors ${
                            activeTool === "eraser"
                              ? "border-destructive bg-destructive/10 text-destructive"
                              : "border-border hover:bg-muted text-muted-foreground"
                          }`}
                        >
                          <Eraser className="w-4 h-4" />
                          <span>Eraser</span>
                        </button>
                      </div>

                      {/* Tool Properties */}
                      <div className="flex flex-col gap-4 border-t border-border pt-4">
                        {/* Color Picker */}
                        <div className="flex flex-col gap-2">
                          <label className="text-xs font-semibold text-foreground">
                            Color
                          </label>
                          <div className="flex items-center gap-2">
                            {["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#000000"].map((c) => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => setColor(c)}
                                style={{ backgroundColor: c }}
                                className={`w-6 h-6 rounded-full border-2 transition-transform ${
                                  color === c ? "scale-110 border-white ring-2 ring-primary" : "border-transparent"
                                }`}
                              />
                            ))}
                            <input
                              type="color"
                              value={color}
                              onChange={(e) => setColor(e.target.value)}
                              className="w-7 h-7 rounded border-0 cursor-pointer bg-transparent"
                            />
                          </div>
                        </div>

                        {/* Stroke Width Slider */}
                        {(activeTool === "draw" || activeTool === "rectangle" || activeTool === "circle") && (
                          <div className="flex flex-col gap-1.5">
                            <div className="flex justify-between text-xs">
                              <span className="font-semibold text-foreground">Stroke Thickness</span>
                              <span className="text-muted-foreground">{strokeWidth}px</span>
                            </div>
                            <input
                              type="range"
                              min="1"
                              max="12"
                              value={strokeWidth}
                              onChange={(e) => setStrokeWidth(Number(e.target.value))}
                              className="w-full accent-primary cursor-pointer"
                            />
                          </div>
                        )}

                        {/* Text Input & Font Size */}
                        {activeTool === "text" && (
                          <div className="flex flex-col gap-3">
                            <div className="flex flex-col gap-1">
                              <label className="text-xs font-semibold text-foreground">Text Content</label>
                              <input
                                type="text"
                                value={textInput}
                                onChange={(e) => setTextInput(e.target.value)}
                                placeholder="Click canvas to place text"
                                className="w-full px-3 py-1.5 text-xs bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <div className="flex justify-between text-xs">
                                <span className="font-semibold text-foreground">Font Size</span>
                                <span className="text-muted-foreground">{fontSize}px</span>
                              </div>
                              <input
                                type="range"
                                min="10"
                                max="48"
                                value={fontSize}
                                onChange={(e) => setFontSize(Number(e.target.value))}
                                className="w-full accent-primary cursor-pointer"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Save Changes Button */}
                <div className="pt-6 border-t border-border flex flex-col gap-2">
                  <button
                    type="button"
                    disabled={status === "processing"}
                    onClick={handleSaveChanges}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-foreground text-background font-semibold text-xs rounded-xl hover:opacity-95 disabled:opacity-50 transition-opacity"
                  >
                    <Save className="w-4 h-4" />
                    <span>{status === "processing" ? "Saving..." : "Save changes"}</span>
                  </button>
                  <p className="text-[11px] text-muted-foreground text-center">
                    Bakes all annotations into a clean, downloadable PDF.
                  </p>
                </div>
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
            <ErrorAlert message={errorMessage} onRetry={() => setErrorMessage(null)} />
          </div>
        )}
      </main>
    </div>
  );
}
