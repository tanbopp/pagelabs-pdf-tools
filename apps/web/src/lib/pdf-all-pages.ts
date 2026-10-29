"use client";

let pdfjsLib: typeof import("pdfjs-dist") | null = null;

async function getPdfJs() {
  if (pdfjsLib) return pdfjsLib;
  const pdfjs = await import("pdfjs-dist");
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    if (typeof window !== "undefined") {
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    } else {
      pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
    }
  }
  pdfjsLib = pdfjs;
  return pdfjsLib;
}

/**
 * Extracts ALL pages of a PDF File as an array of data URLs (for Organize PDF)
 */
export async function getAllPdfPagesPreviews(
  file: File,
  onProgress?: (current: number, total: number) => void
): Promise<string[]> {
  const pdfjs = await getPdfJs();
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(arrayBuffer),
    useWorkerFetch: false,
    isEvalSupported: false,
  });

  const pdfDocument = await loadingTask.promise;
  const numPages = pdfDocument.numPages;
  const previews: string[] = [];

  for (let i = 1; i <= numPages; i++) {
    const page = await pdfDocument.getPage(i);
    const unscaledViewport = page.getViewport({ scale: 1 });
    const targetWidth = 280;
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

    const dataUrl = canvas.toDataURL("image/webp", 0.8) || canvas.toDataURL("image/jpeg", 0.8);
    previews.push(dataUrl);

    canvas.width = 0;
    canvas.height = 0;

    if (onProgress) {
      onProgress(i, numPages);
    }
  }

  return previews;
}
