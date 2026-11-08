"use client";

import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";
import JSZip from "jszip";
import {
  anchorPosition,
  formatPageNumber,
  hexToRgb,
  loadPdf,
  parsePageRanges,
  pdfResult,
  savePdf,
  type Anchor,
  type ToolResult,
} from "./pdf";
import { canvasToBytes, openPdfDocument, renderPage } from "./render";

/**
 * Options are validated by the UI before they reach the engine, so they arrive
 * as a loose record of primitives instead of a per-tool type.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Opts = Record<string, any>;

const MM_TO_PT = 2.834645669;

function pageCount(doc: PDFDocument): number {
  return doc.getPageCount();
}

async function zipFiles(
  entries: { name: string; data: Uint8Array }[],
  filename: string
): Promise<ToolResult> {
  const zip = new JSZip();
  for (const entry of entries) zip.file(entry.name, entry.data);
  const blob = await zip.generateAsync({ type: "blob" });
  return { blob, filename };
}

/* ------------------------------------------------------------------ */
/* Organise                                                            */
/* ------------------------------------------------------------------ */

export async function mergePdf(files: File[], options: Opts): Promise<ToolResult> {
  if (files.length < 2) throw new Error("Select at least two PDF files to merge.");

  const merged = await PDFDocument.create();

  for (const file of files) {
    const source = await PDFDocument.load(new Uint8Array(await file.arrayBuffer()), {
      ignoreEncryption: true,
      updateMetadata: false,
      throwOnInvalidObject: false,
    });
    const pages = await merged.copyPages(source, source.getPageIndices());
    for (const page of pages) merged.addPage(page);
  }

  const filename = options.outputFilename || "merged.pdf";
  return pdfResult(merged, filename);
}

export async function splitPdf(files: File[], options: Opts): Promise<ToolResult> {
  const file = files[0];
  if (!file) throw new Error("Select a PDF file to split.");

  const source = await loadPdf(file);
  const total = pageCount(source);
  const mode = options.mode || "ranges";
  const base = (options.outputFilename || "split.zip").replace(/\.zip$/i, "");

  let groups: number[][] = [];

  if (mode === "all") {
    groups = Array.from({ length: total }, (_, i) => [i]);
  } else if (mode === "interval") {
    const interval = Math.max(1, Number(options.interval) || 1);
    for (let start = 0; start < total; start += interval) {
      const end = Math.min(total, start + interval);
      groups.push(Array.from({ length: end - start }, (_, i) => start + i));
    }
  } else if (mode === "size") {
    const maxBytes = Math.max(50, Number(options.maxSizeKB) || 1024) * 1024;
    let current: number[] = [];
    for (let index = 0; index < total; index++) {
      current.push(index);
      const probe = await PDFDocument.create();
      const copied = await probe.copyPages(source, current);
      copied.forEach((page) => probe.addPage(page));
      const size = (await savePdf(probe)).byteLength;
      if (size > maxBytes && current.length > 1) {
        current.pop();
        groups.push(current);
        current = [index];
      }
    }
    if (current.length > 0) groups.push(current);
  } else if (mode === "visual" && Array.isArray(options.pages) && options.pages.length > 0) {
    // Each entry becomes its own document.
    groups = options.pages
      .map((entry: Opts) => Number(entry.originalIndex))
      .filter((index: number) => Number.isInteger(index) && index >= 0 && index < total)
      .map((index: number) => [index]);
  } else {
    const pages = parsePageRanges(options.ranges, total);
    if (pages.length === 0) throw new Error("Enter at least one page or range to split.");
    // Every selected page becomes a separate file.
    if (mode === "ranges-single") groups = [pages.map((p) => p - 1)];
    else groups = pages.map((p) => [p - 1]);
  }

  if (groups.length === 0) throw new Error("Nothing to split with the current selection.");
  if (groups.length === 1) {
    const doc = await PDFDocument.create();
    const copied = await doc.copyPages(source, groups[0]);
    copied.forEach((page) => doc.addPage(page));
    return pdfResult(doc, `${base}.pdf`);
  }

  const entries: { name: string; data: Uint8Array }[] = [];
  for (let i = 0; i < groups.length; i++) {
    const doc = await PDFDocument.create();
    const copied = await doc.copyPages(source, groups[i]);
    copied.forEach((page) => doc.addPage(page));
    const bytes = await savePdf(doc);
    entries.push({ name: `${base}_${String(i + 1).padStart(2, "0")}.pdf`, data: bytes });
  }

  return zipFiles(entries, `${base}.zip`);
}

