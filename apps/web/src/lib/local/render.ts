"use client";

/**
 * Client-side PDF rasterisation helpers built on pdfjs-dist.
 *
 * Everything in this module runs in the browser. No bytes ever leave the
 * user's machine.
 */

type PdfJsModule = typeof import("pdfjs-dist");
type PdfDocument = Awaited<ReturnType<PdfJsModule["getDocument"]>["promise"]>;

let pdfjsPromise: Promise<PdfJsModule> | null = null;

export async function getPdfJs(): Promise<PdfJsModule> {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist").then((pdfjs) => {
      if (!pdfjs.GlobalWorkerOptions.workerSrc) {
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      }
      return pdfjs;
    });
  }
  return pdfjsPromise;
}

export async function openPdfDocument(
  source: File | Uint8Array | ArrayBuffer
): Promise<PdfDocument> {
  const pdfjs = await getPdfJs();
  let data: Uint8Array;
  if (source instanceof File) {
    data = new Uint8Array(await source.arrayBuffer());
  } else if (source instanceof ArrayBuffer) {
    data = new Uint8Array(source);
  } else {
    data = source;
  }

  return pdfjs.getDocument({
    data,
    useWorkerFetch: false,
    isEvalSupported: false,
    disableFontFace: false,
  }).promise;
}

export interface RenderedPage {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
}

/**
 * Render a single page at the requested DPI (72 DPI == PDF user units).
 */
export async function renderPage(
  pdf: PdfDocument,
  pageNumber: number,
  dpi = 150
): Promise<RenderedPage> {
  const page = await pdf.getPage(pageNumber);
  const scale = dpi / 72;
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D context is not available in this browser.");

  canvas.width = Math.max(1, Math.floor(viewport.width));
  canvas.height = Math.max(1, Math.floor(viewport.height));

  // White background so JPEG export does not turn transparency black.
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);

  await page.render({ canvasContext: context, viewport }).promise;

  return { canvas, width: canvas.width, height: canvas.height };
}

export async function canvasToBytes(
  canvas: HTMLCanvasElement,
  type: "image/jpeg" | "image/png",
  quality = 0.85
): Promise<Uint8Array> {
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), type, quality)
  );
  if (!blob) throw new Error("Failed to encode the rendered page.");
  return new Uint8Array(await blob.arrayBuffer());
}

export interface PdfTextItem {
  text: string;
  transform: number[];
  width: number;
  height: number;
}

export interface PdfPageText {
  pageNumber: number;
  lines: string[];
  items: PdfTextItem[];
  width: number;
  height: number;
}

/**
 * Extract text content from a PDF, grouped into visual lines.
 */
export async function extractPdfText(pdf: PdfDocument): Promise<PdfPageText[]> {
  const pages: PdfPageText[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();

    const rows: { y: number; parts: { x: number; text: string }[] }[] = [];
    const items: PdfTextItem[] = [];

    for (const item of content.items) {
      if (!("str" in item)) continue;
      const anyItem = item as unknown as {
        str: string;
        transform: number[];
        width: number;
        height: number;
      };
      if (!anyItem.str || !anyItem.str.trim()) continue;
      items.push({
        text: anyItem.str,
        transform: anyItem.transform,
        width: anyItem.width,
        height: anyItem.height,
      });

      const y = Math.round(anyItem.transform[5]);
      const x = anyItem.transform[4];
      let row = rows.find((r) => Math.abs(r.y - y) <= 2);
      if (!row) {
        row = { y, parts: [] };
        rows.push(row);
      }
      row.parts.push({ x, text: anyItem.str });
    }

    rows.sort((a, b) => b.y - a.y);
    const lines = rows.map((row) =>
      row.parts
        .sort((a, b) => a.x - b.x)
        .map((p) => p.text)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim()
    );

    pages.push({
      pageNumber: i,
      lines: lines.filter(Boolean),
      items,
      width: viewport.width,
      height: viewport.height,
    });
  }

  return pages;
}
