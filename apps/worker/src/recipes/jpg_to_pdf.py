import io
from pathlib import Path
from typing import List, Union
import img2pdf
from PIL import Image


def jpg_to_pdf_recipe(
    input_paths: Union[Path, List[Path]],
    output_path: Path,
    options: dict = None
) -> Path:
    """
    Convert image(s) (.jpg, .jpeg, .png, .webp) to PDF using img2pdf.
    Options:
      - orientation: 'portrait' | 'landscape' (default 'portrait')
      - pageSize: 'a4' | 'letter' | 'fit' (default 'a4')
      - margin: 'none' | 'small' | 'big' (default 'none')
    """
    if isinstance(input_paths, Path):
        input_paths = [input_paths]

    options = options or {}
    orientation = options.get("orientation", "portrait")
    page_size_opt = options.get("pageSize", "a4")
    margin_opt = options.get("margin", "none")

    # Margins in pt (72 pt = 1 inch)
    margins = {
        "none": 0,
        "small": 18,  # 0.25 inch
        "big": 36,    # 0.5 inch
    }
    border = margins.get(margin_opt, 0)

    # Standard paper sizes (Width x Height in pt)
    # A4: 595.28 x 841.89 pt, Letter: 612 x 792 pt
    sizes = {
        "a4": (img2pdf.mm_to_pt(210), img2pdf.mm_to_pt(297)),
        "letter": (img2pdf.in_to_pt(8.5), img2pdf.in_to_pt(11)),
    }

    # Normalize images (ensure RGB for JPEG transcoding if needed)
    converted_bytes_list = []
    for p in input_paths:
        with Image.open(p) as img:
            # If RGBA or Palette with transparency, blend with white background
            if img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info):
                bg = Image.new("RGB", img.size, (255, 255, 255))
                if img.mode == "P":
                    img = img.convert("RGBA")
                bg.paste(img, mask=img.split()[-1] if "A" in img.mode else None)
                buf = io.BytesIO()
                bg.save(buf, format="JPEG", quality=95)
                converted_bytes_list.append(buf.getvalue())
            elif p.suffix.lower() in (".jpg", ".jpeg"):
                # Read original bytes directly for 100% lossless transcoding
                converted_bytes_list.append(p.read_bytes())
            else:
                buf = io.BytesIO()
                if img.mode != "RGB":
                    img = img.convert("RGB")
                img.save(buf, format="JPEG", quality=95)
                converted_bytes_list.append(buf.getvalue())

    # Calculate layout
    layout_fun = None
    border_tuple = (border, border) if border > 0 else None

    if page_size_opt in sizes:
        pw, ph = sizes[page_size_opt]
        if orientation == "landscape":
            pw, ph = max(pw, ph), min(pw, ph)
        else:
            pw, ph = min(pw, ph), max(pw, ph)

        layout_fun = img2pdf.get_layout_fun(
            pagesize=(pw, ph),
            fit=img2pdf.FitMode.into,
            border=border_tuple,
        )
    elif border_tuple:
        layout_fun = img2pdf.get_layout_fun(border=border_tuple)

    kwargs = {}
    if layout_fun:
        kwargs["layout_fun"] = layout_fun

    pdf_bytes = img2pdf.convert(converted_bytes_list, **kwargs)
    output_path.write_bytes(pdf_bytes)

    return output_path
