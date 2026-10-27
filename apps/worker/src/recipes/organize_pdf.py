from pathlib import Path
from typing import List, Dict, Any
import pikepdf


def organize_pdf_recipe(
    input_path: Path,
    output_path: Path,
    options: dict
) -> Path:
    """
    Reorder, rotate, or delete pages.
    options.pages: [{ originalIndex: 2, rotation: 90 }, { originalIndex: 0, rotation: 0 }]
    """
    pages_spec: List[Dict[str, Any]] = options.get("pages", [])
    if not pages_spec:
        raise ValueError("At least one page must remain")

    src = pikepdf.open(input_path)
    total_pages = len(src.pages)

    result_pdf = pikepdf.new()

    for item in pages_spec:
        orig_idx = int(item["originalIndex"])
        rot = int(item.get("rotation", 0))

        if orig_idx < 0 or orig_idx >= total_pages:
            raise ValueError(f"Page index {orig_idx} out of bounds (0-{total_pages - 1})")

        # Copy page to new PDF
        result_pdf.pages.append(src.pages[orig_idx])
        new_page = result_pdf.pages[-1]

        # Apply rotation
        current_rot = int(new_page.get("/Rotate", 0))
        new_page.Rotate = (current_rot + rot) % 360

    result_pdf.save(str(output_path))
    return output_path
