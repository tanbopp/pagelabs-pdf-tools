import tempfile
from pathlib import Path
import pikepdf
import pytest
from recipes.pdf_to_word import pdf_to_word_recipe
from recipes.pdf_to_excel import pdf_to_excel_recipe
from recipes.pdf_to_ppt import pdf_to_ppt_recipe
from recipes.pdf_to_jpg import pdf_to_jpg_recipe


def create_test_pdf(path: Path, num_pages: int = 1):
    pdf = pikepdf.new()
    for i in range(num_pages):
        pdf.add_blank_page(page_size=(300, 300))
        stream = f"BT /F1 12 Tf 50 {250 - i*20} Td (PageLabs Tahap 5 Test Page {i+1}) Tj ET".encode("utf-8")
        pdf.pages[i]["/Contents"] = pdf.make_stream(stream)
    pdf.save(str(path))


def test_pdf_to_word():
    with tempfile.TemporaryDirectory() as tmp:
        input_pdf = Path(tmp) / "input.pdf"
        output_docx = Path(tmp) / "output.docx"
        create_test_pdf(input_pdf, num_pages=2)

        res = pdf_to_word_recipe(input_pdf, output_docx, {"ocr": False})
        assert res.exists()
        assert res.stat().st_size > 0
        assert res.suffix.lower() == ".docx"


def test_pdf_to_excel():
    with tempfile.TemporaryDirectory() as tmp:
        input_pdf = Path(tmp) / "input.pdf"
        output_xlsx = Path(tmp) / "output.xlsx"
        create_test_pdf(input_pdf, num_pages=2)

        res = pdf_to_excel_recipe(input_pdf, output_xlsx, {})
        assert res.exists()
        assert res.stat().st_size > 0
        assert res.suffix.lower() == ".xlsx"


def test_pdf_to_ppt():
    with tempfile.TemporaryDirectory() as tmp:
        input_pdf = Path(tmp) / "input.pdf"
        output_pptx = Path(tmp) / "output.pptx"
        create_test_pdf(input_pdf, num_pages=2)

        res = pdf_to_ppt_recipe(input_pdf, output_pptx, {})
        assert res.exists()
        assert res.stat().st_size > 0
        assert res.suffix.lower() == ".pptx"


def test_pdf_to_jpg_single_page():
    with tempfile.TemporaryDirectory() as tmp:
        input_pdf = Path(tmp) / "single.pdf"
        output_jpg = Path(tmp) / "page.jpg"
        create_test_pdf(input_pdf, num_pages=1)

        res = pdf_to_jpg_recipe(input_pdf, output_jpg, {"dpi": 72, "format": "jpg"})
        assert res.exists()
        assert res.stat().st_size > 0


def test_pdf_to_jpg_multi_page_zip():
    with tempfile.TemporaryDirectory() as tmp:
        input_pdf = Path(tmp) / "multi.pdf"
        output_zip = Path(tmp) / "extracted.zip"
        create_test_pdf(input_pdf, num_pages=3)

        res = pdf_to_jpg_recipe(input_pdf, output_zip, {"dpi": 150, "format": "jpg"})
        assert res.exists()
        assert res.stat().st_size > 0
        assert res.suffix.lower() == ".zip"
