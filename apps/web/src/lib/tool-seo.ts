import type { Metadata } from "next";
import { TOOL_REGISTRY } from "@pagelabs/shared";

export const SITE_URL = "https://pagelabs.tanbopp.cloud";
export const SOCIAL_IMAGE = "/social-preview.png";
const SOCIAL_IMAGE_ALT =
  "PageLabs — Every PDF tool. One place. 30+ free, private PDF tools.";

export interface ToolFaq {
  question: string;
  answer: string;
}

export interface ToolSeoCopy {
  /** Search-intent driven title. The root template appends "| PageLabs". */
  title: string;
  /** Meta description, roughly 150-160 characters. */
  description: string;
  /** Short, genuine explainer shown below the tool. */
  intro: string;
  /** Ordered how-to steps. */
  steps: string[];
  /** One or two tool-specific questions. Shared questions are added automatically. */
  faqs?: ToolFaq[];
}

/**
 * Curated, human-written copy for every available tool. Anything missing falls
 * back to the registry description, so adding a tool never breaks SEO.
 */
export const TOOL_SEO_COPY: Record<string, ToolSeoCopy> = {
  "merge-pdf": {
    title: "Merge PDF Online Free — Combine PDF Files",
    description:
      "Merge multiple PDF files into one document online for free. Drag to reorder, add bookmarks, no watermark and no signup. Files are shredded after processing.",
    intro:
      "Combine two or more PDFs into a single file and put the pages in exactly the order you want. Everything runs on PageLabs' own processing pipeline — no account, no watermark, and the merged file is deleted from our servers within two hours.",
    steps: [
      "Select up to 20 PDF files, or drop them onto the page.",
      "Drag the thumbnails to set the page order and switch on bookmarks if you want a navigable outline.",
      "Click Merge PDF, then download the combined document.",
    ],
    faqs: [
      {
        question: "Does merging PDFs reduce quality?",
        answer:
          "No. Page content is copied as-is into the new document, so text, images and links keep their original quality. Only the file structure is rebuilt.",
      },
      {
        question: "Can I merge password-protected PDFs?",
        answer:
          "Encrypted files need to be unlocked first. Use the Unlock PDF tool, then merge the result.",
      },
    ],
  },
  "split-pdf": {
    title: "Split PDF Online Free — Separate PDF Pages",
    description:
      "Split a PDF into separate files or custom page ranges online for free. Extract ranges, split every page or every N pages, then download as a ZIP. No signup.",
    intro:
      "Break one PDF into several smaller documents. Split by ranges, at a fixed interval, or into one file per page, and preview every page before you commit.",
    steps: [
      "Upload the PDF you want to split.",
      "Choose ranges, an interval such as every 2 pages, or one file per page.",
      "Split the document and download the ZIP archive.",
    ],
    faqs: [
      {
        question: "Can I split only a few pages into their own file?",
        answer:
          "Yes. Use the ranges mode and type something like 1-3, 7, 10-12 to produce exactly those groups.",
      },
    ],
  },
  "remove-pages": {
    title: "Remove Pages from PDF Online Free — Delete PDF Pages",
    description:
      "Delete unwanted pages from a PDF online for free. Preview the document, pick the pages to remove and download a clean file. No watermark, no signup.",
    intro:
      "Strip out blank, duplicate or sensitive pages without touching the rest of the document. Page numbering and bookmarks of the remaining pages are preserved.",
    steps: [
      "Upload your PDF and browse the page previews.",
      "Select the pages you want to delete.",
      "Remove them and download the updated PDF.",
    ],
  },
  "extract-pages": {
    title: "Extract Pages from PDF Online Free — Save Selected Pages",
    description:
      "Extract selected pages from a PDF into a new document online for free. Keep one range or several, or export each page separately. No signup required.",
    intro:
      "Keep only the pages you need. Extract a single range such as 4-9, jump between ranges, or save every chosen page as its own PDF.",
    steps: [
      "Upload the PDF you want to take pages from.",
      "Select the pages or ranges to keep.",
      "Extract them into one file, or one file per page, and download.",
    ],
  },
  "organize-pdf": {
    title: "Organize PDF Online Free — Reorder, Rotate & Delete Pages",
    description:
      "Reorder, rotate and delete PDF pages with drag and drop. Organize a PDF online for free, with a live page preview and no signup or watermark.",
    intro:
      "A visual page manager for messy documents. Drag pages into the right order, rotate sideways scans, delete what you do not need and insert blank pages where a layout calls for them.",
    steps: [
      "Upload one or more PDFs.",
      "Drag pages to reorder, rotate them, or remove the ones you do not need.",
      "Apply the changes and download the reorganized PDF.",
    ],
  },
  "scan-to-pdf": {
    title: "Scan to PDF Online Free — Turn Photos Into a PDF",
    description:
      "Turn phone photos of documents into a single PDF online for free. Auto deskew, reorder pages and download a clean scan. No signup, files shredded after processing.",
    intro:
      "Use your phone as a scanner: upload photos of paper documents, straighten them, put the pages in order and export one tidy PDF.",
    steps: [
      "Upload the photos of your document (JPG or PNG).",
      "Enable auto deskew if the pages are tilted, and reorder them as needed.",
      "Create the PDF and download it.",
    ],
  },
  "rotate-pdf": {
    title: "Rotate PDF Online Free — Fix Page Orientation",
    description:
      "Rotate PDF pages by 90, 180 or 270 degrees online for free. Turn a single page or the whole document, then download instantly. No signup or watermark.",
    intro:
      "Fix upside-down or sideways scans permanently. Rotate every page at once or only the pages you select — the visible page orientation is saved in the file.",
    steps: [
      "Upload your PDF.",
      "Choose 90°, 180° or 270° and apply it to all pages or specific pages.",
      "Rotate and download the corrected document.",
    ],
  },
  "compress-pdf": {
    title: "Compress PDF Online Free — Reduce PDF Size",
    description:
      "Compress PDF files online for free without losing readable quality. Three compression levels, no watermark, no signup, files shredded after processing.",
    intro:
      "Shrink large PDFs so they fit email limits and upload forms. PageLabs recompresses images and strips redundant data, and shows you the resulting file size before you download.",
    steps: [
      "Upload the PDF you want to make smaller.",
      "Pick a compression level: less, recommended or extreme.",
      "Compress and download the smaller file.",
    ],
    faqs: [
      {
        question: "Which compression level should I choose?",
        answer:
          "Recommended balances size and legibility for most documents. Choose less when images must stay sharp, and extreme for scanned documents where the smallest possible file matters more than fine detail.",
      },
      {
        question: "Why did my PDF get bigger?",
        answer:
          "A file that was already optimized can occasionally grow, because recompression rewrites the internal structure. In that case keep your original — no quality is added by compressing an already small file.",
      },
    ],
  },
  "repair-pdf": {
    title: "Repair PDF Online Free — Fix Corrupted PDF Files",
    description:
      "Repair damaged or corrupted PDF files online for free. Rebuild the document structure and recover readable pages. No signup, files shredded after processing.",
    intro:
      "If a PDF refuses to open, shows a blank page or fails to download completely, PageLabs can rebuild its internal structure with qpdf and Ghostscript and recover what is still readable.",
    steps: [
      "Upload the broken PDF.",
      "Start the repair — the file is rebuilt in an isolated worker.",
      "Download the recovered document and check the pages you need.",
    ],
    faqs: [
      {
        question: "Can every corrupted PDF be repaired?",
        answer:
          "No. If the page content itself is missing or truncated, no tool can invent it. Repair recovers structure and whatever page data still exists.",
      },
    ],
  },
  "ocr-pdf": {
    title: "OCR PDF Online Free — Make Scanned PDFs Searchable",
    description:
      "Run OCR on scanned PDFs online for free. Add a searchable text layer in 100+ languages so you can select, copy and search the text. No signup.",
    intro:
      "Scanned pages are pictures — machines cannot search them. OCR (optical character recognition) reads the text and adds an invisible layer, so the document becomes selectable and searchable while looking exactly the same.",
    steps: [
      "Upload a scanned PDF.",
      "Select the language of the document.",
      "Run OCR and download the searchable PDF.",
    ],
    faqs: [
      {
        question: "Does OCR change how the document looks?",
        answer:
          "No. The text layer is invisible and sits underneath the scanned image, so the printed appearance stays identical.",
      },
      {
        question: "How accurate is OCR?",
        answer:
          "Accuracy depends on scan resolution, contrast and language. Clean 300 DPI scans in a single language usually produce the best results.",
      },
    ],
  },
  "word-to-pdf": {
    title: "Word to PDF Converter Online Free — DOCX to PDF",
    description:
      "Convert Word documents to PDF online for free. Keep fonts, images and layout intact, batch up to 20 files and download instantly. No signup or watermark.",
    intro:
      "Turn DOC and DOCX files into PDFs that look the same everywhere. Layout, tables, images and fonts are preserved by a real office-rendering engine, not a text dump.",
    steps: [
      "Upload one or more Word documents.",
      "Start the conversion — each file is rendered on a worker.",
      "Download the PDFs individually or together.",
    ],
  },
  "excel-to-pdf": {
    title: "Excel to PDF Converter Online Free — XLSX to PDF",
    description:
      "Convert Excel spreadsheets to PDF online for free. Fit sheets to the page, keep tables readable and download instantly. No signup, files shredded after processing.",
    intro:
      "Share spreadsheets as documents that cannot be edited by accident. PageLabs renders each workbook with an office engine and can fit wide sheets onto the page width.",
    steps: [
      "Upload your XLS or XLSX file.",
      "Leave fit-to-page on for wide tables.",
      "Convert and download the PDF.",
    ],
  },
  "powerpoint-to-pdf": {
    title: "PowerPoint to PDF Online Free — PPTX to PDF",
    description:
      "Convert PowerPoint presentations to PDF online for free. Slides keep their layout, images and fonts. No signup, no watermark, files shredded after processing.",
    intro:
      "Export a slide deck as a PDF for sharing, printing or archiving. Every slide becomes one page, with animations flattened to their final frame.",
    steps: [
      "Upload your PPT or PPTX file.",
      "Start the conversion.",
      "Download the PDF version of your deck.",
    ],
  },
  "jpg-to-pdf": {
    title: "JPG to PDF Online Free — Convert Images to PDF",
    description:
      "Convert JPG, PNG and WebP images to a single PDF online for free. Choose page size, orientation and margins, then download. No signup, no watermark.",
    intro:
      "Combine photos or screenshots into one shareable PDF. Set the page size (A4, Letter or fit to image), orientation and margins, and reorder the images before converting.",
    steps: [
      "Upload up to 20 images.",
      "Choose page size, orientation and margin.",
      "Convert them into one PDF and download it.",
    ],
  },
  "html-to-pdf": {
    title: "HTML to PDF Converter Online Free — Webpage to PDF",
    description:
      "Convert HTML files to PDF online for free. Render pages with a real browser engine so styles and layout are preserved. No signup, files shredded after processing.",
    intro:
      "Turn a saved HTML file into a printable PDF. Pages are rendered with a headless browser, so CSS, web fonts and layout behave like they do on screen.",
    steps: [
      "Upload one or more HTML files.",
      "Choose A4 or Letter page size.",
      "Convert and download the PDF.",
    ],
  },
  "pdf-to-word": {
    title: "PDF to Word Converter Online Free — PDF to DOCX",
    description:
      "Convert PDF to editable Word documents online for free. Keep paragraphs, tables and layout, with optional OCR for scans. No signup or watermark.",
    intro:
      "Get an editable DOCX back from a PDF. Text, paragraphs, lists and tables are reconstructed so you can keep working in Word instead of retyping.",
    steps: [
      "Upload a PDF.",
      "Enable OCR if the PDF is a scan without a text layer.",
      "Convert and download the Word document.",
    ],
    faqs: [
      {
        question: "Will the Word file look exactly like the PDF?",
        answer:
          "Very close for text-based PDFs, but never pixel-identical: Word reflows text with its own engine. Complex multi-column layouts may need manual touch-ups.",
      },
    ],
  },
  "pdf-to-excel": {
    title: "PDF to Excel Online Free — Extract PDF Tables",
    description:
      "Convert PDF tables to Excel spreadsheets online for free. Extract rows and columns into an editable XLSX file. No signup, files shredded after processing.",
    intro:
      "Stop retyping tables from reports and invoices. PageLabs detects table structure in the PDF and writes the cells into a real spreadsheet you can calculate with.",
    steps: [
      "Upload a PDF that contains tables.",
      "Start the extraction.",
      "Download the XLSX and check the detected rows and columns.",
    ],
  },
  "pdf-to-powerpoint": {
    title: "PDF to PowerPoint Online Free — PDF to PPTX",
    description:
      "Turn PDF pages into a PowerPoint presentation online for free. Each page becomes an editable slide you can rearrange. No signup, no watermark.",
    intro:
      "Repurpose a PDF report or handout as a slide deck. Every page is placed on its own slide so you can add notes, reorder content or drop slides you do not need.",
    steps: [
      "Upload the PDF you want as slides.",
      "Start the conversion.",
      "Download the PPTX and edit it in PowerPoint or Keynote.",
    ],
  },
  "pdf-to-jpg": {
    title: "PDF to JPG Online Free — Convert PDF Pages to Images",
    description:
      "Convert PDF pages to JPG or PNG images online for free. Choose the resolution, then download every page as a ZIP. No signup, files shredded after processing.",
    intro:
      "Export PDF pages as images for slides, websites or previews. Pick the DPI that matches your use — 150 for screens, higher for print.",
    steps: [
      "Upload your PDF.",
      "Choose the image format and resolution.",
      "Convert and download the ZIP of images.",
    ],
  },
  "pdf-to-pdfa": {
    title: "PDF to PDF/A Online Free — Convert for Archiving",
    description:
      "Convert PDF to PDF/A-2b or PDF/A-3b online for free for long-term archiving and compliance. Fonts are embedded, output is self-contained. No signup.",
    intro:
      "PDF/A is the ISO standard for documents that must stay readable decades from now. PageLabs embeds fonts, flattens transparency where needed and writes a self-contained archive file.",
    steps: [
      "Upload the PDF you need to archive.",
      "Choose PDF/A-2b or PDF/A-3b.",
      "Convert and download the archived version.",
    ],
  },
  "heic-to-jpg": {
    title: "HEIC to JPG Online Free — Convert iPhone Photos",
    description:
      "Convert HEIC and HEIF photos to JPG online for free. Batch up to 20 files, choose quality and download a ZIP. No signup, files shredded after processing.",
    intro:
      "iPhone photos are HEIC by default, which many apps and older systems cannot open. Convert a batch to widely supported JPG images in one go.",
    steps: [
      "Upload up to 20 HEIC or HEIF images.",
      "Pick the output quality.",
      "Convert and download the ZIP of JPGs.",
    ],
  },
  "add-page-numbers": {
    title: "Add Page Numbers to PDF Online Free — Number PDF Pages",
    description:
      "Add page numbers to a PDF online for free. Choose position, format, font and starting number, skip the cover page, then download. No signup or watermark.",
    intro:
      "Number a long document consistently. Choose where the number sits on the page, which format to use (numbers only, “Page X of Y”, or custom text), the font, and which page the count starts from.",
    steps: [
      "Upload your PDF.",
      "Pick position, format, font and the starting number.",
      "Apply the numbering and download the PDF.",
    ],
  },
  "add-watermark": {
    title: "Add Watermark to PDF Online Free — Text or Image",
    description:
      "Add a text or image watermark to a PDF online for free. Control opacity, rotation, position and page range. No signup, files shredded after processing.",
    intro:
      "Mark drafts, add a company stamp or discourage copying. Place a text or image watermark on one page or all of them, with adjustable opacity, rotation and layer (over or below the content).",
    steps: [
      "Upload your PDF.",
      "Enter the watermark text or image and adjust opacity, position and rotation.",
      "Apply the watermark and download the PDF.",
    ],
  },
  "crop-pdf": {
    title: "Crop PDF Online Free — Trim PDF Margins",
    description:
      "Crop PDF pages online for free. Trim white margins automatically or set the crop box manually, then download the tighter document. No signup required.",
    intro:
      "Remove scanner borders, huge margins or stray content at the edge of the page. Auto mode detects the content box; manual mode lets you set exact margins.",
    steps: [
      "Upload your PDF.",
      "Use auto crop, or enter top, bottom, left and right margins.",
      "Crop and download the PDF.",
    ],
  },
  "pdf-forms": {
    title: "PDF Forms Online Free — Fill or Flatten Form Fields",
    description:
      "Fill or flatten PDF form fields online for free. Make a filled form read-only before sending it. No signup, no watermark, files shredded after processing.",
    intro:
      "Flattening burns the form values into the page so they cannot be changed afterwards — useful before sending a completed form to someone else.",
    steps: [
      "Upload a PDF that contains form fields.",
      "Choose whether to flatten the fields into the page.",
      "Process and download the finished form.",
    ],
  },
  "edit-pdf": {
    title: "Edit PDF Online Free — Add Text, Draw & Annotate",
    description:
      "Edit PDF files online for free. Add text, draw, highlight and annotate pages in the browser, then download the result. No signup or watermark.",
    intro:
      "A focused editor for the things people actually need: type text on a page, draw or sign, highlight a paragraph and add comments. Your file is prepared in the browser and saved with your edits applied.",
    steps: [
      "Upload the PDF you want to edit.",
      "Add text, drawings, highlights or annotations on the page.",
      "Save and download the edited PDF.",
    ],
    faqs: [
      {
        question: "Can I edit existing text inside a PDF?",
        answer:
          "This editor adds annotations on top of the page. Rewriting existing text requires the PDF to be converted to Word first, then exported back to PDF.",
      },
    ],
  },
  "protect-pdf": {
    title: "Protect PDF Online Free — Add a Password",
    description:
      "Encrypt a PDF with a password online for free. Restrict printing and copying, then download the protected file. No signup, files shredded after processing.",
    intro:
      "Add real encryption to a document before emailing it. Choose your password and decide whether the recipient may print or copy content.",
    steps: [
      "Upload your PDF.",
      "Enter a password and choose the permissions.",
      "Protect and download the encrypted PDF.",
    ],
    faqs: [
      {
        question: "Who can open the protected PDF?",
        answer:
          "Only someone with the password you set. PageLabs does not store your password, so keep it somewhere safe — it cannot be recovered from us.",
      },
    ],
  },
  "unlock-pdf": {
    title: "Unlock PDF Online Free — Remove a PDF Password",
    description:
      "Remove a known password from a PDF online for free so it opens without prompts. Use it only on files you own. No signup, files shredded after processing.",
    intro:
      "Remove the owner password from PDFs you are allowed to modify, so the file opens without a password prompt and can be edited or merged.",
    steps: [
      "Upload the protected PDF.",
      "Enter the password you already know.",
      "Unlock and download the unprotected PDF.",
    ],
    faqs: [
      {
        question: "Can PageLabs crack a PDF I do not have the password for?",
        answer:
          "No. Unlocking requires the existing password. This tool removes protection from your own documents, it does not break encryption.",
      },
    ],
  },
  "sign-pdf": {
    title: "Sign PDF Online Free — Add a Signature",
    description:
      "Sign a PDF online for free. Draw or type your signature and place it on any page, then download the signed document. No signup, files shredded after processing.",
    intro:
      "Add a handwritten or typed signature to a contract, form or letter. Choose the page, the position on the page and download the signed result.",
    steps: [
      "Upload the PDF you need to sign.",
      "Draw or type your signature and place it on the page.",
      "Apply the signature and download the signed PDF.",
    ],
    faqs: [
      {
        question: "Is this a legally binding electronic signature?",
        answer:
          "It produces a visual signature, not a certificate-based digital signature. Many agreements accept that, but check the requirements of the document you are signing.",
      },
    ],
  },
  "redact-pdf": {
    title: "Redact PDF Online Free — Permanently Black Out Text",
    description:
      "Redact sensitive text from a PDF online for free. Matches are removed from the file content, not just covered. No signup, files shredded after processing.",
    intro:
      "Hiding text with a black rectangle is not redaction — the text is still there and can be copied. PageLabs finds the terms you specify and removes the underlying text, so it cannot be recovered.",
    steps: [
      "Upload your PDF.",
      "Enter the words or phrases to redact.",
      "Redact and download the cleaned document.",
    ],
    faqs: [
      {
        question: "Can redacted text be recovered from the downloaded file?",
        answer:
          "No. The matched text is stripped from the document content before the PDF is written, so it is not present in the output file.",
      },
    ],
  },
  "compare-pdf": {
    title: "Compare PDF Online Free — Find Differences",
    description:
      "Compare two PDF files online for free and see what changed between versions. Get a difference document you can review. No signup, files shredded after processing.",
    intro:
      "Spot edits between two versions of a contract or report without reading both side by side. Upload the original and the revision and download a comparison document.",
    steps: [
      "Upload the original PDF and the revised PDF.",
      "Start the comparison.",
      "Download the difference document and review the changes.",
    ],
  },
  "ai-summarizer": {
    title: "AI Summarizer for PDF — Coming Soon",
    description:
      "Summarize long PDF documents with AI. PageLabs' AI summarizer is in development — follow the repository to be notified when it ships.",
    intro:
      "An AI summarizer that reads a PDF and returns a short, faithful summary is on the roadmap. It is not available yet; this page is a placeholder.",
    steps: [
      "This tool is not available yet.",
      "Follow the repository to hear when it ships.",
      "Until then, use OCR PDF to make scans searchable.",
    ],
  },
  "translate-pdf": {
    title: "Translate PDF While Keeping Layout — Coming Soon",
    description:
      "Translate a PDF into another language while preserving the original layout. PageLabs' translation tool is in development and not available yet.",
    intro:
      "Machine translation that keeps the original layout intact is on the roadmap. It is not available yet; this page is a placeholder.",
    steps: [
      "This tool is not available yet.",
      "Follow the repository to hear when it ships.",
      "Until then, convert to Word with PDF to Word and translate there.",
    ],
  },
};

