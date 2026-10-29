from pathlib import Path
import fitz  # PyMuPDF


def edit_pdf_recipe(
    input_path: Path,
    output_path: Path,
    options: dict = None
) -> Path:
    """
    Apply annotations or edited changes to PDF pages using PyMuPDF.
    Options:
      - annotations: list of annotation objects:
        - type: 'text' | 'highlight' | 'rectangle' | 'circle' | 'draw'
        - page: int (1-indexed, default 1)
        - text: str (for text/freeText)
        - x, y, width, height: float
        - points: list of [x, y]
        - color: str (hex '#ff0000')
        - strokeWidth: float
        - fontSize: float
    """
    options = options or {}
    annotations = options.get("annotations", [])

    doc = fitz.open(str(input_path))

    for annot_data in annotations:
        try:
            page_num = int(annot_data.get("page", 1)) - 1
            if page_num < 0 or page_num >= len(doc):
                page_num = 0

            page = doc[page_num]
            annot_type = annot_data.get("type", "text")
            color_hex = annot_data.get("color", "#ff0000").lstrip("#")

            try:
                r = int(color_hex[0:2], 16) / 255.0
                g = int(color_hex[2:4], 16) / 255.0
                b = int(color_hex[4:6], 16) / 255.0
                color_tuple = (r, g, b)
            except Exception:
                color_tuple = (1.0, 0.0, 0.0)

            x = float(annot_data.get("x", 50))
            y = float(annot_data.get("y", 50))
            w = float(annot_data.get("width", 100))
            h = float(annot_data.get("height", 30))
            rect = fitz.Rect(x, y, x + w, y + h)

            if annot_type == "text":
                text_content = annot_data.get("text", "")
                font_size = float(annot_data.get("fontSize", 14))
                page.insert_text(
                    fitz.Point(x, y + font_size),
                    text_content,
                    fontsize=font_size,
                    color=color_tuple,
                )
            elif annot_type == "highlight":
                annot = page.add_highlight_annot(rect)
                annot.set_colors(stroke=color_tuple)
                annot.update()
            elif annot_type == "rectangle":
                stroke_width = float(annot_data.get("strokeWidth", 2))
                annot = page.add_rect_annot(rect)
                annot.set_colors(stroke=color_tuple)
                annot.set_border(width=stroke_width)
                annot.update()
            elif annot_type == "circle":
                stroke_width = float(annot_data.get("strokeWidth", 2))
                annot = page.add_circle_annot(rect)
                annot.set_colors(stroke=color_tuple)
                annot.set_border(width=stroke_width)
                annot.update()
            elif annot_type == "draw":
                points = annot_data.get("points", [])
                stroke_width = float(annot_data.get("strokeWidth", 2))
                if len(points) >= 2:
                    point_list = [fitz.Point(pt[0], pt[1]) for pt in points]
                    annot = page.add_polyline_annot(point_list)
                    annot.set_colors(stroke=color_tuple)
                    annot.set_border(width=stroke_width)
                    annot.update()
        except Exception:
            continue

    doc.save(str(output_path), garbage=3, deflate=True)
    doc.close()

    return output_path

