import { z } from "zod";

export type ToolCategory =
  | "organize"
  | "optimize"
  | "convert-to"
  | "convert-from"
  | "edit"
  | "security"
  | "ai";

export interface ToolDefinition {
  slug: string;
  name: string;
  description: string;
  category: ToolCategory;
  icon: string; // lucide icon identifier
  accept: string;
  minFiles: number;
  maxFiles: number;
  maxSizeMB: number;
  available: boolean;
  optionsSchema?: z.ZodTypeAny;
}

// 1. Merge PDF Options Schema
export const mergePdfOptionsSchema = z.object({
  outputFilename: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-zA-Z0-9._-]+$/, "Only alphanumeric, dash, underscore, and dot allowed")
    .refine((val) => val.endsWith(".pdf"), "Output filename must end with .pdf")
    .default("merged.pdf"),
  addBookmarks: z.boolean().default(false),
});
export type MergePdfOptions = z.infer<typeof mergePdfOptionsSchema>;

// 2. Split PDF Options Schema (PRD 2 §2.1)
export const splitPdfOptionsSchema = z.object({
  mode: z.enum(["visual", "ranges", "interval", "all"]).default("visual"),
  pages: z
    .array(
      z.object({
        originalIndex: z.number().int().nonnegative(),
        name: z.string().optional(),
      })
    )
    .optional(),
  ranges: z.string().optional(), // e.g. "1-3, 5, 8-10"
  interval: z.number().int().positive().optional(), // e.g. 2
  outputFilename: z.string().optional().default("split.zip"),
});
export type SplitPdfOptions = z.infer<typeof splitPdfOptionsSchema>;

// 3. Remove Pages Options Schema (PRD 2 §2.2)
export const removePagesOptionsSchema = z.object({
  pages: z.string().min(1, "Pages to remove cannot be empty"), // e.g. "1, 3, 5-7"
  outputFilename: z.string().optional().default("removed.pdf"),
});
export type RemovePagesOptions = z.infer<typeof removePagesOptionsSchema>;

// 4. Extract Pages Options Schema (PRD 2 §2.3)
export const extractPagesOptionsSchema = z.object({
  pages: z.string().min(1, "Pages to extract cannot be empty"), // e.g. "1-3, 5"
  separateFiles: z.boolean().default(false),
  outputFilename: z.string().optional().default("extracted.pdf"),
});
export type ExtractPagesOptions = z.infer<typeof extractPagesOptionsSchema>;

// 5. Rotate PDF Options Schema (PRD 2 §2.4)
export const rotatePdfOptionsSchema = z.object({
  mode: z.enum(["all", "select"]).default("all"),
  pages: z.string().optional(), // e.g. "1, 3"
  angle: z.union([z.literal(90), z.literal(180), z.literal(270)]).default(90),
  outputFilename: z.string().optional().default("rotated.pdf"),
});
export type RotatePdfOptions = z.infer<typeof rotatePdfOptionsSchema>;

// 6. Organize PDF Options Schema (PRD 2 §2.5)
export const organizePdfOptionsSchema = z.object({
  pages: z.array(
    z.object({
      originalIndex: z.number().int().nonnegative(),
      rotation: z.number().int().default(0),
    })
  ).min(1, "At least one page must remain"),
  outputFilename: z.string().optional().default("organized.pdf"),
});
export type OrganizePdfOptions = z.infer<typeof organizePdfOptionsSchema>;

// 7. Compress PDF Options Schema (PRD 3 §3.1)
export const compressPdfOptionsSchema = z.object({
  level: z.enum(["less", "recommended", "extreme"]).default("recommended"),
  outputFilename: z.string().optional().default("compressed.pdf"),
});
export type CompressPdfOptions = z.infer<typeof compressPdfOptionsSchema>;

// 8. Repair PDF Options Schema (PRD 3 §3.2)
export const repairPdfOptionsSchema = z.object({
  outputFilename: z.string().optional().default("repaired.pdf"),
});
export type RepairPdfOptions = z.infer<typeof repairPdfOptionsSchema>;

