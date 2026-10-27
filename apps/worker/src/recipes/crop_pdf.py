from pathlib import Path
import pikepdf
import fitz  # PyMuPDF


def crop_pdf_recipe(
    input_path: Path,
    output_path: Path,
    options: dict = None
) -> Path:
    """
    Trim PDF margins (Auto-crop or Manual top/bottom/left/right in pt).
    Options:
      - mode: 'auto' | 'manual'
      - top: float
      - bottom: float
      - left: float
      - right: float
      - applyTo: 'all'
    """
    options = options or {}
    mode = options.get("mode", "auto")

    if mode == "auto":
        # Calculate bounding box of visible content using fitz
        doc = fitz.open(str(input_path))
        with pikepdf.open(input_path) as pdf:
            for idx, page in enumerate(pdf.pages):
                fitz_page = doc[idx]
                # Get visible drawings and text rects
                rect = fitz_page.rect
                draw_rect = fitz.Rect()
                for drawing in fitz_page.get_drawings():
                    draw_rect |= drawing["rect"]
                for block in fitz_page.get_text("blocks"):
                    draw_rect |= fitz.Rect(block[:4])

                if not draw_rect.is_empty:
                    # Add 10pt safety padding
                    crop_x0 = max(float(rect.x0), float(draw_rect.x0) - 10)
                    crop_y0 = max(float(rect.y0), float(draw_rect.y0) - 10)
                    crop_x1 = min(float(rect.x1), float(draw_rect.x1) + 10)
                    crop_y1 = min(float(rect.y1), float(draw_rect.y1) + 10)

                    # In PDF coordinate system, Y starts from bottom
                    ph = float(page.mediabox[3] - page.mediabox[1])
                    pdf_y0 = ph - crop_y1
                    pdf_y1 = ph - crop_y0

                    page.CropBox = [crop_x0, pdf_y0, crop_x1, pdf_y1]
                    page.MediaBox = [crop_x0, pdf_y0, crop_x1, pdf_y1]

            pdf.save(output_path)
        doc.close()
    else:
        # Manual margin trim
        top = float(options.get("top", 0))
        bottom = float(options.get("bottom", 0))
        left = float(options.get("left", 0))
        right = float(options.get("right", 0))

        with pikepdf.open(input_path) as pdf:
            for page in pdf.pages:
                mb = [float(v) for v in page.mediabox]
                x0, y0, x1, y1 = mb[0], mb[1], mb[2], mb[3]

                new_x0 = x0 + left
                new_y0 = y0 + bottom
                new_x1 = max(new_x0 + 10, x1 - right)
                new_y1 = max(new_y0 + 10, y1 - top)

                page.CropBox = [new_x0, new_y0, new_x1, new_y1]
                page.MediaBox = [new_x0, new_y0, new_x1, new_y1]

            pdf.save(output_path)

    return output_path
