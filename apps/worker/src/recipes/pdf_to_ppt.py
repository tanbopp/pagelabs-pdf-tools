import io
from pathlib import Path
import fitz  # PyMuPDF
from pptx import Presentation
from pptx.util import Inches


def pdf_to_ppt_recipe(
    input_path: Path,
    output_path: Path,
    options: dict = None
) -> Path:
    """
    Ultra-fast PDF to PPTX converter using PyMuPDF + python-pptx.
    Renders every PDF page directly to a crisp full-page slide image at 200 DPI.
    Eliminates all LibreOffice dependencies and completes in < 3 seconds.
    """
    dpi = 200
    if options and isinstance(options, dict):
        dpi = int(options.get("dpi", 200))

    pdf_doc = fitz.open(str(input_path))
    prs = Presentation()

    if len(pdf_doc) == 0:
        pdf_doc.close()
        prs.save(str(output_path))
        return output_path

    # Set slide dimensions matching the first page dimensions
    first_page = pdf_doc[0]
    width_pts, height_pts = first_page.rect.width, first_page.rect.height
    prs.slide_width = Inches(width_pts / 72.0)
    prs.slide_height = Inches(height_pts / 72.0)

    # Blank layout is layout 6
    blank_layout = prs.slide_layouts[6]

    zoom = dpi / 72.0
    mat = fitz.Matrix(zoom, zoom)

    for page_num in range(len(pdf_doc)):
        page = pdf_doc.load_page(page_num)

        # Render page to PNG at 200 DPI
        pix = page.get_pixmap(matrix=mat, alpha=False)
        img_stream = io.BytesIO(pix.tobytes("png"))

        slide = prs.slides.add_slide(blank_layout)
        slide.shapes.add_picture(
            img_stream,
            0,
            0,
            width=prs.slide_width,
            height=prs.slide_height,
        )

    prs.save(str(output_path))
    pdf_doc.close()

    if not output_path.exists() or output_path.stat().st_size == 0:
        raise ValueError("Failed to create PowerPoint presentation")

    return output_path
