import pytest
from pathlib import Path
import pikepdf
import tempfile
import shutil
import zipfile
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "src"))
from recipes.split_pdf import split_pdf_recipe
from recipes.remove_pages import remove_pages_recipe
from recipes.extract_pages import extract_pages_recipe
from recipes.rotate_pdf import rotate_pdf_recipe
from recipes.organize_pdf import organize_pdf_recipe


@pytest.fixture
def temp_workspace():
    tmpdir = Path(tempfile.mkdtemp(prefix="test_tahap2_"))
    yield tmpdir
    shutil.rmtree(tmpdir, ignore_errors=True)


def create_sample_pdf(path: Path, pages: int = 5):
    pdf = pikepdf.new()
    for _ in range(pages):
        pdf.add_blank_page()
    pdf.save(str(path))


def test_split_pdf_ranges(temp_workspace):
    src = temp_workspace / "sample.pdf"
    out_zip = temp_workspace / "split.zip"
    create_sample_pdf(src, pages=5)

    split_pdf_recipe(src, out_zip, {"mode": "ranges", "ranges": "1-2, 3-5"})
    assert out_zip.exists()

    with zipfile.ZipFile(out_zip, "r") as zf:
        names = zf.namelist()
        assert len(names) == 2


def test_remove_pages_valid(temp_workspace):
    src = temp_workspace / "sample.pdf"
    out_pdf = temp_workspace / "removed.pdf"
    create_sample_pdf(src, pages=5)

    remove_pages_recipe(src, out_pdf, {"pages": "2, 4"})
    assert out_pdf.exists()

    with pikepdf.open(out_pdf) as pdf:
        assert len(pdf.pages) == 3


def test_remove_pages_all_rejected(temp_workspace):
    src = temp_workspace / "sample.pdf"
    out_pdf = temp_workspace / "removed.pdf"
    create_sample_pdf(src, pages=3)

    with pytest.raises(ValueError, match="Cannot remove all pages"):
        remove_pages_recipe(src, out_pdf, {"pages": "1-3"})


def test_extract_pages_single_pdf(temp_workspace):
    src = temp_workspace / "sample.pdf"
    out_pdf = temp_workspace / "extracted.pdf"
    create_sample_pdf(src, pages=5)

    extract_pages_recipe(src, out_pdf, {"pages": "1, 3, 5", "separateFiles": False})
    assert out_pdf.exists()

    with pikepdf.open(out_pdf) as pdf:
        assert len(pdf.pages) == 3


def test_rotate_pdf(temp_workspace):
    src = temp_workspace / "sample.pdf"
    out_pdf = temp_workspace / "rotated.pdf"
    create_sample_pdf(src, pages=2)

    rotate_pdf_recipe(src, out_pdf, {"mode": "all", "angle": 90})
    assert out_pdf.exists()

    with pikepdf.open(out_pdf) as pdf:
        assert int(pdf.pages[0].Rotate or 0) == 90
        assert int(pdf.pages[1].Rotate or 0) == 90


def test_organize_pdf(temp_workspace):
    src = temp_workspace / "sample.pdf"
    out_pdf = temp_workspace / "organized.pdf"
    create_sample_pdf(src, pages=3)

    # Reorder: page 2 first (rotated 180), then page 0 (rotation 0)
    organize_pdf_recipe(src, out_pdf, {
        "pages": [
            {"originalIndex": 2, "rotation": 180},
            {"originalIndex": 0, "rotation": 0}
        ]
    })
    assert out_pdf.exists()

    with pikepdf.open(out_pdf) as pdf:
        assert len(pdf.pages) == 2
        assert int(pdf.pages[0].Rotate or 0) == 180
        assert int(pdf.pages[1].Rotate or 0) == 0
