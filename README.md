# PageLabs

> Clean, Modern, and Private PDF Tools. Every PDF tool in one place — Fast, Minimal, and Free.

PageLabs is an open-source, modern suite of 25+ PDF utilities built with Next.js 16 (App Router), Hono, and a high-performance Python worker pipeline leveraging native PDF libraries (`pikepdf`, `qpdf`, `Ghostscript`, `pdfplumber`, `ocrmypdf`, and `ReportLab`).

---

## 🚀 Key Highlights & Architectural Strengths

- **No Shadows, Ultra-Clean Design:** Strict minimal aesthetics, stark high-contrast typography (Manrope font), and smooth micro-interactions.
- **Privacy-First (Shred on Complete):** Strict ephemeral storage. Uploaded and generated files are automatically purged from storage with an automated purge cron and worker shredded temp dirs.
- **Security Hardened:**
  - Content Security Policy (CSP), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`.
  - Binary Magic Byte signature validation on uploads (prevents executable MIME spoofing).
  - Subprocess shell sanitization and strict directory traversal prevention.
- **Performance & Resiliency:**
  - Preloaded Manrope typography with zero cumulative layout shift (CLS).
  - Out of Memory (OOM) handling for heavy PDF processing workloads.
  - Strict anonymous rate limiting (10 jobs/hour per IP).
- **Accessibility (A11y):**
  - Full keyboard accessibility and screen reader support (`aria-label`, `aria-describedby`, focus rings).
  - Respects OS-level `prefers-reduced-motion` settings.

---

## 🛠 Tech Stack

- **Frontend:** Next.js 16 (App Router, Turbopack, Server Components), Tailwind CSS v4, Lucide React, dnd-kit.
- **API Gateway:** Hono on Node.js, Zod schema validation, SQLite / PostgreSQL, Redis BullMQ.
- **Processing Engine:** Python 3.12 (`pikepdf`, `qpdf`, `ghostscript`, `reportlab`, `ocrmypdf`, `playwright`, `weasyprint`, `pdf2docx`, `openpyxl`).
- **Storage & Infrastructure:** MinIO / AWS S3 / Cloudflare R2, Docker & Docker Compose.

---

## 📦 Project Structure

```text
PageLabs/
├── apps/
│   ├── api/          # Hono API gateway, job management, signed uploads, rate-limiting
│   ├── web/          # Next.js 16 web application & interactive PDF tools
│   └── worker/       # Python processing recipes & CLI runner
├── packages/
│   └── shared/       # Shared Zod schemas, tool registries, and types
├── docker-compose.yml       # Local development containers (Postgres, Redis, MinIO)
├── docker-compose.prod.yml  # Production multi-container orchestrator
└── .env.production.example  # Production environment variables reference
```

---

## 🏁 Getting Started (Local Development)

### 1. Prerequisites
- **Node.js:** `>= 20.0.0`
- **pnpm:** `>= 9.0.0`
- **Python:** `>= 3.11`
- **Docker & Docker Compose** (optional for local Redis/MinIO/Postgres)

### 2. Clone and Install Dependencies
```bash
git clone https://github.com/your-org/pagelabs.git
cd pagelabs

# Install monorepo JS/TS dependencies
pnpm install

# Setup Python worker virtual environment
cd apps/worker
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
cd ../..
```

### 3. Start Infrastructure Services (Optional / Recommended)
```bash
docker compose up -d
```

### 4. Run Development Servers
```bash
# Run all workspace apps concurrently
pnpm dev
```
- Web Application: [http://localhost:3000](http://localhost:3000)
- API Gateway: [http://localhost:3001](http://localhost:3001)

---

## 🚢 Production Deployment

### Option A: Full Docker Compose (VPS / Single Host)
1. Copy and configure production environment variables:
   ```bash
   cp .env.production.example .env.production
   ```
2. Build and run containers:
   ```bash
   docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
   ```

### Option B: Cloud Split Deployment (Recommended)
- **Frontend (apps/web):** Deploy to **Vercel** or **Cloudflare Pages**.
  - Root directory: `apps/web`
  - Build command: `pnpm build`
  - Output directory: `.next`
  - Set `NEXT_PUBLIC_API_URL` to your production API URL.
- **API Gateway (apps/api):** Deploy to **Railway**, **Render**, or **Fly.io** using `apps/api/Dockerfile`.
- **Python Worker (apps/worker):** Deploy as a background worker on **Railway** or AWS ECS with GPU/CPU worker nodes using `apps/worker/Dockerfile`.
- **Database & Storage:** Managed PostgreSQL (e.g. Supabase / Neon) and AWS S3 / Cloudflare R2.

---

## 🧪 Testing & Validation

```bash
# Run unit & schema tests
pnpm --filter @pagelabs/shared test
pnpm --filter @pagelabs/api test

# Full monorepo production build check
pnpm build
```

---

## 📄 License
MIT License. Free and open source for everyone.