export async function removePages(files: File[], options: Opts): Promise<ToolResult> {
  const file = files[0];
  if (!file) throw new Error("Select a PDF file.");

  const doc = await loadPdf(file);
  const total = pageCount(doc);
  const toRemove = new Set(parsePageRanges(String(options.pages || ""), total));

  if (toRemove.size === 0) throw new Error("Enter the pages you want to remove.");
  if (toRemove.size >= total) throw new Error("You cannot remove every page of the document.");

  for (let i = total; i >= 1; i--) {
    if (toRemove.has(i)) doc.removePage(i - 1);
  }

  return pdfResult(doc, options.outputFilename || "removed.pdf");
}

export async function extractPages(files: File[], options: Opts): Promise<ToolResult> {
  const file = files[0];
  if (!file) throw new Error("Select a PDF file.");

  const source = await loadPdf(file);
  const total = pageCount(source);
  const pages = parsePageRanges(options.pages, total);
  if (pages.length === 0) throw new Error("Enter at least one page to extract.");

  const base = (options.outputFilename || "extracted.pdf").replace(/\.pdf$/i, "");

  if (options.separateFiles) {
    const entries: { name: string; data: Uint8Array }[] = [];
    for (const pageNumber of pages) {
      const doc = await PDFDocument.create();
      const [copied] = await doc.copyPages(source, [pageNumber - 1]);
      doc.addPage(copied);
      entries.push({
        name: `${base}_page_${pageNumber}.pdf`,
        data: await savePdf(doc),
      });
    }
    return zipFiles(entries, `${base}.zip`);
  }

  const doc = await PDFDocument.create();
  const copied = await doc.copyPages(
    source,
    pages.map((p) => p - 1)
  );
  copied.forEach((page) => doc.addPage(page));
  return pdfResult(doc, `${base}.pdf`);
}

export async function rotatePdf(files: File[], options: Opts): Promise<ToolResult> {
  const file = files[0];
  if (!file) throw new Error("Select a PDF file.");

  const doc = await loadPdf(file);
  const total = pageCount(doc);
  const angle = Number(options.angle) || 90;
  const targets =
    options.mode === "select"
      ? new Set(parsePageRanges(options.pages, total))
      : new Set(Array.from({ length: total }, (_, i) => i + 1));

  doc.getPages().forEach((page, index) => {
    if (!targets.has(index + 1)) return;
    const current = page.getRotation().angle;
    page.setRotation(degrees(((current + angle) % 360 + 360) % 360));
  });

  return pdfResult(doc, options.outputFilename || "rotated.pdf");
}

export async function organizePdf(files: File[], options: Opts): Promise<ToolResult> {
  const entries: Opts[] = Array.isArray(options.pages) ? options.pages : [];
  if (entries.length === 0) throw new Error("Add at least one page to the document.");

  const sources: PDFDocument[] = [];
  for (const file of files) sources.push(await loadPdf(file));

  const output = await PDFDocument.create();

  for (const entry of entries) {
    const fileIndex = Number(entry.fileIndex ?? 0);
    const originalIndex = Number(entry.originalIndex ?? -1);

    if (entry.fileId === "blank" || fileIndex < 0 || originalIndex < 0) {
      // Blank page – inherit the size of the first source page when possible.
      const size = sources[0]?.getPage(0)?.getSize();
      output.addPage([size?.width ?? 595.28, size?.height ?? 841.89]);
      continue;
    }

    const source = sources[fileIndex] ?? sources[0];
    if (!source) continue;
    const pages = source.getPages();
    if (originalIndex >= pages.length) continue;

    const [copied] = await output.copyPages(source, [originalIndex]);
    const rotation = Number(entry.rotation) || 0;
    if (rotation) {
      copied.setRotation(degrees(((copied.getRotation().angle + rotation) % 360 + 360) % 360));
    }
    output.addPage(copied);
  }

  return pdfResult(output, options.outputFilename || "organized.pdf");
}

