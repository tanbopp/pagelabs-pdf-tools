"use client";

import { PDFDocument } from "pdf-lib";
import JSZip from "jszip";
import { baseName, pdfResult, toBlob, type ToolResult } from "./pdf";
import { canvasToBytes, extractPdfText, openPdfDocument, renderPage } from "./render";
import type { Opts } from "./tools-pdf";

const PAGE_SIZES = {
  a4: { width: 595.28, height: 841.89 },
  letter: { width: 612, height: 792 },
} as const;

const MARGINS = { none: 0, small: 18, big: 48 } as const;

function browserLimitation(feature: string): never {
  throw new Error(
    `Browser limitations: ${feature} needs a full document engine (LibreOffice/Ghostscript). ` +
      `Please use our API version for this conversion.`
  );
}

/* ------------------------------------------------------------------ */
/* Images -> PDF                                                       */
/* ------------------------------------------------------------------ */

export async function imagesToPdf(files: File[], options: Opts): Promise<ToolResult> {
  if (files.length === 0) throw new Error("Add at least one image.");

  const doc = await PDFDocument.create();
  const pageSize = (options.pageSize || "a4") as "a4" | "letter" | "fit";
  const margin = MARGINS[(options.margin || "none") as keyof typeof MARGINS] ?? 0;

  for (const file of files) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const isPng = file.type.includes("png") || file.name.toLowerCase().endsWith(".png");
    const image = isPng ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);

    if (pageSize === "fit") {
      const page = doc.addPage([image.width + margin * 2, image.height + margin * 2]);
      page.drawImage(image, {
        x: margin,
        y: margin,
        width: image.width,
        height: image.height,
      });
      continue;
    }

    const base = PAGE_SIZES[pageSize] ?? PAGE_SIZES.a4;
    const landscape = options.orientation === "landscape";
    const width = landscape ? base.height : base.width;
    const height = landscape ? base.width : base.height;
    const page = doc.addPage([width, height]);

    const scale = Math.min(
      (width - margin * 2) / image.width,
      (height - margin * 2) / image.height
    );
    const drawWidth = image.width * scale;
    const drawHeight = image.height * scale;

    page.drawImage(image, {
      x: (width - drawWidth) / 2,
      y: (height - drawHeight) / 2,
      width: drawWidth,
      height: drawHeight,
    });
  }

  return pdfResult(doc, options.outputFilename || "images.pdf");
}

/* ------------------------------------------------------------------ */
/* HEIC -> JPG                                                         */
/* ------------------------------------------------------------------ */

export async function heicToJpg(files: File[], options: Opts): Promise<ToolResult> {
  if (files.length === 0) throw new Error("Add at least one HEIC photo.");

  const heic2any = (await import("heic2any")).default;
  const base = (options.outputFilename || "converted_photos.zip").replace(/\.zip$/i, "");
  const quality = options.quality === "low" ? 0.6 : options.quality === "medium" ? 0.8 : 0.95;

  const converted: { name: string; blob: Blob }[] = [];

  for (const file of files) {
    const result = await heic2any({
      blob: file,
      toType: "image/jpeg",
      quality,
    });
    const blob = Array.isArray(result) ? result[0] : result;
    converted.push({
      name: `${baseName(file.name)}.jpg`,
      blob: blob as Blob,
    });
  }

  if (converted.length === 1) {
    return { blob: converted[0].blob, filename: converted[0].name };
  }

  const zip = new JSZip();
  for (const item of converted) {
    zip.file(item.name, await item.blob.arrayBuffer());
  }
  return { blob: await zip.generateAsync({ type: "blob" }), filename: `${base}.zip` };
}

/* ------------------------------------------------------------------ */
/* PDF -> images                                                       */
/* ------------------------------------------------------------------ */

