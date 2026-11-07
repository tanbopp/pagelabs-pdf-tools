<div align="center">

# PageLabs

**Every PDF tool. One place.**

Clean, modern, and private PDF tools. Fast, minimal, and free.

[**Live Demo**](https://pagelabs.tanbopp.cloud) · [Report a Bug](https://github.com/tanbopp/pagelabs-pdf-tools/issues) · [Request a Feature](https://github.com/tanbopp/pagelabs-pdf-tools/issues)

![License: MIT](https://img.shields.io/badge/license-MIT-black.svg)
![Next.js 16](https://img.shields.io/badge/Next.js-16-black.svg)
![Python 3.12](https://img.shields.io/badge/Python-3.12-black.svg)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-black.svg)

</div>

<!-- Add a screenshot or demo GIF here, e.g.
![PageLabs preview](./docs/preview.png)
-->

---

## About

PageLabs is an open-source suite of **30+ PDF tools** that does one thing well: gets your PDF job done without noise. No signup, no cookies, no clutter. Your files are automatically shredded after processing (within 2 hours at most).

Under the hood, a Next.js frontend and a Hono API hand the heavy lifting to a Python worker pipeline built on native PDF libraries (`pikepdf`, `qpdf`, `Ghostscript`, `pdfplumber`, `ocrmypdf`, and `ReportLab`), so even large files are handled reliably.

---

## Tools

| Category | Tools |
| --- | --- |
| **Organize & Manage** | Merge PDF, Split PDF, Remove Pages, Extract Pages, Organize PDF, Scan to PDF, Rotate PDF |
| **Optimize & Repair** | Compress PDF, Repair PDF, OCR PDF |
| **Convert to PDF** | Word to PDF, Excel to PDF, PowerPoint to PDF, JPG to PDF, HTML to PDF |
| **Convert from PDF** | PDF to Word, PDF to Excel, PDF to PowerPoint, PDF to JPG, PDF to PDF/A, HEIC to JPG |
| **Edit PDF** | Page Numbers, Watermark, Crop PDF, PDF Forms, Edit PDF |
| **Security** | Protect PDF, Unlock PDF, Sign PDF, Redact PDF, Compare PDF |
| **AI Tools** *(coming soon)* | AI Summarizer, Translate PDF |

Try them all at **[pagelabs.tanbopp.cloud](https://pagelabs.tanbopp.cloud)**.

---

## Key Highlights

- **No Shadows, Ultra-Clean Design:** Strict minimal aesthetics, stark high-contrast typography (Manrope), and smooth micro-interactions.
- **Privacy-First (Shred on Complete):** Strictly ephemeral storage. Uploaded and generated files are automatically purged with a scheduled purge cron, and worker temp directories are shredded after each job.
- **Security Hardened:**
  - Content Security Policy (CSP), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`.
  - Binary magic-byte signature validation on uploads (prevents executable MIME spoofing).
  - Subprocess shell sanitization and strict directory traversal prevention.
- **Performance & Resiliency:**
  - Preloaded Manrope typography with zero cumulative layout shift (CLS).
  - Out-of-memory (OOM) handling for heavy PDF processing workloads.
  - Strict anonymous rate limiting (10 jobs/hour per IP).
- **Accessibility (A11y):**
  - Full keyboard accessibility and screen reader support (`aria-label`, `aria-describedby`, focus rings).
  - Respects OS-level `prefers-reduced-motion` settings.

---

## Tech Stack

- **Frontend:** Next.js 16 (App Router, Turbopack, Server Components), Tailwind CSS v4, Lucide React, dnd-kit.
- **API Gateway:** Hono on Node.js, Zod schema validation, SQLite / PostgreSQL, Redis BullMQ.
- **Processing Engine:** Python 3.12 (`pikepdf`, `qpdf`, `ghostscript`, `reportlab`, `ocrmypdf`, `playwright`, `weasyprint`, `pdf2docx`, `openpyxl`).
- **Storage & Infrastructure:** MinIO / AWS S3 / Cloudflare R2, Docker & Docker Compose.

---

## Project Structure

```text
pagelabs-pdf-tools/
├── apps/
│   ├── api/          # Hono API gateway, job management, signed uploads, rate limiting
│   ├── web/          # Next.js 16 web application & interactive PDF tools
│   └── worker/       # Python processing recipes & CLI runner
├── packages/
│   └── shared/       # Shared Zod schemas, tool registries, and types
├── docker-compose.yml       # Local development containers (Postgres, Redis, MinIO)
├── docker-compose.prod.yml  # Production multi-container orchestrator
└── .env.production.example  # Production environment variables reference
```

---

## Getting Started (Local Development)

### 1. Prerequisites

- **Node.js:** `>= 20.0.0`
- **pnpm:** `>= 9.0.0`
- **Python:** `>= 3.11`
- **Docker & Docker Compose** (optional, for local Redis / MinIO / Postgres)

### 2. Clone and Install Dependencies

```bash
git clone https://github.com/tanbopp/pagelabs-pdf-tools.git
cd pagelabs-pdf-tools

# Copy the example environment file and adjust the values
cp .env.example .env

# Install monorepo JS/TS dependencies
pnpm install

# Set up the Python worker virtual environment
cd apps/worker
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
cd ../..
```

### 3. Start Infrastructure Services (Recommended)

```bash
docker compose up -d
```

### 4. Run Development Servers

```bash
# Run all workspace apps concurrently
pnpm dev
```

- Web application: [http://localhost:3000](http://localhost:3000)
- API gateway: [http://localhost:3001](http://localhost:3001)

---

## Production Deployment

### Option A: Full Docker Compose (VPS / Single Host)

1. Copy and configure the production environment variables:
   ```bash
   cp .env.production.example .env.production
   ```
2. Build and run the containers:
   ```bash
   docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
   ```

### Option B: Cloud Split Deployment (Recommended)

- **Frontend (`apps/web`):** Deploy to **Vercel** or **Cloudflare Pages**.
  - Root directory: `apps/web`
  - Build command: `pnpm build`
  - Output directory: `.next`
  - Set `NEXT_PUBLIC_API_URL` to your production API URL.
- **API Gateway (`apps/api`):** Deploy to **Railway**, **Render**, or **Fly.io** using `apps/api/Dockerfile`.
- **Python Worker (`apps/worker`):** Deploy as a background worker on **Railway** or AWS ECS (CPU/GPU nodes) using `apps/worker/Dockerfile`.
- **Database & Storage:** Managed PostgreSQL (e.g. Supabase / Neon) and AWS S3 / Cloudflare R2.

---

## Testing & Validation

```bash
# Run unit & schema tests
pnpm --filter @pagelabs/shared test
pnpm --filter @pagelabs/api test

# Full monorepo production build check
pnpm build
```

---

## Roadmap

- [ ] **AI Summarizer:** summarize PDF documents quickly
- [ ] **Translate PDF:** translate while preserving the original layout
- [ ] **Multi-language UI:** starting with Indonesian
- [ ] More tools and improvements based on your feedback

Have an idea? [Open an issue](https://github.com/tanbopp/pagelabs-pdf-tools/issues).

---

## Contributing

Contributions are welcome, whether it's a bug fix, a new tool, or a docs improvement.

1. Fork the repository
2. Create a branch: `git checkout -b feature/your-feature`
3. Make your changes and run the tests (see [Testing & Validation](#testing--validation))
4. Commit and push: `git commit -m "Add your feature"`
5. Open a Pull Request

New here? Look for issues labeled [`good first issue`](https://github.com/tanbopp/pagelabs-pdf-tools/labels/good%20first%20issue).

---

## License

MIT License. Free and open source for everyone.

---

<div align="center">

If PageLabs saves you some time, consider giving it a ⭐

</div>