// 9. OCR PDF Options Schema (PRD 3 §3.3)
export const ocrPdfOptionsSchema = z.object({
  language: z.enum(["eng", "ind", "spa", "fra", "deu", "English", "Indonesian", "Spanish", "French", "German"]).default("eng"),
  add_text_layer_only: z.boolean().default(true),
  force_ocr: z.boolean().optional().default(false),
  textLayerOnly: z.boolean().optional(),
  outputFilename: z.string().optional().default("ocr.pdf"),
});
export type OcrPdfOptions = z.infer<typeof ocrPdfOptionsSchema>;

// 10. PDF to PDF/A Options Schema (PRD 3 §3.4)
export const pdfToPdfaOptionsSchema = z.object({
  conformance: z.enum(["2b", "3b", "PDF/A-2b", "PDF/A-3b"]).default("PDF/A-2b"),
  outputFilename: z.string().optional().default("archived.pdf"),
});
export type PdfToPdfaOptions = z.infer<typeof pdfToPdfaOptionsSchema>;

// 11. Word to PDF Options Schema (PRD 4 §4.1)
export const wordToPdfOptionsSchema = z.object({
  outputFilename: z.string().optional().default("converted.pdf"),
});
export type WordToPdfOptions = z.infer<typeof wordToPdfOptionsSchema>;

// 12. Excel to PDF Options Schema (PRD 4 §4.2)
export const excelToPdfOptionsSchema = z.object({
  fitToPage: z.boolean().default(true),
  outputFilename: z.string().optional().default("converted.pdf"),
});
export type ExcelToPdfOptions = z.infer<typeof excelToPdfOptionsSchema>;

// 13. PowerPoint to PDF Options Schema (PRD 4 §4.3)
export const powerpointToPdfOptionsSchema = z.object({
  outputFilename: z.string().optional().default("converted.pdf"),
});
export type PowerpointToPdfOptions = z.infer<typeof powerpointToPdfOptionsSchema>;

// 14. JPG to PDF Options Schema (PRD 4 §4.4)
export const jpgToPdfOptionsSchema = z.object({
  orientation: z.enum(["portrait", "landscape"]).default("portrait"),
  pageSize: z.enum(["a4", "letter", "fit"]).default("a4"),
  margin: z.enum(["none", "small", "big"]).default("none"),
  outputFilename: z.string().optional().default("images.pdf"),
});
export type JpgToPdfOptions = z.infer<typeof jpgToPdfOptionsSchema>;

// 15. HTML to PDF Options Schema (PRD 4 §4.5)
export const htmlToPdfOptionsSchema = z.object({
  pageSize: z.enum(["a4", "letter"]).default("a4"),
  outputFilename: z.string().optional().default("webpage.pdf"),
});
export type HtmlToPdfOptions = z.infer<typeof htmlToPdfOptionsSchema>;

// 16. PDF to Word Options Schema (PRD 5 §5.1)
export const pdfToWordOptionsSchema = z.object({
  ocr: z.boolean().default(false),
  outputFilename: z.string().optional().default("document.docx"),
});
export type PdfToWordOptions = z.infer<typeof pdfToWordOptionsSchema>;

// 17. PDF to Excel Options Schema (PRD 5 §5.2)
export const pdfToExcelOptionsSchema = z.object({
  outputFilename: z.string().optional().default("spreadsheet.xlsx"),
});
export type PdfToExcelOptions = z.infer<typeof pdfToExcelOptionsSchema>;

// 18. PDF to PowerPoint Options Schema (PRD 5 §5.3)
export const pdfToPowerpointOptionsSchema = z.object({
  outputFilename: z.string().optional().default("presentation.pptx"),
});
export type PdfToPowerpointOptions = z.infer<typeof pdfToPowerpointOptionsSchema>;

// 19. PDF to JPG Options Schema (PRD 5 §5.4)
export const pdfToJpgOptionsSchema = z.object({
  dpi: z.union([z.number(), z.string()]).transform((val) => Number(val)).pipe(z.number()).default(150),
  format: z.enum(["jpg", "jpeg", "png"]).default("jpg"),
  outputFilename: z.string().optional().default("extracted.zip"),
});
export type PdfToJpgOptions = z.infer<typeof pdfToJpgOptionsSchema>;

// 20. Protect PDF Options Schema (PRD 6 §6.1)
export const protectPdfOptionsSchema = z.object({
  password: z.string().min(1, "Password is required"),
  allowPrinting: z.boolean().default(false),
  allowCopying: z.boolean().default(false),
  outputFilename: z.string().optional().default("protected.pdf"),
});
export type ProtectPdfOptions = z.infer<typeof protectPdfOptionsSchema>;

