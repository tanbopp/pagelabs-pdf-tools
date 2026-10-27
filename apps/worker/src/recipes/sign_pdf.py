import base64
import io
import tempfile
from pathlib import Path
import pikepdf
from PIL import Image
from reportlab.pdfgen import canvas


def sign_pdf_recipe(
    input_path: Path,
    output_path: Path,
    options: dict = None
) -> Path:
    """
    Sign PDF by overlaying a signature image or text name onto a chosen page.
    Options:
      - page: int (1-indexed) or 'last' (default 'last')
      - position: 'bottom-right' | 'bottom-center' | 'top-right' (default 'bottom-right')
      - nameText: str (optional)
      - signatureImage: str (optional base64 or file path)
    """
    if options is None:
        options = {}

    page_opt = options.get("page", "last")
    position = options.get("position", "bottom-right")
    name_text = options.get("nameText", "").strip()
    sig_img_data = options.get("signatureImage", "")

    with pikepdf.open(input_path) as pdf:
        num_pages = len(pdf.pages)
        if page_opt == "last" or page_opt is None:
            target_page_idx = num_pages - 1
        else:
            try:
                target_page_idx = int(page_opt) - 1
            except ValueError:
                target_page_idx = num_pages - 1

        if target_page_idx < 0:
            target_page_idx = 0
        elif target_page_idx >= num_pages:
            target_page_idx = num_pages - 1

        target_page = pdf.pages[target_page_idx]
        media_box = target_page.mediabox
        page_width = float(media_box[2] - media_box[0])
        page_height = float(media_box[3] - media_box[1])

        # Prepare signature image or text
        sig_width = 140
        sig_height = 50

        # Calculate coordinates (ReportLab origin is bottom-left)
        margin_x = 40
        margin_y = 40

        if position == "bottom-right":
            x = page_width - sig_width - margin_x
            y = margin_y
        elif position == "bottom-center":
            x = (page_width - sig_width) / 2
            y = margin_y
        elif position == "top-right":
            x = page_width - sig_width - margin_x
            y = page_height - sig_height - margin_y
        else:
            x = page_width - sig_width - margin_x
            y = margin_y

        # Build overlay PDF canvas in memory
        packet = io.BytesIO()
        c = canvas.Canvas(packet, pagesize=(page_width, page_height))

        # Check if signature image provided
        img_drawn = False
        if sig_img_data:
            try:
                # Handle base64 or path
                if sig_img_data.startswith("data:image"):
                    base64_part = sig_img_data.split(",", 1)[1]
                    raw_bytes = base64.b64decode(base64_part)
                elif Path(sig_img_data).exists():
                    raw_bytes = Path(sig_img_data).read_bytes()
                else:
                    raw_bytes = base64.b64decode(sig_img_data)

                # Open via PIL
                pil_img = Image.open(io.BytesIO(raw_bytes))
                with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp_img_file:
                    pil_img.save(tmp_img_file.name, format="PNG")
                    tmp_img_path = tmp_img_file.name

                c.drawImage(tmp_img_path, x, y, width=sig_width, height=sig_height, mask="auto")
                Path(tmp_img_path).unlink(missing_ok=True)
                img_drawn = True
            except Exception:
                img_drawn = False

        if not img_drawn and name_text:
            # Draw handwritten-like signature representation
            c.setFont("Helvetica-BoldOblique", 18)
            c.drawString(x, y + 20, name_text)
            c.setStrokeColorRGB(0.2, 0.2, 0.2)
            c.setLineWidth(1)
            c.line(x, y + 14, x + sig_width, y + 14)
            c.setFont("Helvetica", 8)
            c.drawString(x, y + 2, "Digitally Signed via PageLabs")
        elif not img_drawn and not name_text:
            # Default signature stamp
            c.setFont("Helvetica-BoldOblique", 14)
            c.drawString(x, y + 20, "Signed")
            c.setFont("Helvetica", 8)
            c.drawString(x, y + 6, "PageLabs Verified")

        c.save()
        packet.seek(0)

        # Merge overlay into target page
        with pikepdf.open(packet) as overlay_pdf:
            target_page.add_overlay(overlay_pdf.pages[0])

        pdf.save(output_path)

    return output_path