export async function cropPdf(files: File[], options: Opts): Promise<ToolResult> {
  const file = files[0];
  if (!file) throw new Error("Select a PDF file.");

  const doc = await loadPdf(file);
  const margins = {
    top: (Number(options.top) || 0) * MM_TO_PT,
    bottom: (Number(options.bottom) || 0) * MM_TO_PT,
    left: (Number(options.left) || 0) * MM_TO_PT,
    right: (Number(options.right) || 0) * MM_TO_PT,
  };

  if (options.mode === "auto") {
    // Auto-trim: reset every page box to its media box so hidden content is
    // discarded, then margin trimming is skipped.
    for (const page of doc.getPages()) {
      const media = page.getMediaBox();
      page.setCropBox(media.x, media.y, media.width, media.height);
    }
  } else {
    for (const page of doc.getPages()) {
      const box = page.getCropBox();
      const width = box.width - margins.left - margins.right;
      const height = box.height - margins.top - margins.bottom;
      if (width <= 0 || height <= 0) {
        throw new Error("The crop margins are larger than the page itself.");
      }
      page.setCropBox(box.x + margins.left, box.y + margins.bottom, width, height);
    }
  }

  return pdfResult(doc, options.outputFilename || "cropped.pdf");
}

/* ------------------------------------------------------------------ */
/* Edit                                                                */
/* ------------------------------------------------------------------ */

const FONT_MAP: Record<string, StandardFonts> = {
  Arial: StandardFonts.Helvetica,
  Helvetica: StandardFonts.Helvetica,
  "Times-Roman": StandardFonts.TimesRoman,
  Courier: StandardFonts.Courier,
};

const BOLD_MAP: Record<string, StandardFonts> = {
  Arial: StandardFonts.HelveticaBold,
  Helvetica: StandardFonts.HelveticaBold,
  "Times-Roman": StandardFonts.TimesRomanBold,
  Courier: StandardFonts.CourierBold,
};

const ITALIC_MAP: Record<string, StandardFonts> = {
  Arial: StandardFonts.HelveticaOblique,
  Helvetica: StandardFonts.HelveticaOblique,
  "Times-Roman": StandardFonts.TimesRomanItalic,
  Courier: StandardFonts.CourierOblique,
};

const BOLD_ITALIC_MAP: Record<string, StandardFonts> = {
  Arial: StandardFonts.HelveticaBoldOblique,
  Helvetica: StandardFonts.HelveticaBoldOblique,
  "Times-Roman": StandardFonts.TimesRomanBoldItalic,
  Courier: StandardFonts.CourierBoldOblique,
};

function pickFont(name: string | undefined, bold: boolean, italic: boolean): StandardFonts {
  const key = name && FONT_MAP[name] ? name : "Arial";
  if (bold && italic) return BOLD_ITALIC_MAP[key];
  if (bold) return BOLD_MAP[key];
  if (italic) return ITALIC_MAP[key];
  return FONT_MAP[key];
}

export async function addPageNumbers(files: File[], options: Opts): Promise<ToolResult> {
  const file = files[0];
  if (!file) throw new Error("Select a PDF file.");

  const doc = await loadPdf(file);
  const total = pageCount(doc);
  const font = await doc.embedFont(
    pickFont(options.font, Boolean(options.isBold), Boolean(options.isItalic))
  );

  const fromPage = Math.max(1, Number(options.fromPage) || 1);
  const toPage = Math.min(total, Number(options.toPage) || total);
  const startNumber = Number(options.startNumber) || 1;
  const size = Number(options.size) || 12;
  const color = hexToRgb(options.color);
  const margin =
    options.margin === "small" ? 20 : options.margin === "big" ? 60 : 40;

  for (let i = fromPage; i <= toPage; i++) {
    if (options.firstPageCover && i === 1) continue;
    const page = doc.getPage(i - 1);
    const { width, height } = page.getSize();

    let displayNumber = startNumber + (i - fromPage);
    if (options.firstPageCover && i > 1) displayNumber -= 1;
    if (options.pageMode === "facing" && i % 2 === 0) displayNumber += 1;

    const label = formatPageNumber(
      options.format || "only-number",
      displayNumber,
      total,
      options.customText
    );

    const textWidth = font.widthOfTextAtSize(label, size);
    const position = anchorPosition(
      (options.position || "bottom-right") as Anchor,
      width,
      height,
      textWidth,
      size,
      margin
    );

    page.drawText(label, {
      x: position.x,
      y: position.y,
      size,
      font,
      color,
    });
  }

  return pdfResult(doc, options.outputFilename || "numbered.pdf");
}