function fallbackCopy(slug: string): ToolSeoCopy {
  const tool = TOOL_REGISTRY[slug];
  const name = tool?.name ?? "PDF Tool";
  return {
    title: `${name} Online Free`,
    description: `${tool?.description ?? "Process PDF files online"} Free, privacy-first and no signup on PageLabs.`,
    intro: `${name} runs on PageLabs' own processing pipeline. Files are deleted from our servers within two hours and no cookies are used.`,
    steps: [
      "Upload your file.",
      "Adjust the options.",
      "Process and download the result.",
    ],
  };
}

export function getToolCopy(slug: string): ToolSeoCopy {
  return TOOL_SEO_COPY[slug] ?? fallbackCopy(slug);
}

/** Shared FAQ entries appended to every tool page. */
export function getToolFaqs(slug: string): ToolFaq[] {
  const tool = TOOL_REGISTRY[slug];
  const copy = getToolCopy(slug);
  const name = tool?.name ?? "this tool";
  const maxSize = tool?.maxSizeMB ?? 100;

  return [
    ...(copy.faqs ?? []),
    {
      question: `Is ${name} free to use?`,
      answer:
        "Yes. Every PageLabs tool is free, with no account, no advertisements, no watermark and no subscription.",
    },
    {
      question: "What happens to my files after processing?",
      answer:
        "Files are stored only long enough to process and download them. Generated files are purged on a schedule and everything is shredded within two hours; worker temp directories are removed after each job. PageLabs sets no tracking cookies.",
    },
    {
      question: "Is there a file size or usage limit?",
      answer: `Uploads are limited to ${maxSize} MB per file, and anonymous usage is rate limited to 10 jobs per hour per IP address.`,
    },
  ];
}

