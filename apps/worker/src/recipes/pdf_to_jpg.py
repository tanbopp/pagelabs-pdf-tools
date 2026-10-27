import os
import shutil
import subprocess
import zipfile
from pathlib import Path
import fitz  # PyMuPDF


def find_gs_binary() -> str | None:
    for cmd in ["gs", "gswin64c", "gswin32c"]:
        if shutil.which(cmd):
            return cmd
    return None


def pdf_to_jpg_gs(input_path: Path, output_dir: Path, dpi: int, fmt: str) -> list[Path]:
    """Run Ghostscript to render pages to images."""
    gs = find_gs_binary()
    if not gs:
        return []

    device = "png16m" if fmt == "png" else "jpeg"
    ext = "png" if fmt == "png" else "jpg"
    pattern = output_dir / f"page_%03d.{ext}"

    cmd = [
        gs,
        "-dQUIET",
        "-dPARANOIDSAFER",
        "-dBATCH",
        "-dNOPAUSE",
        "-dNOPROMPT",
        f"-sDEVICE={device}",
        f"-r{dpi}",
        f"-sOutputFile={pattern}",
        str(input_path),
    ]

    res = subprocess.run(cmd, capture_output=True, timeout=180)
    if res.returncode == 0:
        return sorted(output_dir.glob(f"page_*.{ext}"))
    return []


def pdf_to_jpg_fitz(input_path: Path, output_dir: Path, dpi: int, fmt: str) -> list[Path]:
    """Fallback rendering PDF pages using PyMuPDF."""
    doc = fitz.open(str(input_path))
    generated_files = []
    ext = "png" if fmt == "png" else "jpg"

    for idx, page in enumerate(doc, start=1):
        pix = page.get_pixmap(dpi=dpi)
        out_file = output_dir / f"page_{idx:03d}.{ext}"
        pix.save(str(out_file))
        generated_files.append(out_file)

    return generated_files


def pdf_to_jpg_recipe(
    input_path: Path,
    output_path: Path,
    options: dict = None
) -> Path:
    """
    Convert PDF pages to JPG/PNG images using Ghostscript (with PyMuPDF fallback).
    Options:
      - dpi: int (72, 150, 300 - default: 150)
      - format: 'jpg' | 'jpeg' | 'png' (default: 'jpg')
    If multi-page (or requested), output as a ZIP file.
    If single-page and output_path ends with .jpg/.png, save directly as image.
    If output_path ends with .zip, always zip.
    """
    if options is None:
        options = {}

    dpi = int(options.get("dpi", 150))
    fmt = str(options.get("format", "jpg")).lower()
    if fmt == "jpeg":
        fmt = "jpg"

    temp_img_dir = output_path.parent / f"extracted_{input_path.stem}"
    temp_img_dir.mkdir(parents=True, exist_ok=True)

    try:
        images = pdf_to_jpg_gs(input_path, temp_img_dir, dpi, fmt)
        if not images:
            images = pdf_to_jpg_fitz(input_path, temp_img_dir, dpi, fmt)

        if not images:
            raise ValueError("No pages could be extracted from PDF")

        # Check whether output should be ZIP or single image
        is_zip_target = output_path.suffix.lower() == ".zip"
        is_multi_page = len(images) > 1

        if is_zip_target or is_multi_page:
            # Package into ZIP archive
            zip_target = output_path if is_zip_target else output_path.with_suffix(".zip")
            with zipfile.ZipFile(str(zip_target), "w", zipfile.ZIP_DEFLATED) as zf:
                for img in images:
                    zf.write(img, arcname=img.name)
            return zip_target
        else:
            # Single page direct image
            shutil.copy2(images[0], output_path)
            return output_path

    finally:
        shutil.rmtree(temp_img_dir, ignore_errors=True)
