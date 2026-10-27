import tempfile
from pathlib import Path
from PIL import Image
import pikepdf
import pytest
import fitz
from pypdf import PdfWriter
from pypdf.generic import NameObject, DictionaryObject, ArrayObject, TextStringObject

from recipes.scan_to_pdf import scan_to_pdf_recipe
from recipes.add_page_numbers import add_page_numbers_recipe
from recipes.add_watermark import add_watermark_recipe
from recipes.crop_pdf import crop_pdf_recipe
from recipes.pdf_forms import pdf_forms_recipe
from recipes.compare_pdf import compare_pdf_recipe


def create_test_pdf(path: Path, text: str = "Test Page Content", num_pages: int = 1):
    pdf = pikepdf.new()
    for i in range(num_pages):
        pdf.add_blank_page(page_size=(300, 300))
        stream = f"BT /F1 12 Tf 50 {250 - i*20} Td ({text} {i+1}) Tj ET".encode("utf-8")
        pdf.pages[i]["/Contents"] = pdf.make_stream(stream)
    pdf.save(str(path))


def test_scan_to_pdf():
    with tempfile.TemporaryDirectory() as tmp:
        img_path = Path(tmp) / "photo.jpg"
        out_pdf = Path(tmp) / "scan.pdf"
        im = Image.new("RGB", (200, 200), (120, 150, 180))
        im.save(str(img_path))

        scan_to_pdf_recipe([img_path], out_pdf, {"autoDeskew": False})
        assert out_pdf.exists()
        assert out_pdf.stat().st_size > 0


def test_add_page_numbers():
    with tempfile.TemporaryDirectory() as tmp:
        in_pdf = Path(tmp) / "doc.pdf"
        out_pdf = Path(tmp) / "numbered.pdf"
        create_test_pdf(in_pdf, num_pages=3)

        add_page_numbers_recipe(in_pdf, out_pdf, {
            "position": "bottom-center",
            "startNumber": 1,
            "format": "Page 1"
        })
        assert out_pdf.exists()
        with pikepdf.open(str(out_pdf)) as pdf:
            assert len(pdf.pages) == 3


def test_add_watermark():
    with tempfile.TemporaryDirectory() as tmp:
        in_pdf = Path(tmp) / "doc.pdf"
        out_pdf = Path(tmp) / "watermarked.pdf"
        create_test_pdf(in_pdf, num_pages=2)

        add_watermark_recipe(in_pdf, out_pdf, {
            "type": "text",
            "text": "TOP SECRET",
            "opacity": 0.4,
            "position": "diagonal"
        })
        assert out_pdf.exists()
        assert out_pdf.stat().st_size > in_pdf.stat().st_size


def test_crop_pdf():
    with tempfile.TemporaryDirectory() as tmp:
        in_pdf = Path(tmp) / "doc.pdf"
        out_pdf = Path(tmp) / "cropped.pdf"
        create_test_pdf(in_pdf)

        crop_pdf_recipe(in_pdf, out_pdf, {
            "mode": "manual",
            "top": 20,
            "bottom": 20,
            "left": 20,
            "right": 20
        })
        assert out_pdf.exists()
        with pikepdf.open(str(out_pdf)) as pdf:
            cb = [float(v) for v in pdf.pages[0].CropBox]
            assert cb[0] == 20
            assert cb[1] == 20


def test_pdf_forms():
    with tempfile.TemporaryDirectory() as tmp:
        form_pdf = Path(tmp) / "form.pdf"
        out_pdf = Path(tmp) / "flattened.pdf"

        # Create a PDF with an interactive form widget
        doc = fitz.open()
        page = doc.new_page(width=300, height=300)
        widget = fitz.Widget()
        widget.rect = fitz.Rect(50, 50, 200, 80)
        widget.field_type = fitz.PDF_WIDGET_TYPE_TEXT
        widget.field_name = "UserFullName"
        widget.field_value = "Jane Doe"
        page.add_widget(widget)
        doc.save(str(form_pdf))
        doc.close()

        pdf_forms_recipe(form_pdf, out_pdf, {"flatten": True})
        assert out_pdf.exists()


def test_compare_pdf():
    with tempfile.TemporaryDirectory() as tmp:
        doc1 = Path(tmp) / "doc1.pdf"
        doc2 = Path(tmp) / "doc2.pdf"
        doc_same = Path(tmp) / "doc_same.pdf"
        diff_pdf = Path(tmp) / "diff.pdf"

        create_test_pdf(doc1, text="Version 1 Original Text")
        create_test_pdf(doc2, text="Version 2 Changed Text")
        create_test_pdf(doc_same, text="Version 1 Original Text")

        # Comparing differing files should succeed and output PDF
        res = compare_pdf_recipe([doc1, doc2], diff_pdf, {})
        assert res.exists()
        assert res.stat().st_size > 0

        # Comparing identical files should raise ValueError
        with pytest.raises(ValueError, match="No differences found"):
            compare_pdf_recipe([doc1, doc_same], diff_pdf, {})
