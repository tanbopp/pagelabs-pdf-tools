from pathlib import Path
from typing import Set
import pikepdf
from recipes.split_pdf import parse_page_ranges


def remove_pages_recipe(
    input_path: Path,
    output_path: Path,
    options: dict
) -> Path:
    """
    Remove specified pages (e.g. '1, 3, 5-7') from input PDF.
    Validation: If pages to remove >= total pages, raise ValueError("Cannot remove all pages").
    """
    pages_str = options.get("pages", "")
    src = pikepdf.open(input_path)
    total_pages = len(src.pages)

    if total_pages == 0:
        raise ValueError("PDF has no pages")

    ranges = parse_page_ranges(pages_str, total_pages)
    pages_to_remove: Set[int] = set()
    for start, end in ranges:
        for p in range(start, end + 1):
            pages_to_remove.add(p)

    if len(pages_to_remove) >= total_pages:
        raise ValueError("Cannot remove all pages")

    result_pdf = pikepdf.new()
    for p_num in range(1, total_pages + 1):
        if p_num not in pages_to_remove:
            result_pdf.pages.append(src.pages[p_num - 1])

    result_pdf.save(str(output_path))
    return output_path
