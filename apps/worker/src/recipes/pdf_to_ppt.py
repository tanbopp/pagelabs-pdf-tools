import io
import shutil
import subprocess
from pathlib import Path
from pptx import Presentation
from pptx.util import Inches
import fitz  # PyMuPDF


def find_soffice_binary() -> str | None:
    for cmd in ["soffice", "libreoffice"]:
        if shutil.which(cmd):
            return cmd
    return None


def pdf_to_ppt_fallback(pdf_path: Path, output_pptx: Path) -> None:
    """Fallback: Render each PDF page as an image slide in PowerPoint."""
    doc = fitz.open(str(pdf_path))
    prs = Presentation()
    # Blank slide layout
    blank_layout = prs.slide_layouts[6]

    for page_idx, page in enumerate(doc):
        pix = page.get_pixmap(dpi=150)
        img_bytes = pix.tobytes("png")

        slide = prs.slides.add_slide(blank_layout)
        image_stream = io.BytesIO(img_bytes)

        # Slide dimensions
        slide_width = prs.slide_width
        slide_height = prs.slide_height

        # Insert picture fitted to slide
        slide.shapes.add_picture(
            image_stream,
            left=0,
            top=0,
            width=slide_width,
            height=slide_height,
        )

    if len(prs.slides) == 0:
        prs.slides.add_slide(blank_layout)

    prs.save(str(output_pptx))


def pdf_to_ppt_recipe(
    input_path: Path,
    output_path: Path,
    options: dict = None
) -> Path:
    """
    Convert PDF pages to slides in PPTX using LibreOffice Headless.
    Fallback: PyMuPDF page rasterization into python-pptx presentation slides.
    """
    if options is None:
        options = {}

    soffice = find_soffice_binary()
    converted_via_soffice = False

    if soffice:
        cmd = [
            soffice,
            "--headless",
            "--convert-to",
            "pptx",
            "--outdir",
            str(output_path.parent),
            str(input_path),
        ]
        try:
            res = subprocess.run(cmd, capture_output=True, timeout=180)
            expected_out = output_path.parent / f"{input_path.stem}.pptx"
            if res.returncode == 0 and expected_out.exists() and expected_out.stat().st_size > 0:
                if expected_out != output_path:
                    shutil.move(expected_out, output_path)
                converted_via_soffice = True
        except Exception:
            converted_via_soffice = False

    if not converted_via_soffice:
        pdf_to_ppt_fallback(input_path, output_path)

    if not output_path.exists() or output_path.stat().st_size == 0:
        raise ValueError("Failed to convert PDF to PowerPoint PPTX")

    return output_path
