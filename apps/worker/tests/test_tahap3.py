import pytest
from pathlib import Path
import pikepdf
from PIL import Image
import io

from recipes.compress_pdf import compress_pdf_recipe
from recipes.repair_pdf import repair_pdf_recipe
from recipes.ocr_pdf import ocr_pdf_recipe
from recipes.pdf_to_pdfa import pdf_to_pdfa_recipe


@pytest.fixture
def sample_pdf_with_text(tmp_path) -> Path:
    p = tmp_path / "with_text.pdf"
    pdf = pikepdf.new()
    pdf.add_blank_page(page_size=(300, 300))
    # Add text stream to page 0
    stream_content = b"BT /F1 12 Tf 50 250 Td (Hello Searchable World) Tj ET"
    pdf.pages[0]["/Contents"] = pdf.make_stream(stream_content)
    pdf.save(str(p))
    return p


@pytest.fixture
def sample_scanned_pdf(tmp_path) -> Path:
    p = tmp_path / "scanned.pdf"
    # Create an image-only PDF (no text stream)
    img = Image.new("RGB", (200, 200), color=(255, 255, 255))
    img_bytes = io.BytesIO()
    img.save(img_bytes, format="PNG")
    
    pdf = pikepdf.new()
    pdf.add_blank_page(page_size=(200, 200))
    # Save cleanly as blank/image without searchable text
    pdf.save(str(p))
    return p


@pytest.fixture
def damaged_pdf(tmp_path) -> Path:
    p = tmp_path / "corrupted.pdf"
    # Create valid PDF first
    pdf = pikepdf.new()
    pdf.add_blank_page()
    pdf.save(str(p))
    
    # Corrupt xref table pointer / syntax while keeping stream intact so it triggers recovery
    raw = p.read_bytes()
    corrupt = raw.replace(b"xref", b"xxxx")
    p.write_bytes(corrupt)
    return p


def test_compress_pdf(sample_pdf_with_text, tmp_path):
    out = tmp_path / "compressed.pdf"
    res = compress_pdf_recipe(sample_pdf_with_text, out, {"level": "recommended"})
    assert res.exists()
    assert res.stat().st_size > 0
    with pikepdf.open(res) as check:
        assert len(check.pages) == 1


def test_repair_pdf(damaged_pdf, tmp_path):
    out = tmp_path / "repaired.pdf"
    res = repair_pdf_recipe(damaged_pdf, out, {})
    assert res.exists()
    assert res.stat().st_size > 0
    with pikepdf.open(res) as check:
        assert len(check.pages) >= 1


def test_ocr_pdf_rejects_text(sample_pdf_with_text, tmp_path):
    out = tmp_path / "ocr_out.pdf"
    with pytest.raises(ValueError, match="already contains searchable text"):
        ocr_pdf_recipe(sample_pdf_with_text, out, {"language": "English"})


def test_ocr_pdf_scanned_success(sample_scanned_pdf, tmp_path):
    out = tmp_path / "ocr_out.pdf"
    res = ocr_pdf_recipe(sample_scanned_pdf, out, {"language": "English"})
    assert res.exists()
    with pikepdf.open(res) as check:
        assert len(check.pages) == 1


def test_pdf_to_pdfa(sample_pdf_with_text, tmp_path):
    out = tmp_path / "pdfa.pdf"
    res = pdf_to_pdfa_recipe(sample_pdf_with_text, out, {"conformance": "PDF/A-2b"})
    assert res.exists()
    with pikepdf.open(res) as check:
        assert len(check.pages) == 1