// 21. Unlock PDF Options Schema (PRD 6 §6.2)
export const unlockPdfOptionsSchema = z.object({
  password: z.string().min(1, "Password is required"),
  outputFilename: z.string().optional().default("unlocked.pdf"),
});
export type UnlockPdfOptions = z.infer<typeof unlockPdfOptionsSchema>;

// 22. Sign PDF Options Schema (PRD 6 §6.3)
export const signPdfOptionsSchema = z.object({
  page: z.union([z.number(), z.literal("last")]).default("last"),
  position: z.enum(["bottom-right", "bottom-center", "top-right"]).default("bottom-right"),
  nameText: z.string().optional(),
  signatureImage: z.string().optional(), // base64 or storage url
  outputFilename: z.string().optional().default("signed.pdf"),
});
export type SignPdfOptions = z.infer<typeof signPdfOptionsSchema>;

// 23. Redact PDF Options Schema (PRD 6 §6.4)
export const redactPdfOptionsSchema = z.object({
  terms: z.union([z.string(), z.array(z.string())]),
  outputFilename: z.string().optional().default("redacted.pdf"),
});
export type RedactPdfOptions = z.infer<typeof redactPdfOptionsSchema>;

// 24. Scan to PDF Options Schema (PRD 7 §7.1)
export const scanToPdfOptionsSchema = z.object({
  autoDeskew: z.boolean().default(false),
  outputFilename: z.string().optional().default("scan.pdf"),
});
export type ScanToPdfOptions = z.infer<typeof scanToPdfOptionsSchema>;

// 25. Add Page Numbers Options Schema (PRD 7 §7.2)
export const addPageNumbersOptionsSchema = z.object({
  position: z.enum([
    "bottom-center",
    "bottom-right",
    "bottom-left",
    "top-center",
    "top-right",
    "top-left",
  ]).default("bottom-center"),
  startNumber: z.number().int().default(1),
  format: z.enum(["1", "Page 1", "1 / N"]).default("Page 1"),
  outputFilename: z.string().optional().default("numbered.pdf"),
});
export type AddPageNumbersOptions = z.infer<typeof addPageNumbersOptionsSchema>;

// 26. Add Watermark Options Schema (PRD 7 §7.3)
export const addWatermarkOptionsSchema = z.object({
  type: z.enum(["text", "image"]).default("text"),
  text: z.string().optional().default("CONFIDENTIAL"),
  image: z.string().optional(), // base64 or path
  opacity: z.number().min(0.0).max(1.0).default(0.5),
  position: z.enum([
    "center",
    "diagonal",
    "top",
    "bottom",
    "top-left",
    "top-center",
    "top-right",
    "middle-left",
    "middle-center",
    "middle-right",
    "bottom-left",
    "bottom-center",
    "bottom-right",
  ]).default("middle-center"),
  mosaic: z.boolean().optional().default(false),
  rotation: z.number().optional().default(0),
  fontFamily: z.enum(["Helvetica", "Times-Roman", "Courier"]).optional().default("Helvetica"),
  fontSize: z.number().optional().default(44),
  isBold: z.boolean().optional().default(true),
  isItalic: z.boolean().optional().default(false),
  isUnderline: z.boolean().optional().default(false),
  color: z.string().optional().default("#e11d48"),
  fromPage: z.number().optional().default(1),
  toPage: z.number().optional(),
  layer: z.enum(["over", "below"]).optional().default("over"),
  outputFilename: z.string().optional().default("watermarked.pdf"),
});
export type AddWatermarkOptions = z.infer<typeof addWatermarkOptionsSchema>;

// 27. Crop PDF Options Schema (PRD 7 §7.4)
export const cropPdfOptionsSchema = z.object({
  mode: z.enum(["auto", "manual"]).default("auto"),
  top: z.number().nonnegative().default(0),
  bottom: z.number().nonnegative().default(0),
  left: z.number().nonnegative().default(0),
  right: z.number().nonnegative().default(0),
  applyTo: z.enum(["all"]).default("all"),
  outputFilename: z.string().optional().default("cropped.pdf"),
});
export type CropPdfOptions = z.infer<typeof cropPdfOptionsSchema>;

