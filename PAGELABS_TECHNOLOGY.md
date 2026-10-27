# PageLabs — Technology & Architecture Blueprint

**Version:** 1.0
**Status:** Reverse-engineering specification for an iLovePDF-class PDF platform
**Frontend Stack:** React + shadcn/ui (official) + Tailwind CSS + Manrope
**Design Constraints:** Flat, full-rounded, minimal font weight (medium minimum), shadowless, dark mode neutral
**Tool Naming:** English, exact iLovePDF convention (`PageLabs Merge PDF`, `PageLabs Split PDF`, etc.)

---

## 1. Design System & Frontend Foundation

### 1.1 UI Framework

PageLabs uses **shadcn/ui (official)** as the sole component layer. Components are installed via the CLI and owned directly in the repository (`components/ui/`). No third-party UI kit overrides the base layer.

**Core shadcn components required for PDF workflows:**

| Domain | Components |
|---|---|
| File Input | `Input`, `Button`, `Card`, `Label` |
| Tool Configuration | `Select`, `Slider`, `Checkbox`, `RadioGroup`, `Switch` |
| Progress & Feedback | `Progress`, `Alert`, `Toast` (Sonner) |
| Layout | `Tabs`, `Separator`, `ScrollArea`, `Resizable` |
| Overlays | `Dialog`, `AlertDialog`, `Sheet`, `Tooltip` |
| Navigation | `Breadcrumb`, `NavigationMenu` |

### 1.2 Styling Rules

| Rule | Implementation |
|---|---|
| **Flat** | Zero `box-shadow` utilities; no elevation gradients. Borders use `border-border` only. |
| **Full-rounded** | `--radius: 1.5rem` (24px) set globally. Cards, buttons, inputs, dialogs all inherit `rounded-full` or `rounded-3xl` per component. |
| **Shadowless** | Tailwind config: `boxShadow: { DEFAULT: 'none', sm: 'none', md: 'none', lg: 'none' }`. shadcn's default shadow tokens are disabled. |
| **Dark mode neutral** | Background: `hsl(0 0% 8%)`. Surface: `hsl(0 0% 12%)`. Border: `hsl(0 0% 20%)`. Foreground: `hsl(0 0% 92%)`. No blue/green tint. Pure neutral grayscale. |
| **Typography** | Manrope (Google Fonts). Minimum weight: **500 (Medium)**. Body: 500. Headings: 600. Buttons/Labels: 600. No 400 or below in any visible text. |
| **Transitions** | 150ms ease-out for hover/focus. No scale animations on press. |

### 1.3 Component Composition Pattern

Every tool page follows a single layout contract:

```
┌─────────────────────────────────────────────┐
│  Breadcrumb: Tools / [Tool Name]            │
├─────────────────────────────────────────────┤
│  Card (flat, rounded-3xl)                   │
│  ┌───────────────────────────────────────┐  │
│  │  File Drop Zone / Input               │  │
│  │  (dashed border, rounded-full)        │  │
│  └───────────────────────────────────────┘  │
│  ┌───────────────────────────────────────┐  │
│  │  Tool Options (Select/Slider/Switch)  │  │
│  └───────────────────────────────────────┘  │
│  ┌───────────────────────────────────────┐  │
│  │  [Process Button — rounded-full]      │  │
│  └───────────────────────────────────────┘  │
├─────────────────────────────────────────────┤
│  Result Card (conditional)                  │
│  [Download] [Process Another]               │
└─────────────────────────────────────────────┘
```

No shadows. No card elevation. Separation achieved via `border` and background contrast only.

---

## 2. PDF Processing Engine

### 2.1 Processing Architecture: Server-Side Execution

iLovePDF's production architecture uses a **server-side PDF processing API** as its technological backbone, not browser-side computation. PageLabs replicates this model for full-fidelity results.

**Rationale:**
- Browser-side libraries (pdf-lib, pdfjs-dist) cannot match server-grade fidelity for compression, OCR, Office conversion, or PDF/A compliance.
- iLovePDF itself executes PDF Tools AG's 3-Heights SDK on its servers via command-line for maximum stability.
- PageLabs must handle files up to 100MB+ and produce output that opens identically in Adobe Acrobat, Foxit, and Preview.

### 2.2 Core Processing Stack