export async function pdfToImages(
  files: File[],
  options: Opts,
  onProgress?: (percent: number) => void
): Promise<ToolResult> {
  const file = files[0];
  if (!file) throw new Error("Select a PDF file.");

  const dpi = Number(options.dpi) || 150;
  const format = (options.format || "jpg").toLowerCase() === "png" ? "png" : "jpeg";
  const extension = format === "png" ? "png" : "jpg";
  const mime = format === "png" ? "image/png" : "image/jpeg";
  const base = (options.outputFilename || "extracted.zip").replace(/\.zip$/i, "");

  const pdf = await openPdfDocument(file);
  const entries: { name: string; data: Uint8Array }[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const rendered = await renderPage(pdf, i, dpi);
    const bytes = await canvasToBytes(rendered.canvas, mime as "image/jpeg" | "image/png", 0.9);
    rendered.canvas.width = 0;
    rendered.canvas.height = 0;
    entries.push({
      name: `${base}_page_${String(i).padStart(2, "0")}.${extension}`,
      data: bytes,
    });
    onProgress?.(Math.round((i / pdf.numPages) * 100));
  }

  if (entries.length === 1) {
    return {
      blob: toBlob(entries[0].data, mime),
      filename: entries[0].name,
    };
  }

  const zip = new JSZip();
  for (const entry of entries) zip.file(entry.name, entry.data);
  return { blob: await zip.generateAsync({ type: "blob" }), filename: `${base}.zip` };
}

/* ------------------------------------------------------------------ */
/* PDF -> Word / Excel / PowerPoint                                    */
/* ------------------------------------------------------------------ */

export async function pdfToWord(files: File[], options: Opts): Promise<ToolResult> {
  const file = files[0];
  if (!file) throw new Error("Select a PDF file.");

  const pdf = await openPdfDocument(file);
  const pages = await extractPdfText(pdf);

  const { Document, Packer, Paragraph, TextRun } = await import("docx");

  const paragraphs: InstanceType<typeof Paragraph>[] = [];
  pages.forEach((page, index) => {
    if (index > 0) {
      paragraphs.push(new Paragraph({ text: "", pageBreakBefore: true }));
    }
    for (const line of page.lines) {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: line, size: 22 })],
          spacing: { after: 120 },
        })
      );
    }
  });

  const doc = new Document({ sections: [{ children: paragraphs }] });
  const blob = await Packer.toBlob(doc);

  return {
    blob,
    filename: options.outputFilename || "document.docx",
  };
}

export async function pdfToExcel(files: File[], options: Opts): Promise<ToolResult> {
  const file = files[0];
  if (!file) throw new Error("Select a PDF file.");

  const pdf = await openPdfDocument(file);
  const pages = await extractPdfText(pdf);
  const XLSX = await import("xlsx");

  const workbook = XLSX.utils.book_new();
  pages.forEach((page) => {
    const rows = page.lines.map((line) => splitRow(line));
    const sheet = XLSX.utils.aoa_to_sheet(rows);
    const name = `Page ${page.pageNumber}`.slice(0, 31);
    XLSX.utils.book_append_sheet(workbook, sheet, name);
  });

  const out = XLSX.write(workbook, { bookType: "xlsx", type: "array" }) as ArrayBuffer;

  return {
    blob: toBlob(new Uint8Array(out), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
    filename: options.outputFilename || "spreadsheet.xlsx",
  };
}

/** Split a text line into cells: two or more spaces, tabs, or pipes. */
function splitRow(line: string): string[] {
  const cells = line
    .split(/\t+|\s{2,}|\s*\|\s*/)
    .map((cell) => cell.trim())
    .filter((cell) => cell.length > 0);
  return cells.length > 0 ? cells : [line];
}

export async function pdfToPowerpoint(
  files: File[],
  options: Opts,
  onProgress?: (percent: number) => void
): Promise<ToolResult> {
  const file = files[0];
  if (!file) throw new Error("Select a PDF file.");

  const pdf = await openPdfDocument(file);
  const { default: PptxGenJS } = await import("pptxgenjs");
  const deck = new PptxGenJS();

  const firstViewport = (await pdf.getPage(1)).getViewport({ scale: 1 });
  const landscape = firstViewport.width >= firstViewport.height;
  const slideWidth = 10;
  const slideHeight = landscape ? 7.5 : (slideWidth * firstViewport.height) / firstViewport.width;
  deck.defineLayout({ name: "CUSTOM", width: slideWidth, height: slideHeight });
  deck.layout = "CUSTOM";

  for (let i = 1; i <= pdf.numPages; i++) {
    const rendered = await renderPage(pdf, i, 150);
    const dataUrl = rendered.canvas.toDataURL("image/jpeg", 0.9);
    rendered.canvas.width = 0;
    rendered.canvas.height = 0;

    const slide = deck.addSlide();
    slide.addImage({ data: dataUrl, x: 0, y: 0, w: slideWidth, h: slideHeight });
    onProgress?.(Math.round((i / pdf.numPages) * 100));
  }

  const out = (await deck.write({ outputType: "blob" })) as Blob;

  return {
    blob: out,
    filename: options.outputFilename || "presentation.pptx",
  };
}

/* ------------------------------------------------------------------ */
/* Office -> PDF (best effort, text only)                              */
/* ------------------------------------------------------------------ */

export async function excelToPdf(files: File[], options: Opts): Promise<ToolResult> {
  const file = files[0];
  if (!file) throw new Error("Select a spreadsheet.");

  const XLSX = await import("xlsx");
  const workbook = XLSX.read(new Uint8Array(await file.arrayBuffer()), { type: "array" });
  const { jsPDF } = await import("jspdf");

  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 40;
  let y = margin;

  for (const sheetName of workbook.SheetNames) {
    const rows = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[sheetName], {
      header: 1,
      blankrows: false,
      defval: "",
    });

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(13);
    pdf.text(sheetName, margin, y);
    y += 20;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);

    for (const row of rows) {
      const line = row
        .map((cell) => (cell === null || cell === undefined ? "" : String(cell)))
        .join("  |  ");
      const wrapped = pdf.splitTextToSize(line, 515) as string[];
      for (const part of wrapped) {
        if (y > 800) {
          pdf.addPage();
          y = margin;
        }
        pdf.text(part, margin, y);
        y += 13;
      }
      y += 3;
    }

    y += 16;
  }

  return { blob: pdf.output("blob"), filename: options.outputFilename || "converted.pdf" };
}

