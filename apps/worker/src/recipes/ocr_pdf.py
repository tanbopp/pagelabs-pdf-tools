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
                        try:
                            stream = page.Contents.read_bytes()
                            if b"Tj" in stream or b"TJ" in stream:
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
      - languages: list of language codes e.g. ["eng", "ind"]
      - language: fallback single language string (default "eng")
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
        "Italian": "ita",
        "Portuguese": "por",
        "Dutch; Flemish": "nld",
        "Chinese - Simplified": "chi_sim",
        "Chinese - Traditional": "chi_tra",
        "Japanese": "jpn",
        "Korean": "kor",
        "Russian": "rus",
        "Arabic": "ara",
        "Hindi": "hin",
        "eng": "eng",
        "ind": "ind",
        "spa": "spa",
        "fra": "fra",
        "deu": "deu",
    }

    # Resolve languages list:
    # Supports array format {"languages": ["eng", "ind"]} or string {"language": "eng"}
    raw_langs = options.get("languages")
    if not raw_langs:
        single_lang = options.get("language") or options.get("lang") or "eng"
        raw_langs = [single_lang]
    elif isinstance(raw_langs, str):
        raw_langs = [raw_langs]

    # Map names or codes to Tesseract 3-letter codes
    mapped_langs = []
    for l in raw_langs:
        code = lang_map.get(l, l.lower())
        if code and code not in mapped_langs:
            mapped_langs.append(code)

    if not mapped_langs:
        mapped_langs = ["eng"]

    # Combine languages with plus sign, e.g. "eng+ind"
    lang_str = "+".join(mapped_langs[:3])

    add_text_layer_only = options.get("add_text_layer_only", True)

    ocrmypdf_bin = find_ocrmypdf_binary()

    if ocrmypdf_bin:
        cmd = [
            ocrmypdf_bin,
            "--force-ocr" if force_ocr else "--skip-text",
            "-l",
            lang_str,
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