// 28. PDF Forms Options Schema (PRD 7 §7.5)
export const pdfFormsOptionsSchema = z.object({
  flatten: z.boolean().default(true),
  outputFilename: z.string().optional().default("forms.pdf"),
});
export type PdfFormsOptions = z.infer<typeof pdfFormsOptionsSchema>;

// 29. Compare PDF Options Schema (PRD 7 §7.6)
export const comparePdfOptionsSchema = z.object({
  outputFilename: z.string().optional().default("comparison.pdf"),
});
export type ComparePdfOptions = z.infer<typeof comparePdfOptionsSchema>;

export const TOOL_REGISTRY: Record<string, ToolDefinition> = {
  // Organize & Manage (Tahap 1 & Tahap 2)
  "merge-pdf": {
    slug: "merge-pdf",
    name: "Merge PDF",
    description: "Combine PDFs into one.",
    category: "organize",
    icon: "Combine",
    accept: "application/pdf",
    minFiles: 2,
    maxFiles: 20,
    maxSizeMB: 100,
    available: true,
    optionsSchema: mergePdfOptionsSchema,
  },
  "split-pdf": {
    slug: "split-pdf",
    name: "Split PDF",
    description: "Split into separate files.",
    category: "organize",
    icon: "Split",
    accept: "application/pdf",
    minFiles: 1,
    maxFiles: 1,
    maxSizeMB: 100,
    available: true,
    optionsSchema: splitPdfOptionsSchema,
  },
  "remove-pages": {
    slug: "remove-pages",
    name: "Remove Pages",
    description: "Delete specific pages.",
    category: "organize",
    icon: "FileMinus",
    accept: "application/pdf",
    minFiles: 1,
    maxFiles: 1,
    maxSizeMB: 100,
    available: true,
    optionsSchema: removePagesOptionsSchema,
  },
  "extract-pages": {
    slug: "extract-pages",
    name: "Extract Pages",
    description: "Keep only specific pages.",
    category: "organize",
    icon: "FileSpreadsheet",
    accept: "application/pdf",
    minFiles: 1,
    maxFiles: 1,
    maxSizeMB: 100,
    available: true,
    optionsSchema: extractPagesOptionsSchema,
  },
  "organize-pdf": {
    slug: "organize-pdf",
    name: "Organize PDF",
    description: "Reorder, rotate, or delete pages.",
    category: "organize",
    icon: "Layers",
    accept: "application/pdf",
    minFiles: 1,
    maxFiles: 1,
    maxSizeMB: 100,
    available: true,
    optionsSchema: organizePdfOptionsSchema,
  },
  "scan-to-pdf": {
    slug: "scan-to-pdf",
    name: "Scan to PDF",
    description: "Convert photos to PDF.",
    category: "organize",
    icon: "Scan",
    accept: ".jpg,.jpeg,.png,image/jpeg,image/png",
    minFiles: 1,
    maxFiles: 30,
    maxSizeMB: 100,
    available: true,
    optionsSchema: scanToPdfOptionsSchema,
  },
  "rotate-pdf": {
    slug: "rotate-pdf",
    name: "Rotate PDF",
    description: "Rotate pages.",
    category: "organize",
    icon: "RotateCw",
    accept: "application/pdf",
    minFiles: 1,
    maxFiles: 1,
    maxSizeMB: 100,
    available: true,
    optionsSchema: rotatePdfOptionsSchema,
  },

  // Optimize & Repair
  "compress-pdf": {
    slug: "compress-pdf",
    name: "Compress PDF",
    description: "Reduce file size.",
    category: "optimize",
    icon: "Minimize2",
    accept: "application/pdf",
    minFiles: 1,
    maxFiles: 1,
    maxSizeMB: 100,
    available: true,
    optionsSchema: compressPdfOptionsSchema,
  },
  "repair-pdf": {
    slug: "repair-pdf",
    name: "Repair PDF",
    description: "Fix corrupted documents.",
    category: "optimize",
    icon: "Wrench",
    accept: "application/pdf",
    minFiles: 1,
    maxFiles: 1,
    maxSizeMB: 100,
    available: true,
    optionsSchema: repairPdfOptionsSchema,
  },
  "ocr-pdf": {
    slug: "ocr-pdf",
    name: "OCR PDF",
    description: "Make scanned PDFs searchable.",
    category: "optimize",
    icon: "FileSearch",
    accept: "application/pdf",
    minFiles: 1,
    maxFiles: 1,
    maxSizeMB: 100,
    available: true,
    optionsSchema: ocrPdfOptionsSchema,
  },

  // Convert To PDF
  "word-to-pdf": {
    slug: "word-to-pdf",
    name: "Word to PDF",
    description: "Convert Word to PDF.",
    category: "convert-to",
    icon: "FileText",
    accept: ".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    minFiles: 1,
    maxFiles: 20,
    maxSizeMB: 100,
    available: true,
    optionsSchema: wordToPdfOptionsSchema,
  },
  "excel-to-pdf": {
    slug: "excel-to-pdf",
    name: "Excel to PDF",
    description: "Convert Excel to PDF.",
    category: "convert-to",
    icon: "Table",
    accept: ".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    minFiles: 1,
    maxFiles: 20,
    maxSizeMB: 100,
    available: true,
    optionsSchema: excelToPdfOptionsSchema,
  },
  "powerpoint-to-pdf": {
    slug: "powerpoint-to-pdf",
    name: "PowerPoint to PDF",
    description: "Convert slides to PDF.",
    category: "convert-to",
    icon: "Presentation",
    accept: ".ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation",
    minFiles: 1,
    maxFiles: 20,
    maxSizeMB: 100,
    available: true,
    optionsSchema: powerpointToPdfOptionsSchema,
  },
  "jpg-to-pdf": {
    slug: "jpg-to-pdf",
    name: "JPG to PDF",
    description: "Convert images to PDF.",
    category: "convert-to",
    icon: "Image",
    accept: ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp",
    minFiles: 1,
    maxFiles: 20,
    maxSizeMB: 100,
    available: true,
    optionsSchema: jpgToPdfOptionsSchema,
  },
  "html-to-pdf": {
    slug: "html-to-pdf",
    name: "HTML to PDF",
    description: "Convert web pages to PDF.",
    category: "convert-to",
    icon: "Globe",
    accept: ".html,.htm,text/html",
    minFiles: 1,
    maxFiles: 5,
    maxSizeMB: 50,
    available: true,
    optionsSchema: htmlToPdfOptionsSchema,
  },

  // Convert From PDF
  "pdf-to-word": {
    slug: "pdf-to-word",
    name: "PDF to Word",
    description: "Extract PDF to Word DOCX.",
    category: "convert-from",
    icon: "FileText",
    accept: "application/pdf",
    minFiles: 1,
    maxFiles: 1,
    maxSizeMB: 100,
    available: true,
    optionsSchema: pdfToWordOptionsSchema,
  },
  "pdf-to-excel": {
    slug: "pdf-to-excel",
    name: "PDF to Excel",
    description: "Extract PDF tables to Excel.",
    category: "convert-from",
    icon: "Table",
    accept: "application/pdf",
    minFiles: 1,
    maxFiles: 1,
    maxSizeMB: 100,
    available: true,
    optionsSchema: pdfToExcelOptionsSchema,
  },
  "pdf-to-powerpoint": {
    slug: "pdf-to-powerpoint",
    name: "PDF to PowerPoint",
    description: "Convert PDF pages to slides.",
    category: "convert-from",
    icon: "Presentation",
    accept: "application/pdf",
    minFiles: 1,
    maxFiles: 1,
    maxSizeMB: 100,
    available: true,
    optionsSchema: pdfToPowerpointOptionsSchema,
  },
  "pdf-to-jpg": {
    slug: "pdf-to-jpg",
    name: "PDF to JPG",
    description: "Convert pages to JPG images.",
    category: "convert-from",
    icon: "Image",
    accept: "application/pdf",
    minFiles: 1,
    maxFiles: 1,
    maxSizeMB: 100,
    available: true,
    optionsSchema: pdfToJpgOptionsSchema,
  },
  "pdf-to-pdfa": {
    slug: "pdf-to-pdfa",
    name: "PDF to PDF/A",
    description: "Convert for archiving.",
    category: "convert-from",
    icon: "Archive",
    accept: "application/pdf",
    minFiles: 1,
    maxFiles: 1,
    maxSizeMB: 100,
    available: true,
    optionsSchema: pdfToPdfaOptionsSchema,
  },

  // Edit PDF (Tahap 7)
  "add-page-numbers": {
    slug: "add-page-numbers",
    name: "Page Numbers",
    description: "Add numbers to pages.",
    category: "edit",
    icon: "Hash",
    accept: "application/pdf",
    minFiles: 1,
    maxFiles: 1,
    maxSizeMB: 100,
    available: true,
    optionsSchema: addPageNumbersOptionsSchema,
  },
  "add-watermark": {
    slug: "add-watermark",
    name: "Watermark",
    description: "Stamp a watermark.",
    category: "edit",
    icon: "Stamp",
    accept: "application/pdf",
    minFiles: 1,
    maxFiles: 1,
    maxSizeMB: 100,
    available: true,
    optionsSchema: addWatermarkOptionsSchema,
  },
  "crop-pdf": {
    slug: "crop-pdf",
    name: "Crop PDF",
    description: "Trim PDF margins.",
    category: "edit",
    icon: "Crop",
    accept: "application/pdf",
    minFiles: 1,
    maxFiles: 1,
    maxSizeMB: 100,
    available: true,
    optionsSchema: cropPdfOptionsSchema,
  },
  "pdf-forms": {
    slug: "pdf-forms",
    name: "PDF Forms",
    description: "Fill or flatten forms.",
    category: "edit",
    icon: "CheckSquare",
    accept: "application/pdf",
    minFiles: 1,
    maxFiles: 1,
    maxSizeMB: 100,
    available: true,
    optionsSchema: pdfFormsOptionsSchema,
  },

  // Security
  "protect-pdf": {
    slug: "protect-pdf",
    name: "Protect PDF",
    description: "Encrypt PDF with a password.",
    category: "security",
    icon: "Lock",
    accept: "application/pdf",
    minFiles: 1,
    maxFiles: 1,
    maxSizeMB: 100,
    available: true,
    optionsSchema: protectPdfOptionsSchema,
  },
  "unlock-pdf": {
    slug: "unlock-pdf",
    name: "Unlock PDF",
    description: "Remove PDF password.",
    category: "security",
    icon: "Unlock",
    accept: "application/pdf",
    minFiles: 1,
    maxFiles: 1,
    maxSizeMB: 100,
    available: true,
    optionsSchema: unlockPdfOptionsSchema,
  },
  "sign-pdf": {
    slug: "sign-pdf",
    name: "Sign PDF",
    description: "Sign your document.",
    category: "security",
    icon: "PenTool",
    accept: "application/pdf",
    minFiles: 1,
    maxFiles: 1,
    maxSizeMB: 100,
    available: true,
    optionsSchema: signPdfOptionsSchema,
  },
  "redact-pdf": {
    slug: "redact-pdf",
    name: "Redact PDF",
    description: "Permanently black out text.",
    category: "security",
    icon: "EyeOff",
    accept: "application/pdf",
    minFiles: 1,
    maxFiles: 1,
    maxSizeMB: 100,
    available: true,
    optionsSchema: redactPdfOptionsSchema,
  },
  "compare-pdf": {
    slug: "compare-pdf",
    name: "Compare PDF",
    description: "Find differences.",
    category: "security",
    icon: "GitCompare",
    accept: "application/pdf",
    minFiles: 2,
    maxFiles: 2,
    maxSizeMB: 100,
    available: true,
    optionsSchema: comparePdfOptionsSchema,
  },

  // AI Tier
  "ai-summarizer": {
    slug: "ai-summarizer",
    name: "AI Summarizer",
    description: "Summarize PDF documents fast.",
    category: "ai",
    icon: "Sparkles",
    accept: "application/pdf",
    minFiles: 1,
    maxFiles: 1,
    maxSizeMB: 50,
    available: false,
  },
  "translate-pdf": {
    slug: "translate-pdf",
    name: "Translate PDF",
    description: "Translate PDF preserved layout.",
    category: "ai",
    icon: "Languages",
    accept: "application/pdf",
    minFiles: 1,
    maxFiles: 1,
    maxSizeMB: 50,
    available: false,
  },
};

export const TOOL_CATEGORIES: { id: ToolCategory; title: string }[] = [
  { id: "organize", title: "Organize & Manage" },
  { id: "optimize", title: "Optimize & Repair" },
  { id: "convert-to", title: "Convert to PDF" },
  { id: "convert-from", title: "Convert from PDF" },
  { id: "edit", title: "Edit PDF" },
  { id: "security", title: "Security" },
  { id: "ai", title: "AI Tools" },
];