async function readOfficeXmlText(file: File, path: RegExp): Promise<string[]> {
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const paragraphs: string[] = [];

  const names = Object.keys(zip.files)
    .filter((name) => path.test(name))
    .sort((a, b) => {
      const na = Number(a.match(/(\d+)/)?.[1] ?? 0);
      const nb = Number(b.match(/(\d+)/)?.[1] ?? 0);
      return na - nb;
    });

  for (const name of names) {
    const xml = await zip.files[name].async("string");
    const blocks = xml.split(/<\/w:p>|<\/a:p>/);
    for (const block of blocks) {
      const text = Array.from(block.matchAll(/<(?:w|a):t[^>]*>([\s\S]*?)<\/(?:w|a):t>/g))
        .map((m) => decodeXml(m[1]))
        .join("");
      if (text.trim()) paragraphs.push(text.trim());
    }
  }

  return paragraphs;
}

function decodeXml(value: string): string {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

export async function wordToPdf(files: File[], options: Opts): Promise<ToolResult> {
  const file = files[0];
  if (!file) throw new Error("Select a Word document.");

  const paragraphs = await readOfficeXmlText(file, /^word\/document\.xml$/);
  if (paragraphs.length === 0) browserLimitation("Word conversion");

  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 56;
  let y = margin;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);

  for (const paragraph of paragraphs) {
    const lines = pdf.splitTextToSize(paragraph, 480) as string[];
    for (const line of lines) {
      if (y > 780) {
        pdf.addPage();
        y = margin;
      }
      pdf.text(line, margin, y);
      y += 15;
    }
    y += 6;
  }

  return { blob: pdf.output("blob"), filename: options.outputFilename || "converted.pdf" };
}

export async function powerpointToPdf(files: File[], options: Opts): Promise<ToolResult> {
  const file = files[0];
  if (!file) throw new Error("Select a presentation.");

  const paragraphs = await readOfficeXmlText(file, /^ppt\/slides\/slide\d+\.xml$/);
  if (paragraphs.length === 0) browserLimitation("PowerPoint conversion");

  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ unit: "pt", format: "a4", orientation: "landscape" });
  const width = pdf.internal.pageSize.getWidth();
  const height = pdf.internal.pageSize.getHeight();
  const margin = 48;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(16);

  let y = margin;
  for (const paragraph of paragraphs) {
    const lines = pdf.splitTextToSize(paragraph, width - margin * 2) as string[];
    for (const line of lines) {
      if (y > height - margin) {
        pdf.addPage();
        y = margin;
      }
      pdf.text(line, margin, y);
      y += 22;
    }
    y += 10;
  }

  return { blob: pdf.output("blob"), filename: options.outputFilename || "converted.pdf" };
}

/* ------------------------------------------------------------------ */
/* OCR                                                                 */
/* ------------------------------------------------------------------ */

