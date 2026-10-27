from pathlib import Path
from typing import Set
import pikepdf
from recipes.split_pdf import parse_page_ranges


def rotate_pdf_recipe(
    input_path: Path,
    output_path: Path,
    options: dict
) -> Path:
    """
    Rotate PDF pages by specified angle (90, 180, 270).
    mode: 'all' or 'select' (e.g. pages: '1, 3')
    """
    mode = options.get("mode", "all")
    angle = int(options.get("angle", 90))
    src = pikepdf.open(input_path)
    total_pages = len(src.pages)

    if total_pages == 0:
        raise ValueError("PDF has no pages")

    pages_to_rotate: Set[int] = set()

    if mode == "all":
        pages_to_rotate = set(range(1, total_pages + 1))
    else:
        pages_str = options.get("pages", "")
        ranges = parse_page_ranges(pages_str, total_pages)
        for start, end in ranges:
            for p in range(start, end + 1):
                pages_to_rotate.add(p)

    for p_num in range(1, total_pages + 1):
        if p_num in pages_to_rotate:
            page = src.pages[p_num - 1]
            current_rot = int(page.get("/Rotate", 0))
            page.Rotate = (current_rot + angle) % 360

    src.save(str(output_path))
    return output_path
