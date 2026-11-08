<div align="center">

# PageLabs

**Every PDF tool. One place.**

Clean, privacy-first PDF tools that do the job and get out of the way.
No signup. No cookies. No ads. **Your files never leave your device.**

[**Try it live →**](https://pagelabs.tanbopp.cloud) · [Report a bug](https://github.com/tanbopp/pagelabs-pdf-tools/issues/new?template=bug_report.md) · [Request a feature](https://github.com/tanbopp/pagelabs-pdf-tools/issues/new?template=feature_request.md) · [Discussions](https://github.com/tanbopp/pagelabs-pdf-tools/discussions)

[![CI](https://github.com/tanbopp/pagelabs-pdf-tools/actions/workflows/ci.yml/badge.svg)](https://github.com/tanbopp/pagelabs-pdf-tools/actions/workflows/ci.yml)
![License: MIT](https://img.shields.io/badge/license-MIT-black.svg)
![Tools](https://img.shields.io/badge/tools-31%20live-black.svg)
![Next.js 16](https://img.shields.io/badge/Next.js-16-black.svg)
![100% client-side](https://img.shields.io/badge/processing-100%25%20client--side-black.svg)
![No database](https://img.shields.io/badge/database-none-black.svg)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-black.svg)

</div>

![PageLabs homepage](docs/screenshots/homepage.png)

---

## Why PageLabs?

Most online PDF tools are ad farms. They upload your contracts and tax returns to anonymous
servers, nag you to subscribe, watermark the result, and set a dozen tracking cookies along the
way.

PageLabs is the opposite: a flat, fast, open-source suite that runs **entirely inside your
browser**. There is no upload endpoint, no database and no worker — the document is read with
`pdf-lib`/`pdf.js` and processed on your own CPU. If you would rather run it yourself, a single
Next.js app is all you need.

- **Privacy by architecture** — files are opened with the File API and processed in the browser.
  Nothing is sent over the network, there is no storage bucket to purge, and there are **zero
tracking cookies**.
- **31 working tools** — the boring essentials (merge, compress, rotate) and the awkward ones
  (OCR, redact, compare, PDF/A).
- **No watermark, no account, no export paywall.**
- **Deploy anywhere static-ish** — one `next build` on Vercel, Netlify, Cloudflare or your own
  box. No server environment variables required.
- **Open source, MIT licensed.** Read the code before you trust it with a document.

![How PageLabs works](docs/demo.gif)

---

## Tools

31 tools are live today. Two more (AI Summarizer, Translate PDF) are in the registry and marked
coming soon.

### Organize & Manage

| Tool | What it does |
| --- | --- |
| [Merge PDF](https://pagelabs.tanbopp.cloud/tools/merge-pdf) | Combine up to 20 PDFs into one, in any order, with optional bookmarks |
| [Split PDF](https://pagelabs.tanbopp.cloud/tools/split-pdf) | Split by ranges, by interval, or into one file per page |
| [Remove Pages](https://pagelabs.tanbopp.cloud/tools/remove-pages) | Delete unwanted pages from a PDF |
| [Extract Pages](https://pagelabs.tanbopp.cloud/tools/extract-pages) | Keep only the pages you need, or export each one separately |
| [Organize PDF](https://pagelabs.tanbopp.cloud/tools/organize-pdf) | Reorder, rotate and delete pages with drag and drop |
| [Scan to PDF](https://pagelabs.tanbopp.cloud/tools/scan-to-pdf) | Turn photos of documents into a single tidy PDF |
| [Rotate PDF](https://pagelabs.tanbopp.cloud/tools/rotate-pdf) | Rotate every page or just the sideways ones |

### Optimize & Repair

| Tool | What it does |
| --- | --- |
| [Compress PDF](https://pagelabs.tanbopp.cloud/tools/compress-pdf) | Three compression levels, with the resulting size shown before download |
| [Repair PDF](https://pagelabs.tanbopp.cloud/tools/repair-pdf) | Rebuild the structure of a corrupted PDF and recover readable pages |
| [OCR PDF](https://pagelabs.tanbopp.cloud/tools/ocr-pdf) | Add a searchable text layer to scans in 100+ languages |

### Convert to PDF

| Tool | What it does |
| --- | --- |
| [Word to PDF](https://pagelabs.tanbopp.cloud/tools/word-to-pdf) | DOC/DOCX to PDF with fonts and layout preserved |
| [Excel to PDF](https://pagelabs.tanbopp.cloud/tools/excel-to-pdf) | XLS/XLSX to PDF, with fit-to-page for wide sheets |
| [PowerPoint to PDF](https://pagelabs.tanbopp.cloud/tools/powerpoint-to-pdf) | PPT/PPTX to PDF, one slide per page |
| [JPG to PDF](https://pagelabs.tanbopp.cloud/tools/jpg-to-pdf) | JPG, PNG and WebP images into a single PDF |
| [HTML to PDF](https://pagelabs.tanbopp.cloud/tools/html-to-pdf) | Render HTML files to PDF with a real browser engine |

### Convert from PDF

| Tool | What it does |
| --- | --- |
| [PDF to Word](https://pagelabs.tanbopp.cloud/tools/pdf-to-word) | Editable DOCX, with optional OCR for scans |
| [PDF to Excel](https://pagelabs.tanbopp.cloud/tools/pdf-to-excel) | Extract PDF tables into a real spreadsheet |
| [PDF to PowerPoint](https://pagelabs.tanbopp.cloud/tools/pdf-to-powerpoint) | One PDF page per editable slide |
| [PDF to JPG](https://pagelabs.tanbopp.cloud/tools/pdf-to-jpg) | Export pages as JPG or PNG at your chosen DPI |
| [PDF to PDF/A](https://pagelabs.tanbopp.cloud/tools/pdf-to-pdfa) | PDF/A-2b or PDF/A-3b for long-term archiving |
| [HEIC to JPG](https://pagelabs.tanbopp.cloud/tools/heic-to-jpg) | Convert iPhone photos to widely supported JPGs |

### Edit PDF

| Tool | What it does |
| --- | --- |
| [Page Numbers](https://pagelabs.tanbopp.cloud/tools/add-page-numbers) | Position, format, font and starting number for page numbering |
| [Watermark](https://pagelabs.tanbopp.cloud/tools/add-watermark) | Text or image watermark with opacity, rotation and page range |
| [Crop PDF](https://pagelabs.tanbopp.cloud/tools/crop-pdf) | Auto or manual margin trimming |
| [PDF Forms](https://pagelabs.tanbopp.cloud/tools/pdf-forms) | Fill or flatten form fields |
| [Edit PDF](https://pagelabs.tanbopp.cloud/tools/edit-pdf) | Add text, draw, highlight and annotate |

### Security

| Tool | What it does |
| --- | --- |
| [Protect PDF](https://pagelabs.tanbopp.cloud/tools/protect-pdf) | Encrypt with a password and restrict printing or copying |
| [Unlock PDF](https://pagelabs.tanbopp.cloud/tools/unlock-pdf) | Remove a password you already know from your own file |
| [Sign PDF](https://pagelabs.tanbopp.cloud/tools/sign-pdf) | Draw or type a signature and place it on any page |
| [Redact PDF](https://pagelabs.tanbopp.cloud/tools/redact-pdf) | Remove matching text from the file content, not just cover it |
| [Compare PDF](https://pagelabs.tanbopp.cloud/tools/compare-pdf) | Find the differences between two versions of a document |

### Coming soon

| Tool | Status |
| --- | --- |
| AI Summarizer | In the registry, not available yet |
| Translate PDF | In the registry, not available yet |

---

## Screenshots

| Merge PDF | Compress PDF |
| --- | --- |
| ![Merge PDF](docs/screenshots/merge-pdf.png) | ![Compress PDF](docs/screenshots/compress-pdf.png) |

| Edit PDF | Full tool index |
| --- | --- |
| ![Edit PDF](docs/screenshots/edit-pdf.png) | ![All tools](docs/screenshots/homepage-full.png) |

Screenshots are regenerated with `node scripts/capture-docs.mjs` (see [docs/](docs/README.md)).

---

## Key highlights

- **Flat, shadowless design.** No gradients, no elevation, no glass effects. Depth comes from
  1px borders and surface contrast only, with generous 24px radii and Manrope typography.
- **Privacy by default.** Uploads do not exist. The browser reads the file you picked, the
  resulting bytes become a `blob:` URL, and nothing is written to a server. PageLabs sets no
  cookies and uses no analytics.
- **Security by subtraction.** With no upload endpoint there is no storage to leak, no signed-URL
  surface and no queue to poison. A strict Content Security Policy,
  `X-Frame-Options: DENY` and `X-Content-Type-Options: nosniff` still ship with the app.
- **Bounded resource use.** Every processor is client-side and streams through `pdf.js`/
  `pdf-lib`; heavy work (OCR, rasterisation) reports progress instead of blocking the UI, and
  the tab stays responsive.
- **Accessible.** Full keyboard navigation, screen-reader labels, visible focus rings, and
  respect for `prefers-reduced-motion`.

---

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 16 (App Router, Turbopack), React 19, Tailwind CSS v4, Radix UI, dnd-kit |
| PDF engine | `pdf-lib` (merge, split, rotate, crop, watermark, page numbers, forms, signing) and `pdf.js` (rasterising, text extraction) |
| Conversions | `jspdf`, `docx`, `xlsx`, `pptxgenjs`, `jszip` |
| OCR | `tesseract.js` (WASM, runs in the tab) |
| Images | `heic2any` for HEIC → JPG |
| Hosting | Static/SSR Next.js output — Vercel, Netlify, Cloudflare or self-hosted |

---

## Project structure

```text
pagelabs-pdf-tools/
├── apps/
│   └── web/          # Next.js 16 app: tool UIs, browser processors, SEO
│       └── src/lib/local/   # The client-side engine (pdf-lib / pdf.js / tesseract.js)
├── packages/
│   └── shared/       # Zod schemas, tool registry, shared types
├── docs/             # Screenshots, social preview, capture script notes
└── prd/              # Product requirement documents for each tool stage
```

The **tool registry** in `packages/shared/src/tools.ts` is the single source of truth: it drives
the homepage grid, the sitemap, per-tool metadata and the FAQ copy.

The **local engine** in `apps/web/src/lib/local/` is the single processing layer: `jobs.ts`
validates the tool slug and runs the matching processor, while `tools-pdf.ts` and
`tools-convert.ts` hold the individual operations. There is no network call in that folder.

---

## Getting started

### Prerequisites

- Node.js **20+**
- pnpm **9+**

That is all. There is no database, no Redis, no Python and no system package to install.

### 1. Clone and install

```bash
git clone https://github.com/tanbopp/pagelabs-pdf-tools.git
cd pagelabs-pdf-tools
pnpm install
```

### 2. Run the app

```bash
pnpm dev
```

- Web app: <http://localhost:3000>

Open DevTools → Network while using a tool: the only requests are for the page itself, the
`pdf.worker.min.mjs` asset and (first time only) OCR language data. Your document is never sent
anywhere.

---

## Self-hosting

### Option A — Vercel (recommended)

Import the repository, leave the root directory at the repo root and deploy. `vercel.json`
runs `pnpm build:vercel` and publishes `apps/web/.next`. **No environment variables are needed.**

### Option B — Any Node host / static export

```bash
pnpm build
pnpm --filter web start
```

Because every processor runs in the browser, you can also serve the app from a CDN or a single
small container. There are no S3 buckets, queues or database migrations to manage.

---

## Testing

```bash
# TypeScript unit and schema tests
pnpm --filter @pagelabs/shared test

# Typecheck, lint and full production build
pnpm typecheck
pnpm lint
pnpm build
```

The browser processors are exercised manually through each tool page; the shared schemas and
tool registry are covered by unit tests. CI runs install, tests, typecheck and build on every push
and pull request.

---

## Roadmap

- [x] 31 PDF tools across organize, optimize, convert, edit and security
- [x] Privacy-first processing with scheduled shredding
- [x] Docker Compose self-hosting
- [x] Search-optimised tool pages with structured data
- [ ] **AI Summarizer** — summarize long documents (in the registry, not live)
- [ ] **Translate PDF** — translate while preserving layout (in the registry, not live)
- [ ] **Multi-language UI** — starting with Indonesian
- [ ] Per-tool usage docs and a public API

Have an idea or want to pick one of these up? [Open an issue](https://github.com/tanbopp/pagelabs-pdf-tools/issues/new/choose).

---

## Contributing

Contributions are welcome: bug fixes, new tools, translations, accessibility work and docs.

1. Read [CONTRIBUTING.md](CONTRIBUTING.md).
2. Fork the repository and branch from `main` (`feat/...`, `fix/...`, `docs/...`).
3. Make a focused change and follow [Conventional Commits](https://www.conventionalcommits.org/).
4. Run the tests and `pnpm build`.
5. Open a pull request using the template.

New here? Look for [`good first issue`](https://github.com/tanbopp/pagelabs-pdf-tools/labels/good%20first%20issue)
or [`help wanted`](https://github.com/tanbopp/pagelabs-pdf-tools/labels/help%20wanted).

Please read the [Code of Conduct](CODE_OF_CONDUCT.md) before participating. For security
issues, follow [SECURITY.md](SECURITY.md) — never open a public issue.

Maintainers: repository settings, labels, starter issues and release commands live in
[docs/GITHUB_SETUP.md](docs/GITHUB_SETUP.md).

---

## License

[MIT](LICENSE) © 2026 PageLabs (tanbopp). Free and open source for everyone.

---

<div align="center">

If PageLabs saved you some time, a ⭐ helps other people find it.

</div>