export async function ocrPdf(
  files: File[],
  options: Opts,
  onProgress?: (percent: number) => void
): Promise<ToolResult> {
  const file = files[0];
  if (!file) throw new Error("Select a PDF file.");

  const languages: string[] = Array.isArray(options.languages)
    ? options.languages
    : [options.language || "eng"];
  const lang = languages.join("+");

  const Tesseract = await import("tesseract.js");
  const pdf = await openPdfDocument(file);
  const output = await PDFDocument.create();
  const font = await output.embedFont("Helvetica");

  const worker = await Tesseract.createWorker(lang, 1, {
    // Self-hosted worker + core: the CDN copies are blocked by the CSP, which
    // surfaced as "Failed to fetch" / importScripts errors.
    workerPath: "/tesseract/worker.min.js",
    corePath: "/tesseract/tesseract-core-simd-lstm.wasm.js",
    logger: (message) => {
      if (message.status === "recognizing text" && typeof message.progress === "number") {
        onProgress?.(Math.round(message.progress * 100));
      }
    },
  }).catch((err: unknown) => {
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(
      `OCR could not start (${detail}). The language data is downloaded once on first use — ` +
        `check your connection and try again.`
    );
  });

  try {
    for (let i = 1; i <= pdf.numPages; i++) {
      const rendered = await renderPage(pdf, i, 150);
      const jpeg = await canvasToBytes(rendered.canvas, "image/jpeg", 0.85);
      const pageWidth = rendered.width / (150 / 72);
      const pageHeight = rendered.height / (150 / 72);

      const embedded = await output.embedJpg(jpeg);
      const page = output.addPage([pageWidth, pageHeight]);
      page.drawImage(embedded, { x: 0, y: 0, width: pageWidth, height: pageHeight });

      const { data } = await worker.recognize(rendered.canvas).catch((err: unknown) => {
        const detail = err instanceof Error ? err.message : String(err);
        throw new Error(`OCR failed on page ${i}: ${detail}`);
      });
      const words = (data as unknown as { words?: { text: string; bbox: { x0: number; y0: number; x1: number; y1: number } }[] }).words;

      if (Array.isArray(words) && words.length > 0) {
        for (const word of words) {
          if (!word.text.trim()) continue;
          const scaleX = pageWidth / rendered.width;
          const scaleY = pageHeight / rendered.height;
          const size = Math.max(4, (word.bbox.y1 - word.bbox.y0) * scaleY * 0.85);
          try {
            page.drawText(word.text, {
              x: word.bbox.x0 * scaleX,
              y: pageHeight - word.bbox.y1 * scaleY,
              size,
              font,
              opacity: 0,
            });
          } catch {
            // Unsupported glyphs are skipped – the image still contains them.
          }
        }
      } else if (data.text.trim()) {
        page.drawText(data.text.slice(0, 4000), {
          x: 10,
          y: pageHeight - 16,
          size: 8,
          font,
          opacity: 0,
        });
      }

      rendered.canvas.width = 0;
      rendered.canvas.height = 0;
    }
  } finally {
    await worker.terminate();
  }

  return pdfResult(output, options.outputFilename || "ocr.pdf");
}

/* ------------------------------------------------------------------ */
/* Compare                                                             */
/* ------------------------------------------------------------------ */

