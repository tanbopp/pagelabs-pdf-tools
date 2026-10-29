import io
from pathlib import Path
import pikepdf
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor


def add_page_numbers_recipe(
    input_path: Path,
    output_path: Path,
    options: dict = None
) -> Path:
    """
    Overlay page numbers onto each page of the PDF with full iLovePDF UX replication:
    Options:
      - pageMode: 'single' | 'facing' (default 'single')
      - firstPageCover: bool (default False)
      - position: 'top-left' | 'top-center' | 'top-right' |
                  'middle-left' | 'middle-center' | 'middle-right' |
                  'bottom-left' | 'bottom-center' | 'bottom-right'
      - margin: 'small' | 'recommended' | 'big' (default 'recommended')
      - startNumber: int (default 1)
      - fromPage: int (1-indexed, default 1)
      - toPage: int (1-indexed, optional)
      - format: 'only-number' | 'page-n' | 'page-n-of-p' | 'custom'
      - customText: str (e.g. '- {n} -')
      - font: 'Arial' | 'Times-Roman' | 'Courier' (default 'Arial')
      - size: int (default 12)
      - isBold: bool (default False)
      - isItalic: bool (default False)
      - isUnderline: bool (default False)
      - color: str (hex '#000000')
    """
    options = options or {}
    page_mode = options.get("pageMode", "single")
    first_page_cover = bool(options.get("firstPageCover", False))
    position = options.get("position", "bottom-right")
    margin_mode = options.get("margin", "recommended")
    start_number = int(options.get("startNumber", 1))
    from_page = int(options.get("fromPage", 1))
    to_page = options.get("toPage")
    if to_page is not None:
        try:
            to_page = int(to_page)
        except Exception:
            to_page = None

    fmt_type = options.get("format", "only-number")
    custom_text = options.get("customText", "- {n} -")

    # Font setup
    font_name = options.get("font", "Arial")
    is_bold = bool(options.get("isBold", False))
    is_italic = bool(options.get("isItalic", False))
    is_underline = bool(options.get("isUnderline", False))
    font_size = int(options.get("size", 12))
    hex_color = options.get("color", "#000000")

    # Resolve reportlab standard fonts
    base_font = "Helvetica"
    if "times" in font_name.lower():
        base_font = "Times"
    elif "courier" in font_name.lower():
        base_font = "Courier"

    if base_font == "Helvetica":
        if is_bold and is_italic:
            rl_font = "Helvetica-BoldOblique"
        elif is_bold:
            rl_font = "Helvetica-Bold"
        elif is_italic:
            rl_font = "Helvetica-Oblique"
        else:
            rl_font = "Helvetica"
    elif base_font == "Times":
        if is_bold and is_italic:
            rl_font = "Times-BoldItalic"
        elif is_bold:
            rl_font = "Times-Bold"
        elif is_italic:
            rl_font = "Times-Italic"
        else:
            rl_font = "Times-Roman"
    else:  # Courier
        if is_bold and is_italic:
            rl_font = "Courier-BoldOblique"
        elif is_bold:
            rl_font = "Courier-Bold"
        elif is_italic:
            rl_font = "Courier-Oblique"
        else:
            rl_font = "Courier"

    # Margin offsets (in pt)
    if margin_mode == "small":
        margin_x = 20
        margin_y = 15
    elif margin_mode == "big":
        margin_x = 60
        margin_y = 50
    else:  # recommended
        margin_x = 36
        margin_y = 28

    try:
        color_obj = HexColor(hex_color)
    except Exception:
        color_obj = HexColor("#000000")

    with pikepdf.open(input_path) as pdf:
        total_pages = len(pdf.pages)
        end_page = to_page if (to_page and to_page <= total_pages) else total_pages

        for idx, page in enumerate(pdf.pages):
            page_num_1indexed = idx + 1

            # Skip if cover page
            if page_mode == "facing" and first_page_cover and page_num_1indexed == 1:
                continue

            # Skip if outside range
            if page_num_1indexed < from_page or page_num_1indexed > end_page:
                continue

            # Calculate page count offset for number
            if page_mode == "facing" and first_page_cover:
                current_num = start_number + (page_num_1indexed - 2)
            else:
                current_num = start_number + (page_num_1indexed - from_page)

            # Build label text
            if fmt_type == "only-number":
                label = f"{current_num}"
            elif fmt_type == "page-n":
                label = f"Page {current_num}"
            elif fmt_type == "page-n-of-p":
                label = f"Page {current_num} of {total_pages}"
            elif fmt_type == "custom":
                label = custom_text.replace("{n}", str(current_num)).replace("{p}", str(total_pages))
            else:
                label = f"Page {current_num}"

            media_box = page.mediabox
            pw = float(media_box[2] - media_box[0])
            ph = float(media_box[3] - media_box[1])

            # Facing pages position adjustment (alternate left/right)
            active_position = position
            if page_mode == "facing":
                is_even = (page_num_1indexed % 2 == 0)
                if "left" in position and is_even:
                    active_position = position.replace("left", "right")
                elif "right" in position and is_even:
                    active_position = position.replace("right", "left")

            packet = io.BytesIO()
            c = canvas.Canvas(packet, pagesize=(pw, ph))
            c.setFont(rl_font, font_size)
            c.setFillColor(color_obj)

            text_width = c.stringWidth(label, rl_font, font_size)

            # Compute X
            if "left" in active_position:
                x = margin_x
            elif "right" in active_position:
                x = pw - text_width - margin_x
            else:  # center
                x = (pw - text_width) / 2

            # Compute Y
            if "top" in active_position:
                y = ph - margin_y - font_size
            elif "bottom" in active_position:
                y = margin_y
            else:  # middle
                y = (ph - font_size) / 2

            c.drawString(x, y, label)

            # Optional underline
            if is_underline:
                c.setStrokeColor(color_obj)
                c.setLineWidth(1)
                c.line(x, y - 2, x + text_width, y - 2)

            c.save()
            packet.seek(0)

            overlay_pdf = pikepdf.open(packet)
            overlay_page = overlay_pdf.pages[0]
            page.add_overlay(overlay_page)

        pdf.save(output_path)

    return output_path
