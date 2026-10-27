import shutil
import subprocess
from pathlib import Path
from typing import List
import fitz  # PyMuPDF
from PIL import Image, ImageChops


def compare_pdf_diff_tool(f1: Path, f2: Path, out_path: Path) -> bool:
    """Try executing diff-pdf CLI if present."""
    diff_bin = shutil.which("diff-pdf")
    if diff_bin:
        cmd = [diff_bin, "--output-diff=" + str(out_path), str(f1), str(f2)]
        try:
            res = subprocess.run(cmd, capture_output=True, timeout=60)
            # diff-pdf returns 0 if identical, 1 if differences, >1 on error
            if res.returncode == 1 and out_path.exists():
                return True
            elif res.returncode == 0:
                return False
        except Exception:
            pass
    return None


def compare_pdf_fallback(f1: Path, f2: Path, out_path: Path) -> bool:
    """Fallback visual diff engine using PyMuPDF and PIL."""
    doc1 = fitz.open(str(f1))
    doc2 = fitz.open(str(f2))

    max_pages = max(len(doc1), len(doc2))
    has_differences = False

    diff_pdf = fitz.open()

    for idx in range(max_pages):
        # Render pages
        if idx < len(doc1):
            pix1 = doc1[idx].get_pixmap(dpi=150)
            im1 = Image.frombytes("RGB", [pix1.width, pix1.height], pix1.samples)
        else:
            pix1 = None
            im1 = None

        if idx < len(doc2):
            pix2 = doc2[idx].get_pixmap(dpi=150)
            im2 = Image.frombytes("RGB", [pix2.width, pix2.height], pix2.samples)
        else:
            pix2 = None
            im2 = None

        if im1 is not None and im2 is not None:
            # Resize to matching dimensions if needed
            if im1.size != im2.size:
                im2 = im2.resize(im1.size)

            diff_img = ImageChops.difference(im1, im2)
            bbox = diff_img.getbbox()

            if bbox:
                has_differences = True
                # Generate visual comparison: blend original with red highlight on differences
                mask = diff_img.convert("L").point(lambda p: 255 if p > 15 else 0)
                highlight = Image.new("RGB", im1.size, (255, 0, 0))
                blended = Image.composite(highlight, im2, mask)

                page_bytes = io_save_img(blended)
                img_doc = fitz.open("pdf", fitz.open("png", page_bytes).convert_to_pdf())
                diff_pdf.insert_pdf(img_doc)
            else:
                # Identical page
                page_bytes = io_save_img(im1)
                img_doc = fitz.open("pdf", fitz.open("png", page_bytes).convert_to_pdf())
                diff_pdf.insert_pdf(img_doc)
        else:
            has_differences = True
            active_im = im1 or im2
            page_bytes = io_save_img(active_im)
            img_doc = fitz.open("pdf", fitz.open("png", page_bytes).convert_to_pdf())
            diff_pdf.insert_pdf(img_doc)

    doc1.close()
    doc2.close()

    if not has_differences:
        diff_pdf.close()
        return False

    diff_pdf.save(str(out_path))
    diff_pdf.close()
    return True


def io_save_img(im: Image.Image) -> bytes:
    import io
    buf = io.BytesIO()
    im.save(buf, format="PNG")
    return buf.getvalue()


def compare_pdf_recipe(
    input_paths: List[Path],
    output_path: Path,
    options: dict = None
) -> Path:
    """
    Compare two PDF files and generate a visual difference PDF.
    Expects 2 input files.
    """
    if len(input_paths) < 2:
        raise ValueError("Compare PDF requires exactly 2 PDF documents")

    f1 = input_paths[0]
    f2 = input_paths[1]

    # Try diff-pdf CLI
    cli_result = compare_pdf_diff_tool(f1, f2, output_path)
    if cli_result is True:
        return output_path
    elif cli_result is False:
        raise ValueError("No differences found between the documents")

    # Fallback visual diff
    diff_found = compare_pdf_fallback(f1, f2, output_path)
    if not diff_found:
        raise ValueError("No differences found between the documents")

    return output_path
