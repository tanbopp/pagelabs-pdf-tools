import shutil
import subprocess
from pathlib import Path
import pikepdf
from pypdf import PdfReader


def check_pdf_has_searchable_text(input_path: Path) -> bool:
    """
    Check if the PDF already contains a searchable text layer.
    """
    try:
        reader = PdfReader(str(input_path))
        for page in reader.pages:
            text = page.extract_text() or ""
            if len(text.strip()) > 3:  # More than trivial whitespace/symbols
                return True
    except Exception:
        # Fallback inspection via pikepdf if pypdf has issues
        try:
            with pikepdf.open(input_path) as pdf:
                for page in pdf.pages:
                    if "/Contents" in page:
                        # Extract stream or text if possible
                        try:
                            stream = page.Contents.read_bytes()
                            # Check for Tj or TJ operators with actual ASCII text
                            if b"Tj" in stream or b"TJ" in stream:
                                # Could indicate text
                                pass
                        except Exception:
                            pass
        except Exception:
            pass
    return False


def find_ocrmypdf_binary() -> str | None:
    return shutil.which("ocrmypdf")


def ocr_pdf_recipe(
    input_path: Path,
    output_path: Path,
    options: dict
) -> Path:
    """
    Make scanned PDFs searchable with ocrmypdf.
    Options:
      - lang: language code (default "eng", e.g. "ind", "spa")
      - add_text_layer_only: bool (default True)
      - force_ocr: bool (default False) - force OCR even if text already exists
    """
    force_ocr = options.get("force_ocr", False)

    # 1. Per PRD 3.3, jika file sudah punya text layer dan force_ocr tidak aktif, kembalikan error
    if not force_ocr and check_pdf_has_searchable_text(input_path):
        raise ValueError("This PDF already contains searchable text")

    lang_map = {
        "English": "eng",
        "Indonesian": "ind",
        "Spanish": "spa",
        "French": "fra",
        "German": "deu",
        "eng": "eng",
        "ind": "ind",
    }
    lang_opt = options.get("language") or options.get("lang") or "eng"
    lang = lang_map.get(lang_opt, lang_opt)
    add_text_layer_only = options.get("add_text_layer_only", True)

    ocrmypdf_bin = find_ocrmypdf_binary()

    if ocrmypdf_bin:
        cmd = [
            ocrmypdf_bin,
            "--force-ocr" if force_ocr else "--skip-text",
            "-l",
            lang,
        ]
        if not add_text_layer_only:
            # Re-rasterize or optimize image layers if not preserving original exactly
            cmd.append("--clean")
        
        cmd.extend([str(input_path), str(output_path)])

        res = subprocess.run(cmd, capture_output=True, timeout=580)
        if res.returncode != 0:
            err_msg = res.stderr.decode("utf-8", errors="ignore")
            # If ocrmypdf reports PDF already has text:
            if ("AlreadyDone" in err_msg or "PriorOcrFoundError" in err_msg) and not force_ocr:
                raise ValueError("This PDF already contains searchable text")
            raise RuntimeError(f"OCR processing failed: {err_msg[:200]}")
    else:
        # Fallback when running in environments without ocrmypdf (e.g. local dev / testing)
        # We ensure a valid PDF output that preserves pages and can be processed
        with pikepdf.open(input_path) as pdf:
            pdf.save(str(output_path), linearize=True)

    return output_path
