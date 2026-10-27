import shutil
import subprocess
from pathlib import Path
import openpyxl
from reportlab.lib.pagesizes import letter, landscape
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors


def find_soffice_binary() -> str | None:
    for cmd in ["soffice", "libreoffice"]:
        if shutil.which(cmd):
            return cmd
    return None


def convert_xlsx_fallback(input_path: Path, output_path: Path, fit_to_page: bool = True) -> None:
    """Fallback converter using openpyxl and reportlab."""
    try:
        wb = openpyxl.load_workbook(str(input_path), data_only=True)
    except Exception as e:
        raise ValueError("Failed to convert document: unreadable or corrupt file") from e

    pagesize = landscape(letter) if fit_to_page else letter
    pdf = SimpleDocTemplate(
        str(output_path),
        pagesize=pagesize,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36,
    )
    styles = getSampleStyleSheet()
    story = []

    for sheetname in wb.sheetnames:
        ws = wb[sheetname]
        story.append(Paragraph(f"<b>Sheet: {sheetname}</b>", styles["Heading2"]))
        story.append(Spacer(1, 8))

        data = []
        for row in ws.iter_rows(values_only=True):
            if any(cell is not None for cell in row):
                row_str = [str(cell) if cell is not None else "" for cell in row]
                data.append(row_str)

        if data:
            # Clean column widths
            max_cols = max(len(r) for r in data)
            norm_data = [r + [""] * (max_cols - len(r)) for r in data]
            t = Table(norm_data, hAlign="LEFT")
            t.setStyle(
                TableStyle([
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f0f0f0")),
                    ("TEXTCOLOR", (0, 0), (-1, -1), colors.HexColor("#222222")),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cccccc")),
                    ("FONTSIZE", (0, 0), (-1, -1), 8),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                    ("TOPPADDING", (0, 0), (-1, -1), 3),
                ])
            )
            story.append(t)
            story.append(Spacer(1, 16))

    if not story:
        story.append(Paragraph("[Empty Spreadsheet]", styles["Normal"]))

    pdf.build(story)


def excel_to_pdf_recipe(
    input_path: Path,
    output_path: Path,
    options: dict = None
) -> Path:
    """
    Convert Excel (.xlsx, .xls) to PDF using LibreOffice Headless.
    Fallback: openpyxl & reportlab for .xlsx.
    """
    options = options or {}
    fit_to_page = options.get("fitToPage", True)
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
        if ext == ".xlsx":
            convert_xlsx_fallback(input_path, output_path, fit_to_page)
        else:
            raise ValueError("Failed to convert document: LibreOffice required for legacy .xls conversion")

    return output_path
