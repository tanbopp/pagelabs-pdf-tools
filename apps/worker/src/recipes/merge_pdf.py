import os
import re
from pathlib import Path
from typing import List, Dict, Any
import pikepdf


def sanitize_filename(name: str) -> str:
    """
    Sanitize output filename: keep alphanumeric, dash, underscore, dot.
    Strip paths, ensure .pdf extension per PRD §5.5 & §7.2.
    """
    base = os.path.basename(name)
    sanitized = re.sub(r"[^a-zA-Z0-9._-]", "", base)
    if not sanitized.lower().endswith(".pdf"):
        sanitized += ".pdf"
    if sanitized == ".pdf":
        sanitized = "merged.pdf"
    return sanitized


def merge_pdf_recipe(
    input_paths: List[Path],
    output_path: Path,
    options: Dict[str, Any]
) -> Path:
    """
    Merge PDF files using pikepdf (wrapper around libqpdf).
    Implements PRD §5.5 with:
    - Input verification (checking corruption, password protection)
    - Bookmark injection per file if options['addBookmarks'] is True
    - Metadata setting (title=outputFilename, producer='PageLabs')
    - Output validation (page_count > 0, size > 0)
    """
    add_bookmarks = options.get("addBookmarks", False)
    output_filename = sanitize_filename(options.get("outputFilename", "merged.pdf"))

    merged = pikepdf.new()
    current_page_idx = 0

    for file_path in input_paths:
        try:
            # Check if file exists and has size
            if not file_path.exists() or file_path.stat().st_size == 0:
                raise ValueError("Corrupt or empty PDF file")

            with open(file_path, "rb") as f:
                header = f.read(5)
                if header != b"%PDF-":
                    raise ValueError("File is not a valid PDF")

            src_pdf = pikepdf.open(file_path)
        except pikepdf.PasswordError:
            raise PermissionError("One file is password-protected")
        except Exception as e:
            raise ValueError(f"Failed to open PDF: {str(e)}")

        file_page_count = len(src_pdf.pages)
        if file_page_count == 0:
            raise ValueError("PDF has no pages")

        # Append pages
        merged.pages.extend(src_pdf.pages)

        # Add bookmark per file if requested
        if add_bookmarks:
            clean_title = file_path.stem
            with merged.open_outline() as outline:
                outline.root.append(
                    pikepdf.OutlineItem(clean_title, current_page_idx)
                )

        current_page_idx += file_page_count

    # Set metadata per PRD §7.5
    with merged.open_metadata() as meta:
        meta["dc:title"] = output_filename
        meta["pdf:Producer"] = "PageLabs"

    # Save output
    merged.save(str(output_path))

    # Validate output per PRD §5.5
    if not output_path.exists() or output_path.stat().st_size == 0:
        raise RuntimeError("Generated output file is empty")

    verify_pdf = pikepdf.open(output_path)
    if len(verify_pdf.pages) != current_page_idx:
        raise RuntimeError("Output page count mismatch")

    return output_path
