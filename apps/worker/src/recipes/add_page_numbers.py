import io
from pathlib import Path
import pikepdf
from reportlab.pdfgen import canvas


def add_page_numbers_recipe(
    input_path: Path,
    output_path: Path,
    options: dict = None
) -> Path:
    """
    Overlay page numbers onto each page of the PDF.
    Options:
      - position: 'bottom-center' | 'bottom-right' | 'bottom-left' | 'top-center' | 'top-right' | 'top-left'
      - startNumber: int (default 1)
      - format: '1' | 'Page 1' | '1 / N'
    """
    options = options or {}
    position = options.get("position", "bottom-center")
    start_number = int(options.get("startNumber", 1))
    fmt = options.get("format", "Page 1")

    with pikepdf.open(input_path) as pdf:
        total_pages = len(pdf.pages)

        for idx, page in enumerate(pdf.pages):
            current_num = start_number + idx

            if fmt == "1":
                label = f"{current_num}"
            elif fmt == "1 / N":
                label = f"{current_num} / {start_number + total_pages - 1}"
            else:  # 'Page 1'
                label = f"Page {current_num}"

            media_box = page.mediabox
            pw = float(media_box[2] - media_box[0])
            ph = float(media_box[3] - media_box[1])

            # Coordinate calculation
            margin_x = 40
            margin_y = 30

            packet = io.BytesIO()
            c = canvas.Canvas(packet, pagesize=(pw, ph))
            c.setFont("Helvetica", 9)
            c.setFillColorRGB(0.3, 0.3, 0.3)

            text_width = c.stringWidth(label, "Helvetica", 9)

            if position == "bottom-center":
                x = (pw - text_width) / 2
                y = margin_y
            elif position == "bottom-right":
                x = pw - text_width - margin_x
                y = margin_y
            elif position == "bottom-left":
                x = margin_x
                y = margin_y
            elif position == "top-center":
                x = (pw - text_width) / 2
                y = ph - margin_y
            elif position == "top-right":
                x = pw - text_width - margin_x
                y = ph - margin_y
            elif position == "top-left":
                x = margin_x
                y = ph - margin_y
            else:
                x = (pw - text_width) / 2
                y = margin_y

            c.drawString(x, y, label)
            c.save()
            packet.seek(0)

            with pikepdf.open(packet) as overlay_pdf:
                page.add_overlay(overlay_pdf.pages[0])

        pdf.save(output_path)

    return output_path
