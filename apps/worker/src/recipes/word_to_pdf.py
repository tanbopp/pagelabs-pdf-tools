import shutil
import subprocess
from pathlib import Path
import docx
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle


def find_soffice_binary() -> str | None:
    for cmd in ["soffice", "libreoffice"]:
        if shutil.which(cmd):
            return cmd
    return None


def convert_docx_fallback(input_path: Path, output_path: Path) -> None:
    """Fallback converter using python-docx and reportlab when LibreOffice is not installed."""
    try:
        doc = docx.Document(str(input_path))
    except Exception as e:
        raise ValueError("Failed to convert document: unreadable or corrupt file") from e

    pdf = SimpleDocTemplate(
        str(output_path),
        pagesize=letter,
        rightMargin=54,
        leftMargin=54,
        topMargin=54,
        bottomMargin=54,
    )
    styles = getSampleStyleSheet()
    story = []

    body_style = styles["Normal"]
    heading_style = styles["Heading1"]

    has_content = False
    for p in doc.paragraphs:
        text = p.text.strip()
        if not text:
            story.append(Spacer(1, 8))
            continue
        has_content = True
        style = heading_style if p.style.name.startswith("Heading") else body_style
        safe_text = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
        story.append(Paragraph(safe_text, style))
        story.append(Spacer(1, 6))

    if not has_content:
        story.append(Paragraph("[Empty Document]", body_style))

    pdf.build(story)


def word_to_pdf_recipe(
    input_path: Path,
    output_path: Path,
    options: dict = None
) -> Path:
    """
    Convert Word (.docx, .doc) to PDF using LibreOffice Headless.
    Fallback: python-docx & reportlab for .docx.
    """
    soffice = find_soffice_binary()
    converted_via_soffice = False

    if soffice:
        cmd = [
            soffice,
            "--headless",
            "--convert-to",
            "pdf",
            "--outdir",
            str(output_path.parent),
            str(input_path),
        ]
        try:
            res = subprocess.run(cmd, capture_output=True, timeout=120)
            expected_out = output_path.parent / f"{input_path.stem}.pdf"
            if res.returncode == 0 and expected_out.exists() and expected_out.stat().st_size > 0:
                if expected_out != output_path:
                    shutil.move(expected_out, output_path)
                converted_via_soffice = True
        except Exception:
            converted_via_soffice = False

    if not converted_via_soffice:
        ext = input_path.suffix.lower()
        if ext == ".docx":
            convert_docx_fallback(input_path, output_path)
        else:
            raise ValueError("Failed to convert document: LibreOffice required for legacy .doc conversion")

    return output_path
