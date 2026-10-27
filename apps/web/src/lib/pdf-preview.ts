"use client";

let pdfjsLib: typeof import("pdfjs-dist") | null = null;

async function getPdfJs() {
  if (pdfjsLib) return pdfjsLib;

  // Dynamically import pdfjs-dist only on client side
  const pdfjs = await import("pdfjs-dist");
  
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    // Use unpkg / cdnjs worker matching pdfjs-dist version
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  }

  pdfjsLib = pdfjs;
  return pdfjsLib;
}

const previewCache = new WeakMap<File, string>();

/**
 * Extracts the first page of a PDF File as a base64 Data URL (JPEG/PNG)
 */
export async function getPdfFirstPagePreview(file: File, targetWidth = 300): Promise<string> {
  const cacheKey = `${file.name}-${file.size}-${file.lastModified}-${targetWidth}`;
  if ((file as any)[`__preview_${targetWidth}`]) {
    return (file as any)[`__preview_${targetWidth}`];
  }

  try {
    const pdfjs = await getPdfJs();
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(arrayBuffer),
      useWorkerFetch: false,
      isEvalSupported: false,
    });

    const pdfDocument = await loadingTask.promise;
    const page = await pdfDocument.getPage(1);

    // Calculate viewport for preview
    const unscaledViewport = page.getViewport({ scale: 1 });
    const scale = targetWidth / unscaledViewport.width;
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas context not available");

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({
      canvasContext: context,
      viewport,
    }).promise;

    const dataUrl = canvas.toDataURL("image/webp", 0.85) || canvas.toDataURL("image/jpeg", 0.85);
    (file as any)[`__preview_${targetWidth}`] = dataUrl;

    // Free memory
    canvas.width = 0;
    canvas.height = 0;

    return dataUrl;
  } catch (err) {
    // If PDF has corrupt or unusual font/structure, gracefully fall back to placeholder icon
    return "";
  }
}

export interface PdfPageItem {
  pageNumber: number;
  dataUrl: string;
  width: number;
  height: number;
}

/**
 * Extracts all pages of a PDF File as base64 Data URLs with page dimensions
 */
export async function getPdfAllPagesPreview(
  file: File,
  targetWidth = 720,
  maxPages = 20
): Promise<PdfPageItem[]> {
  try {
    const pdfjs = await getPdfJs();
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(arrayBuffer),
      useWorkerFetch: false,
      isEvalSupported: false,
    });

    const pdfDocument = await loadingTask.promise;
    const totalPages = Math.min(pdfDocument.numPages, maxPages);
    const pages: PdfPageItem[] = [];

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);
      const unscaledViewport = page.getViewport({ scale: 1 });
      const scale = targetWidth / unscaledViewport.width;
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (!context) continue;

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({
        canvasContext: context,
        viewport,
      }).promise;

      const dataUrl = canvas.toDataURL("image/webp", 0.85) || canvas.toDataURL("image/jpeg", 0.85);
      pages.push({
        pageNumber: pageNum,
        dataUrl,
        width: viewport.width,
        height: viewport.height,
      });

      canvas.width = 0;
      canvas.height = 0;
    }

    return pages;
  } catch (err) {
    return [];
  }
}

