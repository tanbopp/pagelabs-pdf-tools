import os
import shutil
import subprocess
from pathlib import Path
import docx
import fitz  # PyMuPDF


def find_soffice_binary() -> str | None:
    for cmd in ["soffice", "libreoffice"]:
        if shutil.which(cmd):
            return cmd
    return None


def run_ocr_if_needed(input_path: Path, output_pdf: Path) -> Path:
    """Run ocrmypdf if OCR is requested."""
    try:
        import ocrmypdf
        ocrmypdf.ocr(
            input_file=str(input_path),
            output_file=str(output_pdf),
            language=["eng", "ind"],
            force_ocr=True,
            optimize=1,
            progress_bar=False,
        )
        return output_pdf
    except Exception as e:
        # If ocrmypdf CLI/module fails, log and fallback to input_path
        return input_path


def pdf_to_word_fallback(pdf_path: Path, output_docx: Path) -> None:
    """Fallback extraction to docx using pdf2docx or PyMuPDF + python-docx."""
    try:
        from pdf2docx import Converter
        cv = Converter(str(pdf_path))
        cv.convert(str(output_docx))
        cv.close()
        if output_docx.exists() and output_docx.stat().st_size > 0:
            return
    except Exception:
        pass

    # PyMuPDF fallback
    doc = fitz.open(str(pdf_path))
    docx_doc = docx.Document()
    has_text = False

    for page_idx, page in enumerate(doc):
        text = page.get_text().strip()
        if text:
            has_text = True
            for para in text.split("\n\n"):
                clean = para.strip()
                if clean:
                    docx_doc.add_paragraph(clean)
        else:
            docx_doc.add_paragraph(f"[Page {page_idx + 1}]")

        if page_idx < len(doc) - 1:
            docx_doc.add_page_break()

    if not has_text:
        docx_doc.add_paragraph("[Extracted Document]")

    docx_doc.save(str(output_docx))


def pdf_to_word_recipe(
    input_path: Path,
    output_path: Path,
    options: dict = None
) -> Path:
    """
    Extract PDF to Word DOCX.
    Options:
      - ocr: bool (default False)
    """
    if options is None:
        options = {}

    ocr_enabled = options.get("ocr", False)
    working_input = input_path

    if ocr_enabled:
        ocr_tmp = output_path.parent / f"ocr_{input_path.name}"
        working_input = run_ocr_if_needed(input_path, ocr_tmp)

    soffice = find_soffice_binary()
    converted_via_soffice = False

    if soffice:
        cmd = [
            soffice,
            "--headless",
            '--infilter="writer_pdf_import"',
            "--convert-to",
            "docx",
            "--outdir",
            str(output_path.parent),
            str(working_input),
        ]
        try:
            res = subprocess.run(cmd, capture_output=True, timeout=180)
            expected_out = output_path.parent / f"{working_input.stem}.docx"
            if res.returncode == 0 and expected_out.exists() and expected_out.stat().st_size > 0:
                if expected_out != output_path:
                    shutil.move(expected_out, output_path)
                converted_via_soffice = True
        except Exception:
            converted_via_soffice = False

    if not converted_via_soffice:
        pdf_to_word_fallback(working_input, output_path)

    if not output_path.exists() or output_path.stat().st_size == 0:
        raise ValueError("Failed to convert PDF to Word DOCX")

    return output_path
