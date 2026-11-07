# Docs

Assets and notes used by the repository README and GitHub settings.

| File | Purpose |
| --- | --- |
| `screenshots/homepage.png` | Homepage hero (1440×900, dark theme) |
| `screenshots/homepage-full.png` | Full homepage, all tool categories |
| `screenshots/merge-pdf.png` | Merge PDF tool workspace |
| `screenshots/compress-pdf.png` | Compress PDF tool workspace |
| `screenshots/edit-pdf.png` | Edit PDF tool workspace |
| `demo.gif` | Four-frame tour: homepage → merge → compress → edit |
| `social-preview.png` | 1280×640 GitHub social preview |
| `social-preview.html` | Source HTML for the social preview |

## Regenerating the screenshots

The capture script drives Chromium with Playwright. Playwright is intentionally **not** a
workspace dependency (it is only needed for docs), so run it from a scratch install:

```bash
npm install playwright --prefix /tmp/pwtools
npx playwright install chromium

PLAYWRIGHT_MODULE=/tmp/pwtools/node_modules/playwright/index.js \
  node scripts/capture-docs.mjs
```

On Windows PowerShell:

```powershell
npm install playwright --prefix "$env:TEMP\pwtools"
node "$env:TEMP\pwtools\node_modules\playwright\cli.js" install chromium

$env:PLAYWRIGHT_MODULE="$env:TEMP\pwtools\node_modules\playwright\index.js"
node scripts/capture-docs.mjs
```

Set `BASE_URL` to capture a local dev server instead of the hosted site:

```bash
BASE_URL=http://localhost:3000 node scripts/capture-docs.mjs
```

The GIF is assembled from the screenshots with Pillow:

```bash
pip install pillow
python - <<'PY'
from PIL import Image
from pathlib import Path
root = Path("docs")
shots = ["screenshots/homepage.png", "screenshots/merge-pdf.png",
         "screenshots/compress-pdf.png", "screenshots/edit-pdf.png"]
W, H, BG = 1200, 750, (18, 18, 18)
frames = []
for rel in shots:
    im = Image.open(root / rel).convert("RGB")
    im = im.resize((W, round(im.height * W / im.width)), Image.LANCZOS)
    if im.height > H:
        im = im.crop((0, 0, W, H))
    canvas = Image.new("RGB", (W, H), BG)
    canvas.paste(im, (0, 0))
    frames.append(canvas.convert("P", palette=Image.ADAPTIVE, colors=128))
frames[0].save(root / "demo.gif", save_all=True, append_images=frames[1:],
               duration=2600, loop=0, optimize=True, disposal=2)
PY
```

## Social preview

`social-preview.png` is 1280×640 with an off-white background, near-black Manrope headline and a
single red accent. Upload it manually at **Settings → Social preview** in the GitHub repository.
See [GITHUB_SETUP.md](GITHUB_SETUP.md) for the description, topics, labels, starter issues and
release commands.