| Layer | Technology | Responsibility |
|---|---|---|
| **PDF Core** | **qpdf** (CLI) | Structural transforms: merge, split, rotate, linearize, encrypt/decrypt, repair. Battle-tested, MIT-licensed. |
| **PDF Rendering & Conversion** | **Ghostscript** (CLI) | PDF → image, image → PDF, compression (with quality presets), PDF/A conversion. |
| **Office Conversion** | **LibreOffice** (headless `soffice`) | DOCX/XLSX/PPTX → PDF, PDF → DOCX/XLSX/PPTX (via import/export filters). |
| **OCR** | **Tesseract** + **OCRmyPDF** | Text layer injection for scanned PDFs. Language packs: English, Indonesian, and major EU languages. |
| **PDF Manipulation (fine-grained)** | **pikepdf** (Python, qpdf binding) | Page-level operations: reorder, delete, extract, insert blank pages, metadata editing. |
| **PDF Forms & Annotations** | **pypdf** | Form field detection, flattening, annotation removal. |
| **Digital Signing** | **pyHanko** | PAdES-compliant signatures, timestamps, LTV. |

### 2.3 Why Not Browser-Only?

Browser-side PDF libraries exist, but they are not equivalent:

| Capability | pdf-lib (browser) | Server Stack (qpdf + Ghostscript + LibreOffice) |
|---|---|---|
| Merge/Split | ✅ Basic | ✅ Full fidelity |
| Compression | ❌ None | ✅ Ghostscript quality presets |
| Office → PDF | ❌ | ✅ LibreOffice |
| OCR | ❌ | ✅ Tesseract |
| PDF/A | ❌ | ✅ Ghostscript |
| Repair | ❌ | ✅ qpdf `--replace-input` |
| Large files (100MB+) | ⚠️ Memory-bound | ✅ Server RAM |

The server stack delivers the "not setengah-setengah" requirement: every tool produces a result equivalent to what a desktop application would output.

### 2.4 Processing Pipeline Contract

Every tool invocation follows this sequence:

```
1. Client uploads file(s) → signed URL (S3-compatible storage)
2. Client POSTs job manifest → PageLabs API
   { tool: "merge-pdf", files: [url1, url2], options: {...} }
3. Worker pulls file(s) → local temp directory
4. Worker executes tool-specific command chain
5. Worker validates output (page count, file size, MIME type)
6. Worker uploads result → signed download URL
7. Worker deletes temp files (secure wipe)
8. API returns { result_url, expires_at } to client
```

**Timeout:** 300 seconds per job. Jobs exceeding this are killed and temp files wiped.

**Concurrency:** Per-user rate limit enforced at API gateway. Anonymous users: 10 jobs/hour. Authenticated: 100 jobs/hour.

---

## 3. Security & Privacy Model

### 3.1 File Lifecycle

| Stage | Policy |
|---|---|
| Upload | TLS 1.3 only. Files encrypted at rest (AES-256) in object storage. |
| Processing | Temp files written to `tmpfs` (RAM-backed) where available. Disk-backed temp is encrypted. |
| Retention | Input and output files purged **immediately after download** or **2 hours after creation**, whichever comes first. |
| Deletion | `shred` (or `srm` on macOS) for temp files. Object storage lifecycle rule auto-deletes after 2h. |
| Logging | File names and contents are **never logged**. Only job IDs, tool names, timestamps, and byte sizes. |

### 3.2 Encryption

- **In transit:** TLS 1.3, HSTS enabled.
- **At rest (storage):** AES-256-GCM via storage provider.
- **At rest (temp):** Encrypted volume. Keys rotated every 24h.
- **Passwords for protected PDFs:** Accepted via API, used in-memory only, never persisted to database or logs.

### 3.3 Frontend Security

- No `dangerouslySetInnerHTML` anywhere.
- File input validates MIME type and magic bytes before upload.
- All shadcn `Dialog`/`Sheet` components render in portals with focus trapping.
- CSP: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'` (shadcn requires inline styles for CSS variables).

---

## 4. Tool Registry

### 4.1 Naming Convention

All tools prefixed with `PageLabs` and use iLovePDF's English names:

```
PageLabs Merge PDF
PageLabs Split PDF
PageLabs Compress PDF
PageLabs PDF to Word
PageLabs Word to PDF
...
```

