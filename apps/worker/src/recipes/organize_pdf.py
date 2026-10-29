from pathlib import Path
from typing import List, Dict, Any, Union
import pikepdf


def organize_pdf_recipe(
    input_paths: Union[Path, List[Path]],
    output_path: Path,
    options: dict
) -> Path:
    """
    Reorder, rotate, delete pages, or insert blank pages across single or multiple PDFs.
    options.pages: [
      { fileIndex: 0, originalIndex: 2, rotation: 90 },
      { fileId: "blank", pageIndex: 0, rotation: 0 },
      { fileIndex: 1, originalIndex: 0, rotation: 0 }
    ]
    """
    pages_spec: List[Dict[str, Any]] = options.get("pages", [])
    if not pages_spec:
        raise ValueError("At least one page must remain")

    if isinstance(input_paths, Path):
        input_paths = [input_paths]

    # Open all source PDFs and keep references
    src_pdfs: List[pikepdf.Pdf] = []
    try:
        for p in input_paths:
            src_pdfs.append(pikepdf.open(p))

        result_pdf = pikepdf.new()

        for item in pages_spec:
            file_id = str(item.get("fileId", "")).lower()

            # 1. Blank page insertion
            if file_id == "blank":
                rot = int(item.get("rotation", 0))
                # Add A4 blank page (595.28 x 841.89 pt)
                new_blank = result_pdf.add_blank_page(page_size=(595.28, 841.89))
                if rot % 360 != 0:
                    new_blank.Rotate = rot % 360
                continue

            # 2. Page from an input PDF
            file_idx = int(item.get("fileIndex", 0))
            if file_idx < 0 or file_idx >= len(src_pdfs):
                # Fallback to 0 if within bounds
                file_idx = 0 if src_pdfs else -1

            if file_idx < 0 or file_idx >= len(src_pdfs):
                raise ValueError(f"Invalid fileIndex {file_idx}")

            src = src_pdfs[file_idx]
            orig_idx = int(item.get("originalIndex", item.get("pageIndex", 0)))
            rot = int(item.get("rotation", 0))

            if orig_idx < 0 or orig_idx >= len(src.pages):
                raise ValueError(f"Page index {orig_idx} out of bounds (0-{len(src.pages) - 1}) in file index {file_idx}")

            # Append page copy
            result_pdf.pages.append(src.pages[orig_idx])
            new_page = result_pdf.pages[-1]

            # Apply rotation
            current_rot = int(new_page.get("/Rotate", 0))
            new_page.Rotate = (current_rot + rot) % 360

        result_pdf.save(str(output_path))
        return output_path
    finally:
        for pdf in src_pdfs:
            try:
                pdf.close()
            except Exception:
                pass

