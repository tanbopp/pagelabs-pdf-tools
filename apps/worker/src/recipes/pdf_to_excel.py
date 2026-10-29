from pathlib import Path
from typing import Dict, Any, Union
import logging
import os

from pdf_tables_to_excel import convert_pdf_to_excel

logger = logging.getLogger(__name__)


def pdf_to_excel_recipe(
    input_path: Union[str, Path],
    output_path: Union[str, Path],
    options: Dict[str, Any] = None
) -> Path:
    """
    Convert PDF tables to nicely formatted Excel XLSX using pdf-tables-to-excel (Docling-based).
    - Preserves cell borders, header highlights, and proper columns.
    - Zero LibreOffice or Camelot fallback.
    - If conversion fails or no tables can be produced, raises a clear error.
    """
    input_str = os.path.abspath(str(input_path))
    output_str = os.path.abspath(str(output_path))
    output_p = Path(output_str)
    output_p.parent.mkdir(parents=True, exist_ok=True)

    logger.info(f"Converting PDF tables to formatted Excel via pdf-tables-to-excel: {input_str}")

    try:
        convert_pdf_to_excel(
            input_pdf=input_str,
            output_xlsx=output_str,
            profile="default",
            sheet_naming="by_page",
            include_empty=True,
        )

        if not output_p.exists() or output_p.stat().st_size == 0:
            raise RuntimeError("Generated Excel file is empty.")

        logger.info(f"Successfully generated styled Excel file at {output_str} ({output_p.stat().st_size} bytes)")
        return output_p
    except Exception as e:
        logger.error(f"pdf-tables-to-excel conversion failed: {str(e)}", exc_info=True)
        raise RuntimeError(f"Failed to extract formatted tables from PDF: {str(e)}")


# Alias backward compatibility
pdf_to_excel = pdf_to_excel_recipe
