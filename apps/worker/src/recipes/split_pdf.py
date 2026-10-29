import zipfile
import re
from pathlib import Path
from typing import List, Tuple
import pikepdf


def sanitize_filename(name: str) -> str:
    base = Path(name).name
    sanitized = re.sub(r"[^a-zA-Z0-9._-]", "", base)
    if not sanitized.lower().endswith(".pdf"):
        sanitized += ".pdf"
    if sanitized == ".pdf":
        sanitized = "page.pdf"
    return sanitized


def parse_page_ranges(range_str: str, max_pages: int) -> List[Tuple[int, int]]:
    if not range_str or not range_str.strip():
        raise ValueError("Page range cannot be empty")

    results = []
    parts = [p.strip() for p in range_str.split(",") if p.strip()]

    for part in parts:
        if "-" in part:
            sub = [s.strip() for s in part.split("-")]
            if len(sub) != 2:
                raise ValueError(f"Invalid range format: {part}")
            start, end = int(sub[0]), int(sub[1])
            if start > end or start < 1 or end > max_pages:
                raise ValueError(f"Range out of bounds (1-{max_pages}): {part}")
            results.append((start, end))
        else:
            val = int(part)
            if val < 1 or val > max_pages:
                raise ValueError(f"Page number out of bounds (1-{max_pages}): {val}")
            results.append((val, val))

    return results


def split_pdf_recipe(
    input_path: Path,
    output_path: Path,
    options: dict
) -> Path:
    """
    Split PDF according to mode:
    - visual: custom page order with custom output names [{ originalIndex, name, group }]
    - ranges: parse ranges (e.g. 1-3, 5) -> separate PDF per range in a ZIP
    - interval: every N pages -> separate PDF per chunk in a ZIP
    - all: fixed range 1 page each -> separate PDF per page in a ZIP
    Output is a ZIP file.
    """
    mode = options.get("mode", "visual")
    src = pikepdf.open(input_path)
    total_pages = len(src.pages)

    if total_pages == 0:
        raise ValueError("PDF has no pages")

    generated_pdfs: List[Tuple[str, Path]] = []
    tmp_dir = output_path.parent / "split_chunks"
    tmp_dir.mkdir(parents=True, exist_ok=True)

    if mode == "visual":
        # Visual interactive pages with custom names and groupings
        pages_spec = options.get("pages", [])
        if not pages_spec:
            # Fallback if empty: each single page
            pages_spec = [{"originalIndex": i, "name": f"page_{i+1}.pdf"} for i in range(total_pages)]

        for idx, item in enumerate(pages_spec, 1):
            orig_idx = int(item["originalIndex"])
            raw_name = item.get("name") or f"page_{orig_idx + 1}.pdf"
            clean_name = sanitize_filename(raw_name)

            if orig_idx < 0 or orig_idx >= total_pages:
                continue

            chunk = pikepdf.new()
            chunk.pages.append(src.pages[orig_idx])
            chunk_file = tmp_dir / f"{idx}_{clean_name}"
            chunk.save(str(chunk_file))
            generated_pdfs.append((clean_name, chunk_file))

    elif mode == "ranges":
        ranges_str = options.get("ranges", "")
        parsed = parse_page_ranges(ranges_str, total_pages)
        for idx, (start, end) in enumerate(parsed, 1):
            chunk = pikepdf.new()
            for p_num in range(start - 1, end):
                chunk.pages.append(src.pages[p_num])
            chunk_file = tmp_dir / f"part_{idx}_pages_{start}-{end}.pdf"
            chunk.save(str(chunk_file))
            generated_pdfs.append((chunk_file.name, chunk_file))

    elif mode == "interval":
        interval = int(options.get("interval", 1))
        if interval < 1:
            raise ValueError("Interval must be at least 1")
        part = 1
        for start_idx in range(0, total_pages, interval):
            end_idx = min(start_idx + interval, total_pages)
            chunk = pikepdf.new()
            for p_num in range(start_idx, end_idx):
                chunk.pages.append(src.pages[p_num])
            chunk_file = tmp_dir / f"part_{part}_pages_{start_idx + 1}-{end_idx}.pdf"
            chunk.save(str(chunk_file))
            generated_pdfs.append((chunk_file.name, chunk_file))
            part += 1

    elif mode == "size":
        max_size_kb = int(options.get("maxSizeKB", 500))
        max_size_bytes = max_size_kb * 1024
        
        part = 1
        chunk = pikepdf.new()
        chunk_start_page = 1
        current_pages = 0

        for p_idx in range(total_pages):
            chunk.pages.append(src.pages[p_idx])
            current_pages += 1
            
            # Save temporarily to inspect size
            test_file = tmp_dir / f"test_chunk.pdf"
            chunk.save(str(test_file))
            
            # If exceeding max size and chunk has more than 1 page, split previous pages
            if test_file.stat().st_size > max_size_bytes and current_pages > 1:
                # Rebuild chunk without the last page
                prev_chunk = pikepdf.new()
                for prev_idx in range(chunk_start_page - 1, p_idx):
                    prev_chunk.pages.append(src.pages[prev_idx])
                
                final_file = tmp_dir / f"part_{part}_pages_{chunk_start_page}-{p_idx}.pdf"
                prev_chunk.save(str(final_file))
                generated_pdfs.append((final_file.name, final_file))
                part += 1
                
                # Start new chunk with current page
                chunk = pikepdf.new()
                chunk.pages.append(src.pages[p_idx])
                chunk_start_page = p_idx + 1
                current_pages = 1

        # Save remaining chunk
        if current_pages > 0:
            final_file = tmp_dir / f"part_{part}_pages_{chunk_start_page}-{total_pages}.pdf"
            chunk.save(str(final_file))
            generated_pdfs.append((final_file.name, final_file))

    elif mode == "all":
        for p_idx in range(total_pages):
            chunk = pikepdf.new()
            chunk.pages.append(src.pages[p_idx])
            chunk_file = tmp_dir / f"page_{p_idx + 1}.pdf"
            chunk.save(str(chunk_file))
            generated_pdfs.append((chunk_file.name, chunk_file))
    else:
        raise ValueError(f"Unknown split mode: {mode}")

    # Pack into zip
    zip_dest = output_path
    if not str(zip_dest).endswith(".zip"):
        zip_dest = zip_dest.with_suffix(".zip")

    with zipfile.ZipFile(str(zip_dest), "w", zipfile.ZIP_DEFLATED) as zf:
        for arcname, fpath in generated_pdfs:
            zf.write(fpath, arcname=arcname)

    return zip_dest
