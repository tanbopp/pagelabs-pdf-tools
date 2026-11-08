"use client";

/**
 * In-browser job runner.
 *
 * This module mirrors the tiny subset of the old server job API that the tool
 * pages rely on (`status`, `result_url`, `result_size`, `error_message`), but
 * everything runs locally in the browser: files are never uploaded and the
 * result is a `blob:` URL created from the processed bytes.
 */

import type { ToolResult } from "./pdf";
import type { Opts } from "./tools-pdf";
import {
  addPageNumbers,
  addWatermark,
  compressPdf,
  cropPdf,
  extractPages,
  mergePdf,
  organizePdf,
  pdfForms,
  removePages,
  repairPdf,
  rotatePdf,
  signPdf,
  splitPdf,
  unlockPdf,
} from "./tools-pdf";
import {
  comparePdf,
  excelToPdf,
  heicToJpg,
  imagesToPdf,
  ocrPdf,
  pdfToExcel,
  pdfToImages,
  pdfToPowerpoint,
  pdfToWord,
  powerpointToPdf,
  redactPdf,
  wordToPdf,
} from "./tools-convert";

export interface LocalJobSnapshot {
  status: "processing" | "completed" | "failed";
  progress: number;
  result_url?: string;
  result_size?: number;
  result_filename?: string;
  error_message?: string;
}

type Processor = (
  files: File[],
  options: Opts,
  onProgress: (percent: number) => void
) => Promise<ToolResult>;

const PROCESSORS: Record<string, Processor> = {
  "merge-pdf": mergePdf,
  "split-pdf": splitPdf,
  "remove-pages": removePages,
  "extract-pages": extractPages,
  "rotate-pdf": rotatePdf,
  "organize-pdf": organizePdf,
  "crop-pdf": cropPdf,
  "add-page-numbers": addPageNumbers,
  "add-watermark": addWatermark,
  "sign-pdf": signPdf,
  "compress-pdf": compressPdf,
  "repair-pdf": repairPdf,
  "unlock-pdf": unlockPdf,
  "pdf-forms": pdfForms,
  "jpg-to-pdf": imagesToPdf,
  "scan-to-pdf": imagesToPdf,
  "heic-to-jpg": heicToJpg,
  "pdf-to-jpg": pdfToImages,
  "pdf-to-word": pdfToWord,
  "pdf-to-excel": pdfToExcel,
  "pdf-to-powerpoint": pdfToPowerpoint,
  "excel-to-pdf": excelToPdf,
  "word-to-pdf": wordToPdf,
  "powerpoint-to-pdf": powerpointToPdf,
  "ocr-pdf": ocrPdf,
  "compare-pdf": comparePdf,
  "redact-pdf": redactPdf,
};

const BROWSER_ONLY_MESSAGE =
  "Browser limitations: this tool needs a full server-side document engine. " +
  "Please use our API version for this conversion.";

const jobs = new Map<string, LocalJobSnapshot>();

function newJobId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `job_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function update(jobId: string, patch: Partial<LocalJobSnapshot>) {
  const current = jobs.get(jobId);
  if (!current) return;
  jobs.set(jobId, { ...current, ...patch });
}

/**
 * Start a local processing job. Returns immediately; poll `getJob` for status.
 */
export function startJob(
  tool: string,
  files: File[],
  options: Opts = {}
): { jobId: string } {
  const jobId = newJobId();
  jobs.set(jobId, { status: "processing", progress: 0 });

  const processor = PROCESSORS[tool];

  if (!processor) {
    // Give the UI a beat so it can render its processing state first.
    queueMicrotask(() => {
      update(jobId, { status: "failed", error_message: BROWSER_ONLY_MESSAGE });
    });
    return { jobId };
  }

  const onProgress = (percent: number) => {
    update(jobId, { progress: Math.min(99, Math.max(0, Math.round(percent))) });
  };

  void (async () => {
    try {
      if (!files || files.length === 0) {
        throw new Error("No input files were provided.");
      }
      const result = await processor(files, options, onProgress);
      const resultUrl = URL.createObjectURL(result.blob);
      jobs.set(jobId, {
        status: "completed",
        progress: 100,
        result_url: resultUrl,
        result_size: result.blob.size,
        result_filename: result.filename,
      });
    } catch (err) {
      jobs.set(jobId, {
        status: "failed",
        progress: 0,
        error_message: describeError(err),
      });
    }
  })();

  return { jobId };
}

function describeError(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "string" && err) return err;
  if (err && typeof err === "object") {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string" && message) return message;
  }
  return "Processing failed in the browser.";
}

export function getJob(jobId: string): LocalJobSnapshot | undefined {
  return jobs.get(jobId);
}

/** Release the blob URL for a finished job. */
export function releaseJob(jobId: string) {
  const job = jobs.get(jobId);
  if (job?.result_url?.startsWith("blob:")) {
    URL.revokeObjectURL(job.result_url);
  }
  jobs.delete(jobId);
}

/** Tools that cannot run in a browser at all. */
export function isBrowserSupported(tool: string): boolean {
  return Boolean(PROCESSORS[tool]);
}