export async function addWatermark(files: File[], options: Opts): Promise<ToolResult> {
  const file = files[0];
  if (!file) throw new Error("Select a PDF file.");

  const doc = await loadPdf(file);
  const total = pageCount(doc);
  const fromPage = Math.max(1, Number(options.fromPage) || 1);
  const toPage = Math.min(total, Number(options.toPage) || total);

  const opacity = Math.min(1, Math.max(0, Number(options.opacity) ?? 0.5));
  const size = Number(options.fontSize) || 44;
  const color = hexToRgb(options.color || "#e11d48");
  const baseRotation = Number(options.rotation) || 0;

  const font = await doc.embedFont(
    pickFont(options.fontFamily, Boolean(options.isBold), Boolean(options.isItalic))
  );

  let image: Awaited<ReturnType<PDFDocument["embedPng"]>> | null = null;
  let imageWidth = 0;
  let imageHeight = 0;

  if (options.type === "image" && typeof options.image === "string" && options.image) {
    const bytes = dataUrlToBytes(options.image);
    image = options.image.includes("image/png")
      ? await doc.embedPng(bytes)
      : await doc.embedJpg(bytes);
    imageWidth = image.width;
    imageHeight = image.height;
  }

  const text = String(options.text || "CONFIDENTIAL");

  for (let i = fromPage; i <= toPage; i++) {
    const page = doc.getPage(i - 1);
    const { width, height } = page.getSize();

    const isDiagonal = options.position === "diagonal";
    const rotation = isDiagonal ? 45 : baseRotation;

    if (image) {
      const scale = Math.min((width * 0.5) / imageWidth, (height * 0.5) / imageHeight, 1);
      const drawWidth = imageWidth * scale;
      const drawHeight = imageHeight * scale;
      const position = anchorPosition(
        (isDiagonal ? "center" : options.position || "middle-center") as Anchor,
        width,
        height,
        drawWidth,
        drawHeight,
        30
      );
      page.drawImage(image, {
        x: position.x,
        y: position.y,
        width: drawWidth,
        height: drawHeight,
        opacity,
        rotate: degrees(rotation),
      });
      continue;
    }

    const textWidth = font.widthOfTextAtSize(text, size);
    const textHeight = font.heightAtSize(size);
    const position = anchorPosition(
      (isDiagonal ? "center" : options.position || "middle-center") as Anchor,
      width,
      height,
      textWidth,
      textHeight,
      30
    );

    if (options.mosaic) {
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 3; col++) {
          page.drawText(text, {
            x: (width / 3) * col + 20,
            y: (height / 4) * row + 20,
            size: Math.min(size, 24),
            font,
            color,
            opacity,
            rotate: degrees(rotation),
          });
        }
      }
    } else {
      page.drawText(text, {
        x: position.x,
        y: position.y,
        size,
        font,
        color,
        opacity,
        rotate: degrees(rotation),
      });
    }
  }

  return pdfResult(doc, options.outputFilename || "watermarked.pdf");
}

