import pytest
from pathlib import Path
import pikepdf
import tempfile
import shutil
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "src"))
from recipes.merge_pdf import merge_pdf_recipe, sanitize_filename


@pytest.fixture
def temp_workspace():
    tmpdir = Path(tempfile.mkdtemp(prefix="test_pdf_"))
    yield tmpdir
    shutil.rmtree(tmpdir, ignore_errors=True)


def create_sample_pdf(path: Path, pages: int = 1):
    pdf = pikepdf.new()
    for _ in range(pages):
        pdf.add_blank_page()
    pdf.save(str(path))


def test_sanitize_filename():
    assert sanitize_filename("../etc/passwd") == "passwd.pdf"
    assert sanitize_filename("custom.PDF") == "custom.PDF"
    assert sanitize_filename("my-file_123") == "my-file_123.pdf"
    assert sanitize_filename("???!!!") == "merged.pdf"


def test_merge_two_valid_pdfs(temp_workspace):
    file1 = temp_workspace / "a.pdf"
    file2 = temp_workspace / "b.pdf"
    output = temp_workspace / "output.pdf"

    create_sample_pdf(file1, pages=2)
    create_sample_pdf(file2, pages=3)

    merge_pdf_recipe([file1, file2], output, {"outputFilename": "merged.pdf", "addBookmarks": True})

    assert output.exists()
    assert output.stat().st_size > 0

    with pikepdf.open(output) as merged:
        assert len(merged.pages) == 5
        with merged.open_outline() as outline:
            assert len(outline.root) == 2
            assert outline.root[0].title == "a"
            assert outline.root[1].title == "b"


def test_merge_corrupt_file_raises_error(temp_workspace):
    file1 = temp_workspace / "valid.pdf"
    file2 = temp_workspace / "corrupt.pdf"
    output = temp_workspace / "output.pdf"

    create_sample_pdf(file1, pages=1)
    file2.write_text("Not a pdf file content")

    with pytest.raises(ValueError):
        merge_pdf_recipe([file1, file2], output, {})
