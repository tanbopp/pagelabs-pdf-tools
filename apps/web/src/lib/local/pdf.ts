"use client";

import { PDFDocument, rgb, type PDFPage, type RGB } from "pdf-lib";

export interface ToolResult {
  blob: Blob;
  filename: string;
}

export function toBlob(bytes: Uint8Array, type = "application/pdf"): Blob {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return new Blob([copy], { type });
}

export async function loadPdf(file: File): Promise<PDFDocument> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  try {
    return await PDFDocument.load(bytes, { updateMetadata: false });
  } catch (err) {
    // Many "locked" PDFs only have an owner password; pdf-lib can still read
    // them when we ignore the encryption dictionary.
    try {
      return await PDFDocument.load(bytes, {
        ignoreEncryption: true,
        updateMetadata: false,
        throwOnInvalidObject: false,
      });
    } catch {
      throw new Error(
        err instanceof Error
          ? `Could not read this PDF: ${err.message}`
          : "Could not read this PDF."
      );
    }
  }
}

export async function savePdf(doc: PDFDocument): Promise<Uint8Array> {
  return doc.save({ useObjectStreams: true });
}

export async function pdfResult(doc: PDFDocument, filename: string): Promise<ToolResult> {
  const bytes = await savePdf(doc);
  return { blob: toBlob(bytes), filename };
}

/**
 * Parse a page-range expression such as "1-3, 5, 8-10" into 1-based page
 * numbers. Invalid tokens are ignored, out-of-range pages are clamped.
 */
export function parsePageRanges(spec: string | undefined | null, total: number): number[] {
  if (!spec) return [];
  const pages = new Set<number>();

  for (const rawToken of String(spec).split(/[,;\s]+/)) {
    const token = rawToken.trim();
    if (!token) continue;

    const rangeMatch = token.match(/^(\d+)\s*-\s*(\d+)$/);
    if (rangeMatch) {
      let start = Number(rangeMatch[1]);
      let end = Number(rangeMatch[2]);
      if (start > end) [start, end] = [end, start];
      for (let p = Math.max(1, start); p <= Math.min(total, end); p++) pages.add(p);
      continue;
    }

    if (/^\d+$/.test(token)) {
      const p = Number(token);
      if (p >= 1 && p <= total) pages.add(p);
      continue;
    }

    // "odd" / "even" helpers are handy for split/remove UIs.
    if (token.toLowerCase() === "odd") {
      for (let p = 1; p <= total; p += 2) pages.add(p);
    } else if (token.toLowerCase() === "even") {
      for (let p = 2; p <= total; p += 2) pages.add(p);
    }
  }

  return Array.from(pages).sort((a, b) => a - b);
}

export function hexToRgb(hex: string | undefined): RGB {
  const fallback = rgb(0, 0, 0);
  if (!hex) return fallback;
  const match = hex.replace("#", "").match(/^([0-9a-f]{6})$/i);
  if (!match) return fallback;
  const value = match[1];
  return rgb(
    parseInt(value.slice(0, 2), 16) / 255,
    parseInt(value.slice(2, 4), 16) / 255,
    parseInt(value.slice(4, 6), 16) / 255
  );
}

export function baseName(name: string): string {
  return name.replace(/\.[^/.]+$/, "");
}

/** Vertical / horizontal anchors shared by watermark & page-number tools. */
export type Anchor =
  | "top-left"
  | "top-center"
  | "top-right"
  | "middle-left"
  | "middle-center"
  | "middle-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right"
  | "center"
  | "diagonal";

export function anchorPosition(
  anchor: Anchor,
  pageWidth: number,
  pageHeight: number,
  contentWidth: number,
  contentHeight: number,
  margin: number
): { x: number; y: number; rotation?: number } {
  if (anchor === "center") {
    return { x: (pageWidth - contentWidth) / 2, y: (pageHeight - contentHeight) / 2 };
  }
  if (anchor === "diagonal") {
    return { x: (pageWidth - contentWidth) / 2, y: (pageHeight - contentHeight) / 2 };
  }

  const [vertical, horizontal] = anchor.split("-") as [string, string];

  let x: number;
  if (horizontal === "left") x = margin;
  else if (horizontal === "right") x = pageWidth - contentWidth - margin;
  else x = (pageWidth - contentWidth) / 2;

  let y: number;
  if (vertical === "top") y = pageHeight - contentHeight - margin;
  else if (vertical === "bottom") y = margin;
  else y = (pageHeight - contentHeight) / 2;

  return { x, y };
}

export function formatPageNumber(
  format: string,
  pageNumber: number,
  total: number,
  customText?: string
): string {
  const n = String(pageNumber);
  const t = String(total);
  switch (format) {
    case "n":
    case "only-number":
      return n;
    case "page-n":
      return `Page ${n}`;
    case "n-of-total":
    case "n-total":
      return `${n} / ${t}`;
    case "page-n-of-total":
    case "page-n-total":
      return `Page ${n} of ${t}`;
    case "custom":
      return (customText || "{n}").replace(/\{n\}/g, n).replace(/\{total\}/g, t);
    default:
      return (customText || "{n}").replace(/\{n\}/g, n).replace(/\{total\}/g, t);
  }
}

/** Draw wrapped text and return the number of lines drawn. */
export function drawWrappedText(
  page: PDFPage,
  text: string,
  options: {
    x: number;
    y: number;
    maxWidth: number;
    size: number;
    lineHeight?: number;
    font: { widthOfTextAtSize: (t: string, s: number) => number };
    color: RGB;
    draw: (line: string, x: number, y: number) => void;
  }
): number {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (options.font.widthOfTextAtSize(candidate, options.size) > options.maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);

  const lineHeight = options.lineHeight ?? options.size * 1.35;
  let y = options.y;
  for (const line of lines) {
    if (y < 40) {
      // Out of room on this page – stop rather than draw outside the canvas.
      break;
    }
    options.draw(line, options.x, y);
    y -= lineHeight;
  }
  return lines.length;
}