export async function comparePdf(
  files: File[],
  options: Opts,
  onProgress?: (percent: number) => void
): Promise<ToolResult> {
  if (files.length < 2) throw new Error("Select two PDF files to compare.");

  const [docA, docB] = await Promise.all([
    openPdfDocument(files[0]),
    openPdfDocument(files[1]),
  ]);

  const total = Math.max(docA.numPages, docB.numPages);
  const base = (options.outputFilename || "comparison.pdf").replace(/\.pdf$/i, "");
  const report = await PDFDocument.create();

  for (let i = 1; i <= total; i++) {
    const canvasA = i <= docA.numPages ? (await renderPage(docA, i, 110)).canvas : null;
    const canvasB = i <= docB.numPages ? (await renderPage(docB, i, 110)).canvas : null;

    const width = Math.max(canvasA?.width ?? 0, canvasB?.width ?? 0);
    const height = Math.max(canvasA?.height ?? 0, canvasB?.height ?? 0);

    const diffCanvas = document.createElement("canvas");
    diffCanvas.width = width;
    diffCanvas.height = height;
    const ctx = diffCanvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context is unavailable.");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    ctx.drawImage(
      canvasA ?? createBlank(width, height),
      0,
      0
    );

    if (canvasB) {
      const imageA = ctx.getImageData(0, 0, width, height);
      const scratch = document.createElement("canvas");
      scratch.width = width;
      scratch.height = height;
      const scratchCtx = scratch.getContext("2d");
      if (scratchCtx) {
        scratchCtx.drawImage(canvasB, 0, 0);
        const imageB = scratchCtx.getImageData(0, 0, width, height);
        for (let p = 0; p < imageA.data.length; p += 4) {
          const dr = Math.abs(imageA.data[p] - imageB.data[p]);
          const dg = Math.abs(imageA.data[p + 1] - imageB.data[p + 1]);
          const db = Math.abs(imageA.data[p + 2] - imageB.data[p + 2]);
          if (dr + dg + db > 90) {
            imageA.data[p] = 225;
            imageA.data[p + 1] = 29;
            imageA.data[p + 2] = 72;
            imageA.data[p + 3] = 255;
          }
        }
        ctx.putImageData(imageA, 0, 0);
      }
    }

    const bytes = await canvasToBytes(diffCanvas, "image/png");

    const embedded = await report.embedPng(bytes);
    const scale = Math.min(1, 595 / embedded.width);
    const reportPage = report.addPage([embedded.width * scale, embedded.height * scale]);
    reportPage.drawImage(embedded, {
      x: 0,
      y: 0,
      width: embedded.width * scale,
      height: embedded.height * scale,
    });

    diffCanvas.width = 0;
    diffCanvas.height = 0;
    if (canvasA) {
      canvasA.width = 0;
      canvasA.height = 0;
    }
    if (canvasB) {
      canvasB.width = 0;
      canvasB.height = 0;
    }
    onProgress?.(Math.round((i / total) * 100));
  }

  return pdfResult(report, `${base}.pdf`);
}

function createBlank(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
  }
  return canvas;
}

/* ------------------------------------------------------------------ */
/* Redact (true raster redaction)                                      */
/* ------------------------------------------------------------------ */

export async function redactPdf(
  files: File[],
  options: Opts,
  onProgress?: (percent: number) => void
): Promise<ToolResult> {
  const file = files[0];
  if (!file) throw new Error("Select a PDF file.");

  const rawTerms = options.terms;
  const terms: string[] = Array.isArray(rawTerms)
    ? rawTerms.map(String)
    : String(rawTerms || "")
        .split(/[,\n]/)
        .map((t) => t.trim())
        .filter(Boolean);

  if (terms.length === 0) throw new Error("Enter at least one word or phrase to redact.");

  const pdf = await openPdfDocument(file);
  const output = await PDFDocument.create();

  for (let i = 1; i <= pdf.numPages; i++) {
    const dpi = 150;
    const rendered = await renderPage(pdf, i, dpi);
    const ctx = rendered.canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context is unavailable.");

    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const scale = dpi / 72;

    const lowerTerms = terms.map((t) => t.toLowerCase());

    for (const item of content.items) {
      if (!("str" in item)) continue;
      const textItem = item as unknown as {
        str: string;
        transform: number[];
        width: number;
        height: number;
      };
      const haystack = textItem.str.toLowerCase();
      const matches = lowerTerms.filter((term) => haystack.includes(term));
      if (matches.length === 0) continue;

      const x = textItem.transform[4] * scale;
      const yPdf = textItem.transform[5] * scale;
      const w = textItem.width * scale;
      const h = (textItem.height || 10) * scale;

      ctx.fillStyle = "#000000";
      ctx.fillRect(x, rendered.height - yPdf - h, w, h);
    }

    const png = await canvasToBytes(rendered.canvas, "image/png");
    const embedded = await output.embedPng(png);
    const pageWidth = rendered.width / scale;
    const pageHeight = rendered.height / scale;
    const outPage = output.addPage([pageWidth, pageHeight]);
    outPage.drawImage(embedded, { x: 0, y: 0, width: pageWidth, height: pageHeight });

    rendered.canvas.width = 0;
    rendered.canvas.height = 0;
    onProgress?.(Math.round((i / pdf.numPages) * 100));
  }

  return pdfResult(output, options.outputFilename || "redacted.pdf");
}
