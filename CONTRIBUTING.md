# Contributing to PageLabs

Thanks for taking the time to contribute. PageLabs is an open-source suite of 30+ PDF tools
built as a pnpm monorepo: a Next.js web app, a Hono API gateway, and a Python worker that does
the actual document processing.

This guide covers how to get a dev environment running, how the code is organised, and what we
expect from a pull request.

---

## Table of contents

- [Code of conduct](#code-of-conduct)
- [Ways to contribute](#ways-to-contribute)
- [Development setup](#development-setup)
- [Repository layout](#repository-layout)
- [Adding a new tool](#adding-a-new-tool)
- [Design rules](#design-rules)
- [Testing](#testing)
- [Commit messages](#commit-messages)
- [Pull requests](#pull-requests)

---

## Code of conduct

This project follows the [Contributor Covenant](./CODE_OF_CONDUCT.md). By participating you are
expected to uphold it. Report unacceptable behaviour to the maintainer listed in `SECURITY.md`.

## Ways to contribute

- Report a bug with the [bug report template](./.github/ISSUE_TEMPLATE/bug_report.md).
- Request a feature with the [feature request template](./.github/ISSUE_TEMPLATE/feature_request.md).
- Pick up something labelled [`good first issue`](https://github.com/tanbopp/pagelabs-pdf-tools/labels/good%20first%20issue) or [`help wanted`](https://github.com/tanbopp/pagelabs-pdf-tools/labels/help%20wanted).
- Improve documentation, add translations, or polish accessibility.
- Review open pull requests.

## Development setup

### Prerequisites

| Requirement | Version |
| --- | --- |
| Node.js | `>= 20` |
| pnpm | `>= 9` |
| Python | not required |
| Docker | not required |

### Install

```bash
git clone https://github.com/tanbopp/pagelabs-pdf-tools.git
cd pagelabs-pdf-tools
pnpm install
```

### Run

```bash
# Web app on http://localhost:3000
pnpm dev
```

There is no separate API or worker process. Every tool runs in the browser.

## Repository layout

```text
apps/web                 Next.js 16 App Router frontend (all tool UIs)
apps/web/src/lib/local   Browser processing engine (pdf-lib, pdf.js, tesseract.js)
packages/shared          Tool registry, Zod option schemas, shared types
```

The **tool registry** in `packages/shared/src/tools.ts` is the single source of truth. It drives the
homepage grid, the sitemap, and per-tool SEO. Categories live in `TOOL_CATEGORIES` in the same file.

The **local engine** in `apps/web/src/lib/local/` owns all file handling. `jobs.ts` maps a tool slug
to a processor and exposes a small in-memory job object; `tools-pdf.ts` and `tools-convert.ts` contain
the operations. Nothing in this folder may call `fetch` — files must stay on the device.

## Adding a new tool

1. Add a `ToolDefinition` entry to `TOOL_REGISTRY` in `packages/shared/src/tools.ts` with a unique
   `slug`, name, description, category, lucide `icon` name, accepted file types, and a Zod
   `optionsSchema` if the tool takes options.
2. Implement the browser processor in `apps/web/src/lib/local/tools-pdf.ts` (or
   `tools-convert.ts`) and register it in the `PROCESSORS` map in `apps/web/src/lib/local/jobs.ts`.
   If the operation is impossible in a browser, leave it out of the map — the UI will surface the
   standard "Browser limitations" message.
3. Add the UI under `apps/web/src/app/tools/<slug>/page.tsx` (client component using the shared
   `ToolLayout` / `ToolShell` components) plus a `layout.tsx` with `generateMetadata` for SEO.
   Start the job with `startJob(slug, files, options)` and poll it with `getJob(jobId)`; never
   upload a file.
4. Add tests: a case in `packages/shared` when you touch schemas or the registry, and a manual
   pass through the tool page (check the Network tab stays silent).
5. Mention the tool in `README.md` if the tool count changes.

## Design rules

PageLabs has an opinionated look. Any UI change must respect it:

- **Flat**: no shadows, no gradients, no glass effects.
- **Full-rounded**: radii come from the design tokens (cards 24px, inputs 20px, buttons pill).
- **High contrast**, neutral grayscale surfaces, one filled primary action per screen.
- **Manrope** only, weights 500/600/700, minimum 14px (and 600 weight below 16px).
- Respect `prefers-reduced-motion` and keep full keyboard access with visible focus rings.

See [`DESIGN.md`](./DESIGN.md) for the full token list.

## Testing

```bash
# TypeScript unit/schema tests
pnpm --filter @pagelabs/shared test

# Type checking and linting
pnpm typecheck
pnpm lint

# Full production build
pnpm build
```

CI runs install + tests + typecheck + build on every push and pull request
(`.github/workflows/ci.yml`).

## Commit messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

```text
feat(web): add rotate-preview to organize tool
fix(api): reject uploads with spoofed magic bytes
docs(readme): document self-hosting with Docker
chore(ci): cache pnpm store
```

Keep commits small and focused. One logical change per commit.

## Pull requests

- Branch from `main`, keep the branch name descriptive (`feat/...`, `fix/...`, `docs/...`).
- Fill in the pull request template, including how you tested the change.
- Link the issue you are closing (`Closes #123`).
- Make sure CI is green before asking for review.
- Never commit secrets, real `.env` values, or large binary fixtures.

New to the project? Say so in the PR — we are happy to walk you through it.
