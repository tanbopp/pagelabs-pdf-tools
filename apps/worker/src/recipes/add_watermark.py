import base64
import io
import math
import tempfile
from pathlib import Path
import pikepdf
from PIL import Image
from reportlab.pdfgen import canvas


def add_watermark_recipe(
    input_path: Path,
    output_path: Path,
    options: dict = None
) -> Path:
    """
    Stamp a text or image watermark with advanced features:
    Options:
      - type: 'text' | 'image' (default 'text')
      - text: str (default 'CONFIDENTIAL')
      - image: str (base64 or path)
      - opacity: float (0.0 - 1.0, default 0.5)
      - position: 'center' | 'diagonal' | 'top-left' | 'top-center' | 'top-right'
                  | 'middle-left' | 'middle-center' | 'middle-right'
                  | 'bottom-left' | 'bottom-center' | 'bottom-right'
      - mosaic: bool (tile watermark across entire page)
      - rotation: int (0, 45, 90, 180, 270)
      - fontFamily: 'Helvetica' | 'Times-Roman' | 'Courier'
      - isBold: bool
      - isItalic: bool
      - isUnderline: bool
      - color: str (hex '#000000')
      - fontSize: int (default 44)
      - fromPage: int (1-indexed)
      - toPage: int (1-indexed)
      - layer: 'over' | 'below' (default 'over')
    """
    options = options or {}
    wm_type = options.get("type", "text")
    wm_text = options.get("text", "CONFIDENTIAL")
    wm_image = options.get("image", "")
    opacity = float(options.get("opacity", 0.5))
    position = options.get("position", "middle-center")
    mosaic = bool(options.get("mosaic", False))
    rotation = int(options.get("rotation", 45 if position == "diagonal" else 0))
    layer = options.get("layer", "over")  # 'over' | 'below'

    # Font styling
    font_family = options.get("fontFamily", "Helvetica")
    is_bold = bool(options.get("isBold", True))
    is_italic = bool(options.get("isItalic", False))
    is_underline = bool(options.get("isUnderline", False))
    font_size = int(options.get("fontSize", 42))
    hex_color = options.get("color", "#4b5563").lstrip("#")

    try:
        r = int(hex_color[0:2], 16) / 255.0
        g = int(hex_color[2:4], 16) / 255.0
        b = int(hex_color[4:6], 16) / 255.0
    except Exception:
        r, g, b = 0.3, 0.3, 0.3

    # Pick ReportLab Font Name
    font_name = "Helvetica"
    if font_family == "Times-Roman":
        if is_bold and is_italic:
            font_name = "Times-BoldItalic"
        elif is_bold:
            font_name = "Times-Bold"
        elif is_italic:
            font_name = "Times-Italic"
        else:
            font_name = "Times-Roman"
    elif font_family == "Courier":
        if is_bold and is_italic:
            font_name = "Courier-BoldOblique"
        elif is_bold:
            font_name = "Courier-Bold"
        elif is_italic:
            font_name = "Courier-Oblique"
        else:
            font_name = "Courier"
    else:  # Helvetica
        if is_bold and is_italic:
            font_name = "Helvetica-BoldOblique"
        elif is_bold:
            font_name = "Helvetica-Bold"
        elif is_italic:
            font_name = "Helvetica-Oblique"
        else:
            font_name = "Helvetica"

    from_page = int(options.get("fromPage", 1))
    to_page = options.get("toPage")
    to_page = int(to_page) if to_page is not None else None

    # Load image if type == 'image'
    tmp_img_path = None
    img_w, img_h = 180, 180
    if wm_type == "image" and wm_image:
        try:
            if wm_image.startswith("data:image"):
                raw_bytes = base64.b64decode(wm_image.split(",", 1)[1])
            elif Path(wm_image).exists():
                raw_bytes = Path(wm_image).read_bytes()
            else:
                raw_bytes = base64.b64decode(wm_image)

            with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp_f:
                tmp_f.write(raw_bytes)
                tmp_img_path = tmp_f.name

            with Image.open(tmp_img_path) as im:
                orig_w, orig_h = im.size
                aspect = orig_w / max(orig_h, 1)
                if aspect >= 1:
                    img_w = 200
                    img_h = max(30, int(200 / aspect))
                else:
                    img_h = 200
                    img_w = max(30, int(200 * aspect))
        except Exception:
            tmp_img_path = None

    try:
        with pikepdf.open(input_path) as pdf:
            total_pages = len(pdf.pages)
            end_page = to_page if to_page is not None else total_pages

            for idx, page in enumerate(pdf.pages, start=1):
                if idx < from_page or idx > end_page:
                    continue

                media_box = page.mediabox
                pw = float(media_box[2] - media_box[0])
                ph = float(media_box[3] - media_box[1])

                packet = io.BytesIO()
                c = canvas.Canvas(packet, pagesize=(pw, ph))
                c.saveState()
                c.setFillAlpha(max(0.0, min(1.0, opacity)))

                # Helper to draw single watermark item (text or image) centered at (cx, cy) with angle
                def draw_item(cx: float, cy: float, angle: float):
                    c.saveState()
                    c.translate(cx, cy)
                    if angle != 0:
                        # ReportLab rotates CCW by default; CSS rotate() is CW. Invert angle to match visual preview!
                        c.rotate(-angle)

                    if wm_type == "image" and tmp_img_path:
                        c.drawImage(tmp_img_path, -img_w / 2, -img_h / 2, width=img_w, height=img_h, mask="auto")
                    else:
                        c.setFont(font_name, font_size)
                        c.setFillColorRGB(r, g, b)
                        tw = c.stringWidth(wm_text, font_name, font_size)
                        th = font_size * 0.75
                        c.drawString(-tw / 2, -th / 2, wm_text)
                        if is_underline:
                            c.setStrokeColorRGB(r, g, b)
                            c.setLineWidth(font_size / 20)
                            c.line(-tw / 2, -th / 2 - 3, tw / 2, -th / 2 - 3)

                    c.restoreState()

                if mosaic:
                    # Tile pattern across whole page (3 rows x 3 columns)
                    cols = 3
                    rows = 4
                    for c_idx in range(cols):
                        for r_idx in range(rows):
                            tile_x = (c_idx + 0.5) * (pw / cols)
                            tile_y = (r_idx + 0.5) * (ph / rows)
                            draw_item(tile_x, tile_y, rotation)
                else:
                    # 9-point grid mapping or diagonal
                    margin_x = 70.0
                    margin_y = 70.0
                    pos_map = {
                        "top-left": (margin_x, ph - margin_y),
                        "top-center": (pw / 2, ph - margin_y),
                        "top-right": (pw - margin_x, ph - margin_y),
                        "middle-left": (margin_x, ph / 2),
                        "middle-center": (pw / 2, ph / 2),
                        "middle-right": (pw - margin_x, ph / 2),
                        "bottom-left": (margin_x, margin_y),
                        "bottom-center": (pw / 2, margin_y),
                        "bottom-right": (pw - margin_x, margin_y),
                        "diagonal": (pw / 2, ph / 2),
                        "center": (pw / 2, ph / 2),
                        "top": (pw / 2, ph - margin_y),
                        "bottom": (pw / 2, margin_y),
                    }
                    target_x, target_y = pos_map.get(position, (pw / 2, ph / 2))
                    draw_item(target_x, target_y, rotation)

                c.restoreState()
                c.save()
                packet.seek(0)

                with pikepdf.open(packet) as overlay_pdf:
                    if layer == "below":
                        page.add_overlay(overlay_pdf.pages[0], push_to_back=True)
                    else:
                        page.add_overlay(overlay_pdf.pages[0])

            pdf.save(output_path)
    finally:
        if tmp_img_path:
            Path(tmp_img_path).unlink(missing_ok=True)

    return output_path

