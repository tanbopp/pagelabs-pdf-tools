import zipfile
from pathlib import Path
from typing import List, Tuple
import pikepdf
from recipes.split_pdf import parse_page_ranges


def extract_pages_recipe(
    input_path: Path,
    output_path: Path,
    options: dict
) -> Path:
    """
    Extract specific pages (e.g. '1-3, 5').
    If separateFiles is True: output is ZIP containing individual PDF files.
    If separateFiles is False: output is single PDF with selected pages.
    """
    pages_str = options.get("pages", "")
    separate = options.get("separateFiles", False)

    src = pikepdf.open(input_path)
    total_pages = len(src.pages)

    if total_pages == 0:
        raise ValueError("PDF has no pages")

    ranges = parse_page_ranges(pages_str, total_pages)
    selected_pages: List[int] = []
    for start, end in ranges:
        for p in range(start, end + 1):
            selected_pages.append(p)

    if not selected_pages:
        raise ValueError("No pages specified to extract")

    if not separate:
        # Single output PDF
        result_pdf = pikepdf.new()
        for p_num in selected_pages:
            result_pdf.pages.append(src.pages[p_num - 1])
        result_pdf.save(str(output_path))
        return output_path
    else:
        # ZIP output with each page as separate PDF
        zip_dest = output_path
        if not str(zip_dest).endswith(".zip"):
            zip_dest = zip_dest.with_suffix(".zip")

        tmp_dir = output_path.parent / "extracted_chunks"
        tmp_dir.mkdir(parents=True, exist_ok=True)

        with zipfile.ZipFile(str(zip_dest), "w", zipfile.ZIP_DEFLATED) as zf:
            for idx, p_num in enumerate(selected_pages, 1):
                chunk = pikepdf.new()
                chunk.pages.append(src.pages[p_num - 1])
                chunk_file = tmp_dir / f"page_{p_num}.pdf"
                chunk.save(str(chunk_file))
                zf.write(chunk_file, arcname=chunk_file.name)

        return zip_dest