### 4.2 Complete Tool Inventory

**Organize & Manage**
- PageLabs Merge PDF
- PageLabs Split PDF
- PageLabs Remove Pages
- PageLabs Extract Pages
- PageLabs Organize PDF
- PageLabs Rotate PDF
- PageLabs Add Page Numbers
- PageLabs Add Watermark

**Optimize & Repair**
- PageLabs Compress PDF
- PageLabs Repair PDF
- PageLabs OCR PDF
- PageLabs PDF to PDF/A

**Convert to PDF**
- PageLabs Word to PDF
- PageLabs Excel to PDF
- PageLabs PowerPoint to PDF
- PageLabs JPG to PDF
- PageLabs HTML to PDF

**Convert from PDF**
- PageLabs PDF to Word
- PageLabs PDF to Excel
- PageLabs PDF to PowerPoint
- PageLabs PDF to JPG

**Security**
- PageLabs Protect PDF
- PageLabs Unlock PDF
- PageLabs Sign PDF
- PageLabs Redact PDF

**AI (optional premium tier)**
- PageLabs AI Summarizer
- PageLabs Translate PDF

Each tool maps to a **single processing recipe** (command chain + option schema). No tool shares a backend recipe with another unless the transformation is identical.

---

## 5. API Contract

### 5.1 Endpoint Structure

```
POST   /api/v1/jobs              → Create job (multipart or JSON with file URLs)
GET    /api/v1/jobs/:id          → Poll job status
GET    /api/v1/jobs/:id/result   → Download result (signed URL redirect)
DELETE /api/v1/jobs/:id          → Cancel / purge
```

### 5.2 Job States

```
queued → processing → validating → completed
                    ↘ failed (with error code)
```

### 5.3 Error Codes

| Code | Meaning |
|---|---|
| `INVALID_FILE` | MIME or magic byte mismatch |
| `FILE_TOO_LARGE` | Exceeds 100MB (free) / 500MB (authenticated) |
| `PROCESSING_FAILED` | Tool-specific error (message sanitized) |
| `TIMEOUT` | Exceeded 300s |
| `RATE_LIMITED` | Quota exceeded |

---

## 6. Performance Targets

| Metric | Target |
|---|---|
| Time to first byte (tool page) | < 200ms |
| Upload throughput | > 10 MB/s |
| Merge 10 × 5MB PDFs | < 8s end-to-end |
| Compress 50MB PDF | < 15s |
| OCR 10-page scan | < 30s |
| Office → PDF (10-page DOCX) | < 12s |
| Result download start | < 500ms after job completion |

Frontend achieves speed via:
- **React Server Components** for tool pages (no client JS for static UI).
- **shadcn components imported individually** (no barrel file).
- **Manrope subsetted** to Latin + Latin-Extended only.
- **No client-side PDF rendering** unless the tool explicitly requires preview (e.g., Organize PDF page reordering uses `pdfjs-dist` canvas rendering only).

---

## 7. Deployment Topology

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  Vercel /   │────▶│  API Gateway │────▶│  Job Queue      │
│  Cloudflare │     │  (Hono/Node) │     │  (BullMQ/Redis) │
│  (Frontend) │     └──────────────┘     └────────┬────────┘
└─────────────┘                                   │
                                                  ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  Object     │◀────│  Worker Pool │◀────│  Temp Storage   │
│  Storage    │     │  (qpdf, GS,  │     │  (tmpfs/encrypted│
│  (S3/R2)    │     │  LibreOffice)│     │   volume)       │
└─────────────┘     └──────────────┘     └─────────────────┘
```

**Worker image:** Debian slim + qpdf + Ghostscript + LibreOffice (headless) + Tesseract + Python 3.12 + pikepdf + pypdf + pyHanko. Built once, pinned by digest.

**Scaling:** Workers scale horizontally on queue depth. Minimum 2 warm workers. Maximum 50.

---

## 8. What This Document Does Not Cover

- Pricing tiers and billing integration.
- User authentication (OAuth, email/password, session management).
- i18n (PageLabs UI is English-only in v1).
- Mobile native apps.
- Enterprise API keys and usage dashboards.

These are separate specifications. The scope here is strictly the **technology and architecture** required to deliver the tool set with the specified UI constraints.

---

**End of Document.**