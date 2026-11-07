# GitHub repository setup

Everything in this file is a one-time action that lives in GitHub's settings rather than in the
repository. Run it once after merging the growth PR, or copy/paste the `gh` commands.

Requires an authenticated [GitHub CLI](https://cli.github.com/) (`gh auth login`). Every command
assumes you are in the repository root.

---

## 1. About, homepage and topics

```bash
gh repo edit tanbopp/pagelabs-pdf-tools \
  --description "Clean, privacy-first suite of 30+ PDF tools: merge, compress, convert, OCR and more. Files shredded after processing. Free and open source." \
  --homepage "https://pagelabs.tanbopp.cloud" \
  --add-topic pdf-tools,pdf-processing,pdf-converter,pdf-compressor,ocr,privacy-first,open-source,nextjs,hono,typescript,python,tailwindcss,monorepo,pnpm,docker,bullmq,ghostscript,pikepdf,vercel \
  --enable-discussions
```

If `--enable-discussions` is not supported by your CLI version, turn on **Settings → General →
Features → Discussions** in the web UI.

## 2. Labels

```bash
gh label create "good first issue" --color 7057ff --description "Small, well-scoped change for a first contribution"
gh label create "help wanted"      --color 008672 --description "Extra attention is needed"
gh label create "documentation"    --color 0075ca --description "Improvements or additions to documentation"
gh label create "enhancement"      --color a2eeef --description "New feature or request"
gh label create "bug"              --color d73a4a --description "Something is not working"
gh label create "i18n"             --color fbca04 --description "Internationalisation and translations"
gh label create "accessibility"    --color 5319e7 --description "Keyboard, screen reader and contrast improvements"
```

## 3. Social preview and repository images

1. Go to <https://github.com/tanbopp/pagelabs-pdf-tools/settings>.
2. Under **Social preview**, click **Edit** and upload `docs/social-preview.png` (1280×640).
3. Under **Features**, tick **Discussions** and **Issues**.

## 4. Starter issues

The first three become redundant once this PR is merged — check before creating.

```bash
gh issue create --title "Add screenshots and a demo GIF to the README" \
  --label "documentation" --label "good first issue" \
  --body $'The README should open with a real screenshot of the product.\n\n## Tasks\n- [x] Capture the homepage and three tool pages with Playwright\n- [x] Add `docs/screenshots/*.png` and `docs/demo.gif`\n- [x] Embed them in `README.md`\n- [ ] Refresh the images when the UI changes\n\nSee `docs/README.md` for the exact regeneration commands.'
```

```bash
gh issue create --title "AI Summarizer: summarize PDF documents" \
  --label "enhancement" --label "help wanted" \
  --body $'The `ai-summarizer` entry already exists in `packages/shared/src/tools.ts` with `available: false`.\n\n## Proposal\nSummarize a PDF into a short, faithful abstract without sending the document to a third party unless the user opts in.\n\n## Tasks\n- [ ] Decide the model provider and how to opt in (no cookie/tracking changes)\n- [ ] Extract text with the existing worker pipeline, chunk long documents\n- [ ] Add `apps/worker/src/recipes/ai_summarizer.py` and register it in `runner.py`\n- [ ] Build the UI at `apps/web/src/app/tools/ai-summarizer/page.tsx`\n- [ ] Add the explainer/FAQ copy to `apps/web/src/lib/tool-seo.ts`\n- [ ] Flip `available` to `true`\n\n## Notes\nPrivacy promises must hold: no retention of document text beyond the job lifetime.'
```

```bash
gh issue create --title "Translate PDF while preserving the original layout" \
  --label "enhancement" --label "help wanted" \
  --body $'The `translate-pdf` entry exists in the tool registry with `available: false`.\n\n## Proposal\nTranslate a PDF into another language while keeping fonts, columns and images in place.\n\n## Tasks\n- [ ] Evaluate an extraction → translation → re-layout pipeline\n- [ ] Handle CJK and RTL scripts\n- [ ] Add the worker recipe and register it\n- [ ] Add the tool page and SEO copy\n- [ ] Flip `available` to `true`'
```

```bash
gh issue create --title "Add Indonesian (and multi-language) UI support" \
  --label "enhancement" --label "i18n" --label "help wanted" \
  --body $'The UI is English-only today. `apps/web/src/locales/faq.ts` is a single-language module and all tool copy lives inline.\n\n## Tasks\n- [ ] Introduce a locale-aware message layer (route prefix or cookie-free negotiation)\n- [ ] Extract UI strings from the tool pages and shared components\n- [ ] Ship `id-ID` first, then accept community translations\n- [ ] Keep `hreflang` and canonical URLs correct per locale\n- [ ] No cookies: prefer path-based locales (`/id/...`)\n\n## Constraints\nThe no-cookie promise must stay true, so avoid locale cookies.'
```

Three more from the audit:

```bash
gh issue create --title "Lint: fix 46 pre-existing ESLint errors so CI can enforce lint" \
  --label "bug" --label "good first issue" \
  --body $'`pnpm --filter web lint` currently fails with 46 errors and about 1.6k warnings, which is why CI does not run lint yet.\n\n## Most common findings\n- `no-explicit-any` in `apps/web/src/lib/pdf-preview.ts`\n- `set-state-in-effect` in `apps/web/src/components/theme-toggle.tsx`\n- unused variables in `pdf-preview.ts`\n\n## Tasks\n- [ ] Type the pdf.js boundary instead of using `any`\n- [ ] Replace the mount flag in `theme-toggle.tsx` with a hydration-safe pattern\n- [ ] Remove dead code flagged as unused\n- [ ] Add `pnpm lint` to `.github/workflows/ci.yml` once the errors are gone'
```

```bash
gh issue create --title "Remove the unused Pages Router SEO component" \
  --label "documentation" --label "good first issue" \
  --body $'`apps/web/src/components/SEO.tsx` imports `next/head`, which is a Pages Router API and does nothing in the App Router. All metadata now lives in `layout.tsx` files via `apps/web/src/lib/tool-seo.ts`. This component should be deleted to avoid confusion.'
```

```bash
gh issue create --title "Mobile: tool workspaces lock the viewport height and can hide the options panel" \
  --label "bug" --label "accessibility" --label "help wanted" \
  --body $'`ToolLayout` renders `<main className="... h-[calc(100vh-65px)] overflow-hidden">` with the settings panel stacked below the canvas on small screens. On short or zoomed mobile viewports the options can be unreachable because the container does not scroll.\n\n## Tasks\n- [ ] Reproduce at 360×640 and with 200% text zoom\n- [ ] Switch to `min-h` plus natural scrolling on small screens\n- [ ] Confirm the sticky action button stays reachable\n- [ ] Check `prefers-reduced-motion` and focus order afterwards'
```

## 5. Tagged release v0.1.0

`CHANGELOG.md` already contains the notes. Tag the merge commit of this PR:

```bash
git checkout main
git pull
git tag -a v0.1.0 -m "PageLabs v0.1.0 — 31 PDF tools, privacy-first processing, self-hostable"
git push origin v0.1.0

gh release create v0.1.0 \
  --title "PageLabs v0.1.0" \
  --notes-file CHANGELOG.md \
  --latest
```

## 6. Optional: branch protection

```bash
gh api -X PUT repos/tanbopp/pagelabs-pdf-tools/branches/main/protection \
  -f "required_status_checks[strict]=true" \
  -f "required_status_checks[contexts][]=Install, test and build" \
  -f "required_status_checks[contexts][]=Python worker tests" \
  -f "enforce_admins=false" \
  -f "required_pull_request_reviews[required_approving_review_count]=1" \
  -f "restrictions="
```
