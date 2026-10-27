import shutil
import subprocess
from pathlib import Path
import openpyxl
import fitz  # PyMuPDF


def find_soffice_binary() -> str | None:
    for cmd in ["soffice", "libreoffice"]:
        if shutil.which(cmd):
            return cmd
    return None


def pdf_to_excel_fallback(pdf_path: Path, output_xlsx: Path) -> None:
    """Fallback extracting text/tables from PDF to Excel using openpyxl & PyMuPDF."""
    doc = fitz.open(str(pdf_path))
    wb = openpyxl.Workbook()
    # Remove default sheet
    wb.remove(wb.active)

    for page_idx, page in enumerate(doc):
        ws = wb.create_sheet(title=f"Page {page_idx + 1}")
        # Try table extraction in PyMuPDF (fitz) if available
        tables = []
        try:
            tabs = page.find_tables()
            if tabs and len(tabs.tables) > 0:
                tables = [t.extract() for t in tabs.tables]
        except Exception:
            tables = []

        if tables:
            current_row = 1
            for tab in tables:
                for row_data in tab:
                    for col_idx, cell_value in enumerate(row_data, start=1):
                        ws.cell(row=current_row, column=col_idx, value=str(cell_value or ""))
                    current_row += 1
                current_row += 1
        else:
            # Fallback to lines of text
            text = page.get_text().strip()
            lines = text.split("\n")
            for r_idx, line in enumerate(lines, start=1):
                clean = line.strip()
                if not clean:
                    continue
                # If tab-delimited or multi-space, split
                parts = [p for p in clean.split("   ") if p]
                if len(parts) > 1:
                    for c_idx, part in enumerate(parts, start=1):
                        ws.cell(row=r_idx, column=c_idx, value=part.strip())
                else:
                    ws.cell(row=r_idx, column=1, value=clean)

    if not wb.sheetnames:
        ws = wb.create_sheet(title="Extracted")
        ws.cell(row=1, column=1, value="No tabular content detected")

    wb.save(str(output_xlsx))


def pdf_to_excel_recipe(
    input_path: Path,
    output_path: Path,
    options: dict = None
) -> Path:
    """
    Extract PDF tables / content to Excel XLSX using LibreOffice Headless.
    Fallback: PyMuPDF table extraction and openpyxl.
    """
    if options is None:
        options = {}

    soffice = find_soffice_binary()
    converted_via_soffice = False

    if soffice:
        cmd = [
            soffice,
            "--headless",
            "--convert-to",
            "xlsx",
            "--outdir",
            str(output_path.parent),
            str(input_path),
        ]
        try:
            res = subprocess.run(cmd, capture_output=True, timeout=180)
            expected_out = output_path.parent / f"{input_path.stem}.xlsx"
            if res.returncode == 0 and expected_out.exists() and expected_out.stat().st_size > 0:
                if expected_out != output_path:
                    shutil.move(expected_out, output_path)
                converted_via_soffice = True
        except Exception:
            converted_via_soffice = False

    if not converted_via_soffice:
        pdf_to_excel_fallback(input_path, output_path)

    if not output_path.exists() or output_path.stat().st_size == 0:
        raise ValueError("Failed to convert PDF to Excel XLSX")

    return output_path
