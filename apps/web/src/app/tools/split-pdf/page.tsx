"use client";

import { parseApiError } from "@/lib/api-client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { Header } from "@/components/layout-shell";
import {
  EmptyState,
  FileDropZone,
  ProgressCard,
  ResultCard,
  ErrorAlert,
} from "@/components/shared";
import { toast } from "sonner";
import { getAllPdfPagesPreviews } from "@/lib/pdf-all-pages";
import {
  ChevronRight,
  ArrowRight,
  RefreshCcw,
  Info,
  Loader2,
  Plus,
  Trash2,
  FileText,
  Copy,
  Layers,
  HardDrive,
  GripVertical,
} from "lucide-react";
import { HugeCheckCircle } from "@/components/icons";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export interface CustomRangeItem {
  id: string;
  from: number;
  to: number;
}

// Sortable Item Component for Custom Range Row
function SortableRangeRow({
  item,
  displayIndex,
  totalPages,
  canRemove,
  onUpdate,
  onRemove,
}: {
  item: CustomRangeItem;
  displayIndex: number;
  totalPages: number;
  canRemove: boolean;
  onUpdate: (id: string, field: "from" | "to", val: number) => void;
  onRemove: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between gap-2 p-3 rounded-2xl border border-border bg-card select-none"
    >
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="Drag range to reorder"
          className="h-7 w-6 flex items-center justify-center text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing rounded hover:bg-secondary/60 transition-colors"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <span className="text-xs font-bold text-foreground w-14">
          Range {displayIndex + 1}
        </span>
      </div>

      <div className="flex items-center gap-2 text-xs font-semibold">
        <span className="text-muted-foreground font-normal">from</span>
        <input
          type="number"
          min={1}
          max={totalPages}
          value={item.from}
          onChange={(e) => {
            const val = parseInt(e.target.value, 10);
            if (isNaN(val)) return;
            const boundedVal = Math.max(1, Math.min(item.to, val));
            onUpdate(item.id, "from", boundedVal);
          }}
          className="w-14 h-8 text-center rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-ring text-xs font-semibold"
        />
        <span className="text-muted-foreground font-normal">to</span>
        <input
          type="number"
          min={1}
          max={totalPages}
          value={item.to}
          onChange={(e) => {
            const val = parseInt(e.target.value, 10);
            if (isNaN(val)) return;
            const boundedVal = Math.min(totalPages, Math.max(item.from, val));
            onUpdate(item.id, "to", boundedVal);
          }}
          className="w-14 h-8 text-center rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-ring text-xs font-semibold"
        />
      </div>

      {canRemove && (
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          className="h-7 w-7 rounded-lg hover:bg-secondary text-muted-foreground hover:text-rose-500 flex items-center justify-center transition-colors cursor-pointer shrink-0"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

// Canvas Sortable Custom Range Container with isolated Label Drag Handle
function SortableCanvasRangeBox({
  range,
  displayIndex,
  totalPages,
  pageThumbnails,
  onUpdateRange,
}: {
  range: CustomRangeItem;
  displayIndex: number;
  totalPages: number;
  pageThumbnails: string[];
  onUpdateRange: (id: string, field: "from" | "to", val: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: range.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  const startVal = Math.max(1, Math.min(totalPages, range.from || 1));
  const endVal = Math.max(1, Math.min(totalPages, range.to || 1));
  const isSinglePage = startVal === endVal;
  const startThumb = pageThumbnails[startVal - 1];
  const endThumb = pageThumbnails[endVal - 1];
  const hasInvalidOrder = range.from > range.to;

  return (
    <div ref={setNodeRef} style={style} className="flex flex-col items-center gap-2 select-none">
      {/* Centered Range Title above box with Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        title="Drag label to reorder range"
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-border bg-card/80 hover:bg-secondary hover:border-primary/50 text-xs font-semibold text-foreground cursor-grab active:cursor-grabbing transition-colors group shadow-none"
      >
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
        <span>Range {displayIndex + 1}</span>
      </div>

      {/* Dashed group container */}
      <div
        className={`rounded-3xl border-2 border-dashed bg-card/40 p-4 sm:p-5 flex items-center gap-3 transition-colors shadow-none ${
          hasInvalidOrder ? "border-rose-500/70" : "border-border hover:border-primary/60"
        }`}
      >
        {/* Start Page Card */}
        <div
          className={`w-36 sm:w-40 flex flex-col rounded-2xl border bg-background overflow-hidden ${
            hasInvalidOrder ? "border-rose-500/50" : "border-border"
          }`}
        >
          <div className="relative aspect-[3/4] bg-muted/20 flex items-center justify-center p-2.5">
            {startThumb ? (
              <img
                src={startThumb}
                alt={`Page ${startVal}`}
                className="max-h-full max-w-full object-contain rounded-md border border-border/40 pointer-events-none"
              />
            ) : (
              <div className="text-xs text-muted-foreground">Page {startVal}</div>
            )}
          </div>
          <div className="h-9 px-2 bg-card border-t border-border flex items-center justify-center">
            <input
              type="number"
              min={1}
              max={totalPages}
              value={range.from}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (isNaN(val)) return;
                const boundedVal = Math.max(1, Math.min(range.to, val));
                onUpdateRange(range.id, "from", boundedVal);
              }}
              className="w-full h-7 text-center font-bold text-xs text-foreground bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-ring rounded-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none cursor-text select-text"
              title="Click to change start page"
            />
          </div>
        </div>

        {/* Ellipsis if range spans multiple pages */}
        {!isSinglePage && (
          <div className="flex items-center justify-center px-1 text-muted-foreground font-bold tracking-widest text-base select-none">
            •••
          </div>
        )}

        {/* End Page Card (if not single page) */}
        {!isSinglePage && (
          <div
            className={`w-36 sm:w-40 flex flex-col rounded-2xl border bg-background overflow-hidden ${
              hasInvalidOrder ? "border-rose-500/50" : "border-border"
            }`}
          >
            <div className="relative aspect-[3/4] bg-muted/20 flex items-center justify-center p-2.5">
              {endThumb ? (
                <img
                  src={endThumb}
                  alt={`Page ${endVal}`}
                  className="max-h-full max-w-full object-contain rounded-md border border-border/40 pointer-events-none"
                />
              ) : (
                <div className="text-xs text-muted-foreground">Page {endVal}</div>
              )}
            </div>
            <div className="h-9 px-2 bg-card border-t border-border flex items-center justify-center">
              <input
                type="number"
                min={1}
                max={totalPages}
                value={range.to}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (isNaN(val)) return;
                  const boundedVal = Math.min(totalPages, Math.max(range.from, val));
                  onUpdateRange(range.id, "to", boundedVal);
                }}
                className="w-full h-7 text-center font-bold text-xs text-foreground bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-ring rounded-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none cursor-text select-text"
                title="Click to change end page"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SplitPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [pageThumbnails, setPageThumbnails] = useState<string[]>([]);
  const [loadingPages, setLoadingPages] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState({ current: 0, total: 0 });

  // Main Split Tabs: "range" | "pages" | "size"
  const [activeTab, setActiveTab] = useState<"range" | "pages" | "size">("range");

  // Tab Range Settings:
  const [rangeMode, setRangeMode] = useState<"custom" | "fixed">("custom");
  const [customRanges, setCustomRanges] = useState<CustomRangeItem[]>([
    { id: "range-1", from: 1, to: 1 },
  ]);
  const [fixedInterval, setFixedInterval] = useState<number>(1);
  const [activeDragRangeId, setActiveDragRangeId] = useState<string | null>(null);

  const rangeSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleRangeDragStart = (event: DragStartEvent) => {
    setActiveDragRangeId(event.active.id as string);
  };

  const handleRangeDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setCustomRanges((prev) => {
        const oldIndex = prev.findIndex((item) => item.id === active.id);
        const newIndex = prev.findIndex((item) => item.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
    setActiveDragRangeId(null);
  };

  // Tab Pages (Extract) Settings:
  const [extractMode, setExtractMode] = useState<"all" | "select">("all");
  const [extractText, setExtractText] = useState<string>("");

  // Tab Size Settings:
  const [targetSizeKB, setTargetSizeKB] = useState<number>(500);

  // Output filename
  const [outputBaseName, setOutputBaseName] = useState("split");

  // Job & Processing state
  const [status, setStatus] = useState<"idle" | "processing" | "completed" | "failed">("idle");
  const [jobId, setJobId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resultData, setResultData] = useState<{
    downloadUrl: string;
    resultSize: number;
    filename: string;
  } | null>(null);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const totalPages = pageThumbnails.length;

  const handleFile = async (files: File[]) => {
    if (files.length === 0) return;
    const selectedFile = files[0];
    setFile(selectedFile);
    setErrorMessage(null);
    setLoadingPages(true);

    try {
      const thumbnails = await getAllPdfPagesPreviews(selectedFile, (curr, total) => {
        setLoadingProgress({ current: curr, total });
      });

      setPageThumbnails(thumbnails);
      const total = thumbnails.length;
      setCustomRanges([
        { id: `range-1`, from: 1, to: Math.min(total, 5) || 1 },
      ]);
      setExtractText(total > 1 ? `1, ${Math.min(total, 3)}` : "1");
    } catch {
      toast.error("Failed to render PDF pages");
      setFile(null);
    } finally {
      setLoadingPages(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPageThumbnails([]);
    setStatus("idle");
    setJobId(null);
    setErrorMessage(null);
    setResultData(null);
    setOutputBaseName("split");
    setCustomRanges([{ id: "range-1", from: 1, to: 1 }]);
    setRangeMode("custom");
    setExtractMode("all");
  };

  // Helper: serialize a Set of numbers into compact comma/range string (e.g. "1, 3, 5-8")
  const serializePageSet = (pagesSet: Set<number>): string => {
    const nums = Array.from(pagesSet).sort((a, b) => a - b);
    if (nums.length === 0) return "";
    const ranges: string[] = [];
    let start = nums[0];
    let end = nums[0];

    for (let i = 1; i < nums.length; i++) {
      if (nums[i] === end + 1) {
        end = nums[i];
      } else {
        ranges.push(start === end ? `${start}` : `${start}-${end}`);
        start = nums[i];
        end = nums[i];
      }
    }
    ranges.push(start === end ? `${start}` : `${start}-${end}`);
    return ranges.join(", ");
  };

  // Quick-select helpers for Pages Tab
  const handleSelectAllPages = () => {
    setExtractMode("select");
    const s = new Set<number>();
    for (let i = 1; i <= totalPages; i++) s.add(i);
    setExtractText(serializePageSet(s));
  };

  const handleSelectOddPages = () => {
    setExtractMode("select");
    const s = new Set<number>();
    for (let i = 1; i <= totalPages; i += 2) s.add(i);
    setExtractText(serializePageSet(s));
  };

  const handleSelectEvenPages = () => {
    setExtractMode("select");
    const s = new Set<number>();
    for (let i = 2; i <= totalPages; i += 2) s.add(i);
    setExtractText(serializePageSet(s));
  };
  const handleTogglePageCard = (pageNum: number) => {
    if (activeTab !== "pages") return;

    if (extractMode === "all") {
      // Switching from "all" to "select" with all pages except this one
      setExtractMode("select");
      const nextSet = new Set<number>();
      for (let i = 1; i <= totalPages; i++) {
        if (i !== pageNum) nextSet.add(i);
      }
      setExtractText(serializePageSet(nextSet));
    } else {
      const nextSet = new Set<number>(parsedExtractPages);
      if (nextSet.has(pageNum)) {
        nextSet.delete(pageNum);
      } else {
        nextSet.add(pageNum);
      }
      setExtractText(serializePageSet(nextSet));
    }
  };
  const [extractError, setExtractError] = useState<string | null>(null);

  const parsedExtractPages = useMemo(() => {
    if (extractMode === "all") {
      setExtractError(null);
      const s = new Set<number>();
      for (let i = 1; i <= totalPages; i++) s.add(i);
      return s;
    }
    const s = new Set<number>();
    if (!extractText.trim()) {
      setExtractError(null);
      return s;
    }

    const parts = extractText.split(",").map((p) => p.trim()).filter(Boolean);
    let outOfBoundsVal: number | null = null;

    for (const part of parts) {
      if (part.includes("-")) {
        const [startStr, endStr] = part.split("-").map((v) => parseInt(v.trim(), 10));
        if (!isNaN(startStr) && !isNaN(endStr)) {
          if (startStr > totalPages || endStr > totalPages) {
            outOfBoundsVal = Math.max(startStr, endStr);
          }
          const start = Math.max(1, Math.min(startStr, endStr));
          const end = Math.min(totalPages, Math.max(startStr, endStr));
          for (let p = start; p <= end; p++) s.add(p);
        }
      } else {
        const val = parseInt(part, 10);
        if (!isNaN(val)) {
          if (val > totalPages || val < 1) {
            outOfBoundsVal = val;
          } else {
            s.add(val);
          }
        }
      }
    }

    if (outOfBoundsVal !== null && outOfBoundsVal > totalPages) {
      setExtractError(`Page ${outOfBoundsVal} exceeds total pages (${totalPages}).`);
    } else {
      setExtractError(null);
    }

    return s;
  }, [extractMode, extractText, totalPages]);

  // Determine which range(s) a page belongs to
  const pageRangeMap = useMemo(() => {
    const map = new Map<number, string[]>();
    if (activeTab !== "range") return map;

    if (rangeMode === "custom") {
      customRanges.forEach((range, idx) => {
        const minP = Math.max(1, Math.min(range.from, range.to));
        const maxP = Math.min(totalPages, Math.max(range.from, range.to));
        for (let p = minP; p <= maxP; p++) {
          const list = map.get(p) || [];
          list.push(`Range ${idx + 1}`);
          map.set(p, list);
        }
      });
    } else {
      // Fixed interval
      const step = Math.max(1, fixedInterval);
      let rangeIdx = 1;
      for (let start = 1; start <= totalPages; start += step) {
        const end = Math.min(totalPages, start + step - 1);
        for (let p = start; p <= end; p++) {
          const list = map.get(p) || [];
          list.push(`Range ${rangeIdx}`);
          map.set(p, list);
        }
        rangeIdx++;
      }
    }
    return map;
  }, [activeTab, rangeMode, customRanges, fixedInterval, totalPages]);

  // Dynamic calculation of generated output files
  const estimatedOutputCount = useMemo(() => {
    if (activeTab === "range") {
      if (rangeMode === "custom") {
        return customRanges.filter((r) => r.from >= 1 && r.to >= 1).length;
      } else {
        const step = Math.max(1, fixedInterval);
        return Math.ceil(totalPages / step) || 1;
      }
    } else if (activeTab === "pages") {
      return parsedExtractPages.size;
    } else {
      // Size mode
      if (!file || targetSizeKB <= 0) return 1;
      const fileKB = file.size / 1024;
      return Math.max(1, Math.ceil(fileKB / targetSizeKB));
    }
  }, [activeTab, rangeMode, customRanges, fixedInterval, totalPages, parsedExtractPages, file, targetSizeKB]);

  // Validity check for button
  const isValidToSplit = useMemo(() => {
    if (totalPages === 0) return false;
    if (activeTab === "range") {
      if (rangeMode === "custom") {
        return customRanges.length > 0 && customRanges.every((r) => r.from >= 1 && r.to >= 1 && r.from <= totalPages && r.to <= totalPages);
      }
      return fixedInterval >= 1;
    } else if (activeTab === "pages") {
      return parsedExtractPages.size > 0 && !extractError;
    } else {
      return targetSizeKB > 0;
    }
  }, [totalPages, activeTab, rangeMode, customRanges, fixedInterval, parsedExtractPages, targetSizeKB]);

  // Polling logic
  useEffect(() => {
    if (!jobId || status !== "processing") return;

    let attempts = 0;
    const maxAttempts = 120; // 2 minutes

    pollIntervalRef.current = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch(`${API_BASE}/api/v1/jobs/${jobId}`);
        if (!res.ok) {
          if (res.status === 404 && attempts < 5) return;
          throw new Error("Job not found or API error");
        }
        const data = await res.json();

        if (data.status === "completed") {
          setStatus("completed");
          setResultData({
            downloadUrl: `${API_BASE}${data.downloadUrl}`,
            resultSize: data.resultSize || 0,
            filename: `${outputBaseName}.zip`,
          });
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        } else if (data.status === "failed") {
          setStatus("failed");
          setErrorMessage(data.error || "Failed to split PDF");
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        }
      } catch (err: unknown) {
        if (attempts >= maxAttempts) {
          setStatus("failed");
          setErrorMessage(err instanceof Error ? err.message : "Polling failed");
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        }
      }
    }, 1000);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [jobId, status, outputBaseName]);

  const handleSubmit = async () => {
    if (!file || !isValidToSplit) return;
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
      if (!signRes.ok) throw new Error("Failed to sign upload URL");
      const { uploadUrl, fileUrl } = await signRes.json();

      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": "application/pdf" },
      });
      if (!uploadRes.ok) throw new Error("Failed to upload file");

      let jobOptions: Record<string, unknown> = {
        outputFilename: `${outputBaseName}.zip`,
      };

      if (activeTab === "range") {
        if (rangeMode === "custom") {
          const rangesString = customRanges
            .map((r) => {
              const start = Math.min(r.from, r.to);
              const end = Math.max(r.from, r.to);
              return start === end ? `${start}` : `${start}-${end}`;
            })
            .join(",");
          jobOptions = {
            ...jobOptions,
            mode: "ranges",
            ranges: rangesString,
          };
        } else {
          jobOptions = {
            ...jobOptions,
            mode: "interval",
            interval: fixedInterval,
          };
        }
      } else if (activeTab === "pages") {
        const pagesArray = Array.from(parsedExtractPages).sort((a, b) => a - b);
        const rangesString = pagesArray.join(",");
        jobOptions = {
          ...jobOptions,
          mode: "ranges",
          ranges: rangesString,
        };
      } else {
        // Size mode
        jobOptions = {
          ...jobOptions,
          mode: "size",
          maxSizeKB: targetSizeKB,
        };
      }

      const jobRes = await fetch(`${API_BASE}/api/v1/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "split-pdf",
          files: [{ url: fileUrl, name: file.name, size: file.size }],
          options: jobOptions,
        }),
      });

      if (!jobRes.ok) {
        const errMsg = await parseApiError(jobRes, "Failed to process job");
        throw new Error(errMsg);
      }

      const { jobId: newId } = await jobRes.json();
      setJobId(newId);
    } catch (err: unknown) {
      setStatus("failed");
      setErrorMessage(err instanceof Error ? err.message : "Failed to split file");
    }
  };

  // Add a new custom range
  const handleAddRange = () => {
    const nextIdx = customRanges.length + 1;
    const lastRange = customRanges[customRanges.length - 1];
    const newFrom = lastRange ? Math.min(totalPages, lastRange.to + 1) : 1;
    const newTo = Math.min(totalPages, newFrom + 2);
    setCustomRanges([
      ...customRanges,
      { id: `range-${Date.now()}`, from: newFrom, to: newTo },
    ]);
  };

  const handleRemoveRange = (id: string) => {
    if (customRanges.length <= 1) return;
    setCustomRanges(customRanges.filter((r) => r.id !== id));
  };

  const handleUpdateRange = (id: string, field: "from" | "to", val: number) => {
    setCustomRanges(
      customRanges.map((r) => {
        if (r.id !== id) return r;
        return { ...r, [field]: val };
      })
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />

      {!file ? (
        <EmptyState
          title="Split PDF file"
          description="Separate one page or a whole set for easy conversion into independent PDF files."
          accept="application/pdf"
          maxFiles={1}
          maxSizeMB={100}
          formatName="PDF"
          onFiles={handleFile}
          disabled={status === "processing"}
        />
      ) : loadingPages ? (
        <main className="flex-1 max-w-md w-full mx-auto px-6 py-24 flex flex-col items-center justify-center text-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-foreground" />
          <div className="text-base font-semibold">Extracting PDF pages…</div>
          <div className="text-xs font-semibold text-muted-foreground">
            Rendered {loadingProgress.current} of {loadingProgress.total} pages
          </div>
        </main>
      ) : (
        <main className="flex-1 w-full flex flex-col lg:flex-row min-h-[calc(100vh-65px)]">
          {/* Left Canvas: Live Interactive Thumbnail Grid */}
          <section
            tabIndex={0}
            onKeyDown={(e) => {
              if (
                activeTab === "pages" &&
                extractMode === "select" &&
                (e.ctrlKey || e.metaKey) &&
                e.key.toLowerCase() === "a"
              ) {
                // Check if user is typing inside an input or textarea
                const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
                if (targetTag !== "input" && targetTag !== "textarea") {
                  e.preventDefault();
                  handleSelectAllPages();
                }
              }
            }}
            className="flex-1 bg-muted/30 p-6 lg:p-10 flex flex-col justify-between overflow-y-auto min-h-[500px] outline-none"
          >
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-end">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-muted-foreground">
                    {totalPages} Page{totalPages > 1 ? "s" : ""}
                  </span>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="h-9 px-3.5 rounded-full border border-border bg-background hover:bg-secondary text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RefreshCcw className="h-3.5 w-3.5" />
                    <span>Change file</span>
                  </button>
                </div>
              </div>

              {/* Live Canvas Area */}
              {activeTab === "range" && rangeMode === "custom" ? (
                /* Custom Ranges: iLovePDF Style with Drag & Drop by Label */
                <DndContext
                  sensors={rangeSensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleRangeDragStart}
                  onDragEnd={handleRangeDragEnd}
                >
                  <SortableContext
                    items={customRanges.map((r) => r.id)}
                    strategy={rectSortingStrategy}
                  >
                    <div className="flex flex-wrap items-start justify-center gap-8">
                      {customRanges.map((r, rIdx) => (
                        <SortableCanvasRangeBox
                          key={r.id}
                          range={r}
                          displayIndex={rIdx}
                          totalPages={totalPages}
                          pageThumbnails={pageThumbnails}
                          onUpdateRange={handleUpdateRange}
                        />
                      ))}
                    </div>
                  </SortableContext>

                  <DragOverlay dropAnimation={{
                    duration: 200,
                    easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
                  }}>
                    {activeDragRangeId ? (() => {
                      const draggingRange = customRanges.find((r) => r.id === activeDragRangeId);
                      const draggingIdx = customRanges.findIndex((r) => r.id === activeDragRangeId);
                      if (!draggingRange) return null;

                      const startVal = Math.max(1, Math.min(totalPages, draggingRange.from || 1));
                      const endVal = Math.max(1, Math.min(totalPages, draggingRange.to || 1));
                      const isSinglePage = startVal === endVal;
                      const startThumb = pageThumbnails[startVal - 1];
                      const endThumb = pageThumbnails[endVal - 1];

                      return (
                        <div className="flex flex-col items-center gap-2 select-none pointer-events-none opacity-90 scale-[1.03] shadow-2xl">
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary bg-primary text-primary-foreground text-xs font-semibold">
                            <GripVertical className="h-3.5 w-3.5" />
                            <span>Range {draggingIdx + 1}</span>
                          </div>
                          <div className="rounded-3xl border-2 border-dashed border-primary bg-background p-4 sm:p-5 flex items-center gap-3">
                            <div className="w-36 sm:w-40 flex flex-col rounded-2xl border border-border bg-background overflow-hidden">
                              <div className="relative aspect-[3/4] bg-muted/20 flex items-center justify-center p-2.5">
                                {startThumb && (
                                  <img src={startThumb} alt="" className="max-h-full max-w-full object-contain rounded-md" />
                                )}
                              </div>
                              <div className="h-9 px-2 bg-card border-t border-border flex items-center justify-center font-bold text-xs">
                                {startVal}
                              </div>
                            </div>
                            {!isSinglePage && (
                              <div className="flex items-center justify-center px-1 text-muted-foreground font-bold tracking-widest text-base">
                                •••
                              </div>
                            )}
                            {!isSinglePage && (
                              <div className="w-36 sm:w-40 flex flex-col rounded-2xl border border-border bg-background overflow-hidden">
                                <div className="relative aspect-[3/4] bg-muted/20 flex items-center justify-center p-2.5">
                                  {endThumb && (
                                    <img src={endThumb} alt="" className="max-h-full max-w-full object-contain rounded-md" />
                                  )}
                                </div>
                                <div className="h-9 px-2 bg-card border-t border-border flex items-center justify-center font-bold text-xs">
                                  {endVal}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })() : null}
                  </DragOverlay>
                </DndContext>
              ) : activeTab === "range" && rangeMode === "fixed" ? (
                /* Fixed Ranges: exactly 2 preview cards per range (Start Page ... End Page), matching Custom Range design */
                <div className="flex flex-wrap items-start justify-center gap-8">
                  {(() => {
                    const step = Math.max(1, fixedInterval || 1);
                    const groups: { rangeIdx: number; start: number; end: number }[] = [];
                    let rangeIdx = 1;

                    for (let start = 1; start <= totalPages; start += step) {
                      const end = Math.min(totalPages, start + step - 1);
                      groups.push({ rangeIdx, start, end });
                      rangeIdx++;
                    }

                    return groups.map((g) => {
                      const isSinglePage = g.start === g.end;
                      const startThumb = pageThumbnails[g.start - 1];
                      const endThumb = pageThumbnails[g.end - 1];

                      return (
                        <div key={`fixed-range-card-${g.rangeIdx}`} className="flex flex-col items-center gap-2">
                          {/* Centered Range Title above box */}
                          <span className="text-xs font-semibold text-muted-foreground">
                            Range {g.rangeIdx}
                          </span>

                          {/* Dashed group container */}
                          <div className="rounded-3xl border-2 border-dashed border-border hover:border-primary/60 bg-card/40 p-4 sm:p-5 flex items-center gap-3 transition-colors select-none shadow-none">
                            {/* Start Page Card */}
                            <div className="w-36 sm:w-40 flex flex-col rounded-2xl border border-border bg-background overflow-hidden">
                              <div className="relative aspect-[3/4] bg-muted/20 flex items-center justify-center p-2.5">
                                {startThumb ? (
                                  <img
                                    src={startThumb}
                                    alt={`Page ${g.start}`}
                                    className="max-h-full max-w-full object-contain rounded-md border border-border/40 pointer-events-none"
                                  />
                                ) : (
                                  <div className="text-xs text-muted-foreground">Page {g.start}</div>
                                )}
                              </div>
                              <div className="h-9 px-2 bg-card border-t border-border flex items-center justify-center font-bold text-xs text-foreground">
                                {g.start}
                              </div>
                            </div>

                            {/* Ellipsis if range spans multiple pages */}
                            {!isSinglePage && (
                              <div className="flex items-center justify-center px-1 text-muted-foreground font-bold tracking-widest text-base select-none">
                                •••
                              </div>
                            )}

                            {/* End Page Card (if not single page) */}
                            {!isSinglePage && (
                              <div className="w-36 sm:w-40 flex flex-col rounded-2xl border border-border bg-background overflow-hidden">
                                <div className="relative aspect-[3/4] bg-muted/20 flex items-center justify-center p-2.5">
                                  {endThumb ? (
                                    <img
                                      src={endThumb}
                                      alt={`Page ${g.end}`}
                                      className="max-h-full max-w-full object-contain rounded-md border border-border/40 pointer-events-none"
                                    />
                                  ) : (
                                    <div className="text-xs text-muted-foreground">Page {g.end}</div>
                                  )}
                                </div>
                                <div className="h-9 px-2 bg-card border-t border-border flex items-center justify-center font-bold text-xs text-foreground">
                                  {g.end}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              ) : (
                /* Pages & Size Mode: Clickable interactive thumbnail grid with checkmarks */
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                  {pageThumbnails.map((thumb, index) => {
                    const pageNum = index + 1;
                    const isPageSelected = parsedExtractPages.has(pageNum);

                    return (
                      <div
                        key={`page-${pageNum}`}
                        role={activeTab === "pages" ? "button" : undefined}
                        tabIndex={activeTab === "pages" ? 0 : undefined}
                        onClick={() => handleTogglePageCard(pageNum)}
                        onKeyDown={(e) => {
                          if (activeTab === "pages" && (e.key === "Enter" || e.key === " ")) {
                            e.preventDefault();
                            handleTogglePageCard(pageNum);
                          }
                        }}
                        className={`relative flex flex-col rounded-2xl border transition-all duration-200 select-none overflow-hidden bg-background ${activeTab === "pages" ? "cursor-pointer hover:border-primary/80 hover:scale-[1.01]" : ""
                          } ${activeTab === "pages"
                            ? isPageSelected
                              ? "border-primary ring-2 ring-primary/20"
                              : "border-border/50 opacity-40 grayscale-[25%]"
                            : "border-border"
                          }`}
                      >
                        {/* Checkmark Circle at top left for Pages Tab */}
                        {activeTab === "pages" && isPageSelected && (
                          <div className="absolute top-2.5 left-2.5 z-10 p-0.5 rounded-full bg-background/90 text-emerald-500">
                            <HugeCheckCircle size={22} className="text-emerald-500" />
                          </div>
                        )}

                        {/* Page Thumbnail Image */}
                        <div className="relative aspect-[3/4] bg-muted/20 flex items-center justify-center p-3">
                          <img
                            src={thumb}
                            alt={`Page ${pageNum}`}
                            className="max-h-full max-w-full object-contain rounded-md border border-border/40 pointer-events-none"
                          />
                        </div>

                        {/* Page Footer Label */}
                        <div className="h-9 px-3 bg-card border-t border-border flex items-center justify-between text-xs font-semibold">
                          <span className="text-foreground">Page {pageNum}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* Right Panel: iLovePDF Multi-Tab Settings with Independent Scroll & Sticky Action */}
          <aside className="w-full lg:w-[380px] xl:w-[420px] shrink-0 border-t lg:border-t-0 lg:border-l border-border bg-background lg:sticky lg:top-16 lg:h-[calc(100vh-65px)] flex flex-col justify-between overflow-hidden">
            {/* Scrollable Settings Content Area */}
            <div className="flex-1 overflow-y-auto p-6 lg:p-8 flex flex-col gap-6 [scrollbar-width:thin] [scrollbar-color:hsl(var(--border))_transparent]">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground">Split PDF</h2>
              </div>

              {/* 3 Large Tabs: Range, Pages, Size */}
              <div className="grid grid-cols-3 gap-2 p-1 rounded-2xl bg-secondary/60 border border-border">
                <button
                  type="button"
                  onClick={() => setActiveTab("range")}
                  className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeTab === "range"
                      ? "bg-background text-foreground border border-border"
                      : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  <Copy className="h-4 w-4 mb-1" />
                  <span>Range</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("pages")}
                  className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeTab === "pages"
                      ? "bg-background text-foreground border border-border"
                      : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  <FileText className="h-4 w-4 mb-1" />
                  <span>Pages</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("size")}
                  className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeTab === "size"
                      ? "bg-background text-foreground border border-border"
                      : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  <HardDrive className="h-4 w-4 mb-1" />
                  <span>Size</span>
                </button>
              </div>

              {/* TAB 1: RANGE */}
              {activeTab === "range" && (
                <div className="flex flex-col gap-5">
                  <div className="flex items-center gap-2 p-1 rounded-xl bg-secondary/40 border border-border text-xs font-medium">
                    <button
                      type="button"
                      onClick={() => setRangeMode("custom")}
                      className={`flex-1 py-1.5 rounded-lg text-center font-semibold transition-colors cursor-pointer ${rangeMode === "custom" ? "bg-background text-foreground border border-border" : "text-muted-foreground"
                        }`}
                    >
                      Custom ranges
                    </button>
                    <button
                      type="button"
                      onClick={() => setRangeMode("fixed")}
                      className={`flex-1 py-1.5 rounded-lg text-center font-semibold transition-colors cursor-pointer ${rangeMode === "fixed" ? "bg-background text-foreground border border-border" : "text-muted-foreground"
                        }`}
                    >
                      Fixed ranges
                    </button>
                  </div>

                  {rangeMode === "custom" ? (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-foreground">Range list</span>
                        <button
                          type="button"
                          onClick={handleAddRange}
                          className="h-7 px-3 rounded-full border border-border bg-card hover:bg-secondary text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Plus className="h-3 w-3" />
                          <span>Add Range</span>
                        </button>
                      </div>

                      {/* Sortable Drag-and-Drop Range Rows */}
                      <DndContext
                        sensors={rangeSensors}
                        collisionDetection={closestCenter}
                        onDragStart={handleRangeDragStart}
                        onDragEnd={handleRangeDragEnd}
                      >
                        <SortableContext
                          items={customRanges.map((r) => r.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="flex flex-col gap-2.5">
                            {customRanges.map((r, idx) => (
                              <SortableRangeRow
                                key={r.id}
                                item={r}
                                displayIndex={idx}
                                totalPages={totalPages}
                                canRemove={customRanges.length > 1}
                                onUpdate={handleUpdateRange}
                                onRemove={handleRemoveRange}
                              />
                            ))}
                          </div>
                        </SortableContext>

                        <DragOverlay dropAnimation={{
                          duration: 200,
                          easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
                        }}>
                          {activeDragRangeId ? (() => {
                            const draggingItem = customRanges.find((r) => r.id === activeDragRangeId);
                            const draggingIndex = customRanges.findIndex((r) => r.id === activeDragRangeId);
                            if (!draggingItem) return null;
                            return (
                              <div className="flex items-center justify-between gap-2 p-3 rounded-2xl border-2 border-primary bg-background shadow-lg opacity-95">
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <GripVertical className="h-4 w-4 text-foreground" />
                                  <span className="text-xs font-bold text-foreground w-14">
                                    Range {draggingIndex + 1}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-xs font-semibold">
                                  <span className="text-muted-foreground font-normal">from</span>
                                  <span className="w-14 h-8 flex items-center justify-center rounded-xl border border-border bg-background text-xs font-semibold">
                                    {draggingItem.from}
                                  </span>
                                  <span className="text-muted-foreground font-normal">to</span>
                                  <span className="w-14 h-8 flex items-center justify-center rounded-xl border border-border bg-background text-xs font-semibold">
                                    {draggingItem.to}
                                  </span>
                                </div>
                              </div>
                            );
                          })() : null}
                        </DragOverlay>
                      </DndContext>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <label htmlFor="fixed-split-input" className="text-xs font-semibold text-foreground">
                        Split into page ranges of:
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          id="fixed-split-input"
                          type="number"
                          min={1}
                          max={totalPages}
                          value={fixedInterval || ""}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            setFixedInterval(isNaN(val) ? 0 : Math.max(0, Math.min(totalPages, val)));
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && isValidToSplit && status !== "processing") {
                              e.preventDefault();
                              handleSubmit();
                            }
                          }}
                          placeholder="e.g. 4"
                          className="w-24 h-11 px-3 text-center rounded-xl border border-border bg-background font-semibold text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                        <span className="text-xs font-medium text-muted-foreground">page(s) per file</span>
                      </div>
                      {fixedInterval > 0 && (
                        <p className="text-[11px] text-muted-foreground mt-1">
                          This PDF will be split into files of {fixedInterval} pages.{" "}
                          <strong className="text-foreground font-semibold">
                            {estimatedOutputCount} PDF{estimatedOutputCount > 1 ? "s" : ""}
                          </strong>{" "}
                          will be created.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: PAGES (Extract) */}
              {activeTab === "pages" && (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-foreground">Extract mode</label>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="flex items-center gap-2 p-2.5 rounded-xl border border-border bg-card cursor-pointer hover:bg-secondary/40 transition-colors">
                        <input
                          type="radio"
                          name="extractMode"
                          checked={extractMode === "all"}
                          onChange={() => setExtractMode("all")}
                          className="h-3.5 w-3.5 text-primary"
                        />
                        <span className="text-xs font-semibold text-foreground">Extract all</span>
                      </label>

                      <label className="flex items-center gap-2 p-2.5 rounded-xl border border-border bg-card cursor-pointer hover:bg-secondary/40 transition-colors">
                        <input
                          type="radio"
                          name="extractMode"
                          checked={extractMode === "select"}
                          onChange={() => setExtractMode("select")}
                          className="h-3.5 w-3.5 text-primary"
                        />
                        <span className="text-xs font-semibold text-foreground">Select pages</span>
                      </label>
                    </div>
                  </div>

                  {extractMode === "select" && (
                    <div className="flex flex-col gap-2 pt-1">
                      <div className="flex items-center justify-between">
                        <label htmlFor="extract-pages-input" className="text-xs font-semibold text-foreground">
                          Pages
                        </label>
                        {/* Smart Quick-Select Buttons */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={handleSelectAllPages}
                            className="px-2.5 py-0.5 rounded-full border border-border bg-card hover:bg-secondary text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                          >
                            All
                          </button>
                          <button
                            type="button"
                            onClick={handleSelectOddPages}
                            className="px-2.5 py-0.5 rounded-full border border-border bg-card hover:bg-secondary text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                          >
                            Odd
                          </button>
                          <button
                            type="button"
                            onClick={handleSelectEvenPages}
                            className="px-2.5 py-0.5 rounded-full border border-border bg-card hover:bg-secondary text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                          >
                            Even
                          </button>
                        </div>
                      </div>

                      <input
                        id="extract-pages-input"
                        type="text"
                        value={extractText}
                        onChange={(e) => setExtractText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && isValidToSplit && status !== "processing") {
                            e.preventDefault();
                            handleSubmit();
                          }
                        }}
                        placeholder="e.g. 1, 3, 5-8"
                        className={`w-full h-10 px-3.5 rounded-xl border bg-background text-xs font-semibold text-foreground focus:outline-none focus:ring-1 ${
                          extractError
                            ? "border-rose-500 focus:ring-rose-500"
                            : "border-border focus:ring-ring"
                        }`}
                      />

                      {extractError && (
                        <p className="text-[11px] font-medium text-rose-500">
                          {extractError}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: SIZE */}
              {activeTab === "size" && (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="max-size-input" className="text-xs font-semibold text-foreground">
                      Maximum size per file
                    </label>
                    <div className="relative flex items-center">
                      <input
                        id="max-size-input"
                        type="number"
                        min={10}
                        value={targetSizeKB}
                        onChange={(e) => setTargetSizeKB(parseInt(e.target.value, 10) || 500)}
                        placeholder="e.g. 500"
                        className="w-full h-10 pl-3.5 pr-14 rounded-xl border border-border bg-background text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                      <span className="absolute right-3 px-2 py-0.5 rounded-lg bg-secondary text-[11px] font-bold text-muted-foreground pointer-events-none select-none">
                        KB
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Output Zip Name */}
              <div className="flex flex-col gap-1.5 pt-1 border-t border-border/60">
                <label htmlFor="split-zip-name" className="text-xs font-semibold text-foreground">
                  Output filename
                </label>
                <div className="relative flex items-center">
                  <input
                    id="split-zip-name"
                    type="text"
                    value={outputBaseName}
                    onChange={(e) => setOutputBaseName(e.target.value.replace(/\.zip$/i, ""))}
                    disabled={status === "processing"}
                    className="w-full h-10 pl-3.5 pr-14 rounded-xl border border-border bg-background text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
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
                <ProgressCard progress={-1} label="Splitting your PDF…" />
              )}

              {status === "completed" && resultData && (
                <ResultCard
                  filename={resultData.filename}
                  sizeBytes={resultData.resultSize}
                  downloadUrl={resultData.downloadUrl}
                  onReset={handleReset}
                />
              )}
            </div>

            {/* Pinned Sticky Bottom Action Button Area with Minimalist Result Microcopy */}
            <div className="p-6 lg:p-8 border-t border-border bg-background shrink-0 flex flex-col gap-2.5">
              {status !== "completed" && (
                <>
                  <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                    <span>Result</span>
                    <span className="font-semibold text-foreground">
                      {estimatedOutputCount} PDF{estimatedOutputCount > 1 ? "s" : ""} in a ZIP
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={status === "processing" || !isValidToSplit}
                    className="w-full h-14 rounded-full bg-primary text-primary-foreground text-base font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity cursor-pointer shadow-none"
                  >
                    <span>
                      {status === "processing"
                        ? "Splitting…"
                        : `Split PDF`}
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          </aside>
        </main>
      )}
    </div>
  );
}
