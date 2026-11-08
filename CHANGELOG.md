# Changelog

All notable changes to PageLabs are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this
project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Screenshots, a demo GIF and a 1280×640 social preview in `docs/`.
- Per-tool explainer and FAQ sections, with `FAQPage`, `WebApplication` and `BreadcrumbList`
  structured data.
- Open Graph and Twitter card images for the homepage and every tool page.
- GitHub Actions CI workflow running tests, typecheck and build for the TypeScript
  workspaces, plus the Python worker test suite.
- Issue templates (bug report, feature request), a pull request template, and a contributor
  code of conduct.

### Changed

- Rewrote the README with a live demo link, screenshots, an accurate tools table, roadmap and
  contributing sections.
- SEO titles and meta descriptions for every tool are now search-intent driven instead of
  auto-generated.
- The FAQ page description now reflects the real tool count.

### Fixed

- Removed a duplicate static `robots.txt` that shadowed the generated one.
- Worker dependencies: `pdf-tables-to-excel` (used by `pdf_to_excel`) and
  `pillow-heif` (used by `heic_to_jpg`) were imported but missing from
  `apps/worker/requirements.txt`, so a fresh clone, CI and the production image all
  failed with `ModuleNotFoundError`. Both are now pinned, and the Dockerfile installs
  `requirements.txt` only, matching CI.

## [0.1.0] — 2026-11-07

First tagged release of the public repository. This snapshots the state of the hosted service
at <https://pagelabs.tanbopp.cloud>.

### Added

- **31 working PDF tools** across six categories: organize (merge, split, remove pages, extract
  pages, organize, scan to PDF, rotate), optimize (compress, repair, OCR), convert to PDF
  (Word, Excel, PowerPoint, JPG, HTML), convert from PDF (Word, Excel, PowerPoint, JPG, PDF/A,
  HEIC), edit (page numbers, watermark, crop, forms, edit), and security (protect, unlock,
  sign, redact, compare).
- **Next.js 16 App Router frontend** with a flat, shadowless, fully rounded design system,
  Manrope typography, dark and light themes, and client-side PDF previews.
- **Hono API gateway** with Zod validation, signed uploads, job polling, SQLite/PostgreSQL
  persistence, Redis + BullMQ queueing, and per-IP rate limiting.
- **Python 3.12 worker** with one recipe per tool, built on pikepdf, qpdf, Ghostscript,
  pdfplumber, ocrmypdf, ReportLab, WeasyPrint and Playwright.
- **Privacy-first processing**: ephemeral storage, scheduled purge, worker temp directories
  shredded after each job, magic-byte upload validation, and no tracking cookies.
- **Self-hosting**: `docker-compose.yml` for local development and `docker-compose.prod.yml`
  for a single-host deployment, with Dockerfiles for the API and worker.
- **SEO foundations**: generated `sitemap.xml` and `robots.txt`, JSON-LD for the site and
  application, and a Google Search Console verification tag.

### Known limitations

- AI Summarizer and Translate PDF are listed in the tool registry as coming soon and are not
  available yet.
- Interactive editing (`edit-pdf`) supports annotations on top of the page; it does not rewrite
  existing text.

[Unreleased]: https://github.com/tanbopp/pagelabs-pdf-tools/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/tanbopp/pagelabs-pdf-tools/releases/tag/v0.1.0
