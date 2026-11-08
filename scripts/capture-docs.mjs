/**
 * Regenerates the screenshots and social preview used in the README and docs.
 *
 * Usage (from the repository root):
 *   npx playwright install chromium   # first time only
 *   node scripts/capture-docs.mjs
 *
 * Requires the hosted instance to be reachable, or set BASE_URL to a local dev server.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

// Playwright is a docs-only tool, so it is not a workspace dependency.
// Set PLAYWRIGHT_MODULE to an absolute path if it lives outside the repo.
const playwrightModule = process.env.PLAYWRIGHT_MODULE
  ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href
  : "playwright";
const pw = await import(playwrightModule);
const chromium = pw.chromium ?? pw.default?.chromium;

const BASE_URL = process.env.BASE_URL ?? "https://pagelabs.tanbopp.cloud";
const OUT_DIR = path.resolve("docs/screenshots");

const SHOTS = [
  { name: "homepage", path: "/" },
  { name: "homepage-full", path: "/", fullPage: true },
  { name: "merge-pdf", path: "/tools/merge-pdf" },
  { name: "compress-pdf", path: "/tools/compress-pdf" },
  { name: "edit-pdf", path: "/tools/edit-pdf" },
];

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    colorScheme: "dark",
  });

  for (const shot of SHOTS) {
    const page = await context.newPage();
    const url = new URL(shot.path, BASE_URL).toString();
    await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 });
    // Let fonts settle and any entry animation finish.
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(800);
    const file = path.join(OUT_DIR, `${shot.name}.png`);
    await page.screenshot({ path: file, fullPage: Boolean(shot.fullPage) });
    console.log(`captured ${file}`);
    await page.close();
  }

  await context.close();

  // Social preview: 1280x640, flat, headline only.
  const socialHtml = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700&display=swap" rel="stylesheet" />
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: 1280px; height: 640px; }
  body {
    background: #f7f6f3;
    color: #0b0b0b;
    font-family: "Manrope", system-ui, sans-serif;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 72px 80px;
    position: relative;
    overflow: hidden;
  }
  .mark { display: flex; align-items: center; gap: 14px; font-weight: 700; font-size: 30px; letter-spacing: -0.01em; }
  .dot { width: 26px; height: 26px; background: #0b0b0b; border-radius: 9px; }
  .dot-inner { width: 26px; height: 26px; border: 4px solid #0b0b0b; border-radius: 9px; margin-left: -6px; }
  h1 { font-size: 96px; line-height: 1.02; font-weight: 700; letter-spacing: -0.035em; max-width: 900px; }
  h1 span { display: block; }
  .accent { text-decoration: underline; text-decoration-color: #ff5c39; text-decoration-thickness: 10px; text-underline-offset: 12px; }
  p { font-size: 28px; font-weight: 500; color: #3d3d3d; max-width: 760px; line-height: 1.35; }
  .footer { display: flex; align-items: center; justify-content: space-between; font-size: 22px; font-weight: 600; }
  .pill { border: 2px solid #0b0b0b; border-radius: 999px; padding: 10px 22px; }
</style>
</head>
<body>
  <div class="mark"><div class="dot"></div><div class="dot-inner"></div><span>PageLabs</span></div>
  <div>
    <h1><span>Every PDF tool.</span><span class="accent">One place.</span></h1>
    <p style="margin-top:28px">30+ free PDF tools. Private by default. Files shredded after processing.</p>
  </div>
  <div class="footer"><span>pagelabs.tanbopp.cloud</span><span class="pill">Open source · MIT</span></div>
</body>
</html>`;

  const socialHtmlPath = path.resolve("docs/social-preview.html");
  await writeFile(socialHtmlPath, socialHtml, "utf8");

  const socialPage = await browser.newPage();
  await socialPage.setViewportSize({ width: 1280, height: 640 });
  await socialPage.goto(`file://${socialHtmlPath.replace(/\\/g, "/")}`);
  await socialPage.evaluate(() => document.fonts.ready);
  await socialPage.waitForTimeout(500);
  await socialPage.screenshot({
    path: path.resolve("docs/social-preview.png"),
    clip: { x: 0, y: 0, width: 1280, height: 640 },
  });
  console.log("captured docs/social-preview.png");
  await socialPage.close();

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