export function buildToolMetadata(slug: string): Metadata {
  const copy = getToolCopy(slug);
  const canonical = `/tools/${slug}`;
  const url = `${SITE_URL}${canonical}`;

  return {
    title: copy.title,
    description: copy.description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      url,
      siteName: "PageLabs",
      title: copy.title,
      description: copy.description,
      images: [
        { url: SOCIAL_IMAGE, width: 1280, height: 640, alt: SOCIAL_IMAGE_ALT },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: copy.title,
      description: copy.description,
      images: [SOCIAL_IMAGE],
    },
  };
}

/** JSON-LD for a tool page: the app itself, a breadcrumb trail and the FAQ. */
export function buildToolJsonLd(slug: string) {
  const tool = TOOL_REGISTRY[slug];
  const copy = getToolCopy(slug);
  const url = `${SITE_URL}/tools/${slug}`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        "@id": `${url}#app`,
        name: `${tool?.name ?? "PDF Tool"} — PageLabs`,
        url,
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "Any (web browser)",
        browserRequirements: "Requires JavaScript",
        description: copy.description,
        isAccessibleForFree: true,
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        publisher: {
          "@type": "Organization",
          name: "PageLabs",
          url: SITE_URL,
        },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "PDF tools", item: `${SITE_URL}/#tools` },
          { "@type": "ListItem", position: 3, name: tool?.name ?? "Tool", item: url },
        ],
      },
      {
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        mainEntity: getToolFaqs(slug).map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: { "@type": "Answer", text: faq.answer },
        })),
      },
    ],
  };
}