export async function signPdf(files: File[], options: Opts): Promise<ToolResult> {
  const file = files[0];
  if (!file) throw new Error("Select a PDF file.");

  const doc = await loadPdf(file);
  const total = pageCount(doc);
  const pageNumber =
    options.page === "last" ? total : Math.min(total, Math.max(1, Number(options.page) || total));
  const page = doc.getPage(pageNumber - 1);
  const { width, height } = page.getSize();

  const margin = 40;
  const anchor =
    options.position === "top-right"
      ? "top-right"
      : options.position === "bottom-center"
        ? "bottom-center"
        : "bottom-right";

  if (typeof options.signatureImage === "string" && options.signatureImage) {
    const bytes = dataUrlToBytes(options.signatureImage);
    const isPng = options.signatureImage.includes("image/png");
    const img = isPng ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
    const drawWidth = Math.min(180, width * 0.35);
    const drawHeight = (img.height / img.width) * drawWidth;
    const position = anchorPosition(anchor as Anchor, width, height, drawWidth, drawHeight, margin);
    page.drawImage(img, {
      x: position.x,
      y: position.y,
      width: drawWidth,
      height: drawHeight,
    });
  } else {
    const font = await doc.embedFont(StandardFonts.HelveticaOblique);
    const text = String(options.nameText || "");
    const size = 20;
    const textWidth = font.widthOfTextAtSize(text, size);
    const position = anchorPosition(anchor as Anchor, width, height, textWidth, size, margin);
    page.drawText(text, { x: position.x, y: position.y, size, font, color: rgb(0.05, 0.05, 0.1) });
  }

  return pdfResult(doc, options.outputFilename || "signed.pdf");
}

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/* ------------------------------------------------------------------ */
/* Security / repair / compress                                        */
/* ------------------------------------------------------------------ */

export async function unlockPdf(files: File[], options: Opts): Promise<ToolResult> {
  const file = files[0];
  if (!file) throw new Error("Select a PDF file.");

  const bytes = new Uint8Array(await file.arrayBuffer());
  try {
    // Owner-password PDFs are readable without decrypting; re-saving drops the
    // restrictions. User-password PDFs cannot be opened in the browser.
    const doc = await PDFDocument.load(bytes, {
      ignoreEncryption: true,
      updateMetadata: false,
      throwOnInvalidObject: false,
    });
    return pdfResult(doc, options.outputFilename || "unlocked.pdf");
  } catch {
    throw new Error(
      "This PDF requires its user password to open. Browsers cannot decrypt password-protected files locally."
    );
  }
}

export async function repairPdf(files: File[], options: Opts): Promise<ToolResult> {
  const file = files[0];
  if (!file) throw new Error("Select a PDF file.");

  const bytes = new Uint8Array(await file.arrayBuffer());
  try {
    const doc = await PDFDocument.load(bytes, {
      ignoreEncryption: true,
      updateMetadata: false,
      throwOnInvalidObject: false,
    });
    return pdfResult(doc, options.outputFilename || "repaired.pdf");
  } catch {
    throw new Error("This PDF is too damaged to be rebuilt in the browser.");
  }
}

export async function pdfForms(files: File[], options: Opts): Promise<ToolResult> {
  const file = files[0];
  if (!file) throw new Error("Select a PDF form.");

  const doc = await loadPdf(file);
  const form = doc.getForm();
  const fields = form.getFields();

  if (fields.length === 0) {
    throw new Error("This document does not contain any interactive form fields.");
  }

  if (options.flatten !== false) {
    form.flatten();
  }

  return pdfResult(doc, options.outputFilename || "forms.pdf");
}

const COMPRESSION_PROFILES: Record<string, { dpi: number; quality: number }> = {
  less: { dpi: 150, quality: 0.86 },
  recommended: { dpi: 110, quality: 0.7 },
  extreme: { dpi: 72, quality: 0.45 },
};

export async function compressPdf(
  files: File[],
  options: Opts,
  onProgress?: (percent: number) => void
): Promise<ToolResult> {
  const file = files[0];
  if (!file) throw new Error("Select a PDF file.");

  const profile = COMPRESSION_PROFILES[options.level as string] || COMPRESSION_PROFILES.recommended;
  const pdf = await openPdfDocument(file);
  const output = await PDFDocument.create();

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1 });

    const rendered = await renderPage(pdf, i, profile.dpi);
    const jpeg = await canvasToBytes(rendered.canvas, "image/jpeg", profile.quality);
    rendered.canvas.width = 0;
    rendered.canvas.height = 0;

    const embedded = await output.embedJpg(jpeg);
    const added = output.addPage([viewport.width, viewport.height]);
    added.drawImage(embedded, {
      x: 0,
      y: 0,
      width: viewport.width,
      height: viewport.height,
    });

    onProgress?.(Math.round((i / pdf.numPages) * 100));
  }

  return pdfResult(output, options.outputFilename || "compressed.pdf");
}
