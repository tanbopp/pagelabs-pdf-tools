import tempfile
from pathlib import Path
import pikepdf
import pytest
import fitz
from recipes.protect_pdf import protect_pdf_recipe
from recipes.unlock_pdf import unlock_pdf_recipe
from recipes.sign_pdf import sign_pdf_recipe
from recipes.redact_pdf import redact_pdf_recipe


def create_test_pdf(path: Path, text: str = "Confidential Secret Document"):
    pdf = pikepdf.new()
    pdf.add_blank_page(page_size=(300, 300))
    stream = f"BT /F1 12 Tf 50 250 Td ({text}) Tj ET".encode("utf-8")
    pdf.pages[0]["/Contents"] = pdf.make_stream(stream)
    pdf.save(str(path))


def test_protect_and_unlock_pdf():
    with tempfile.TemporaryDirectory() as tmp:
        input_pdf = Path(tmp) / "plain.pdf"
        protected_pdf = Path(tmp) / "protected.pdf"
        unlocked_pdf = Path(tmp) / "unlocked.pdf"

        create_test_pdf(input_pdf)

        # 1. Protect
        protect_pdf_recipe(input_pdf, protected_pdf, {"password": "SecretPassword123"})
        assert protected_pdf.exists()

        # Verify password is required to open
        with pytest.raises(pikepdf.PasswordError):
            pikepdf.open(str(protected_pdf))

        # 2. Unlock with wrong password should fail
        with pytest.raises(PermissionError):
            unlock_pdf_recipe(protected_pdf, unlocked_pdf, {"password": "WrongPassword"})

        # 3. Unlock with correct password
        unlock_pdf_recipe(protected_pdf, unlocked_pdf, {"password": "SecretPassword123"})
        assert unlocked_pdf.exists()

        # Verify unlocked can be opened freely
        with pikepdf.open(str(unlocked_pdf)) as pdf:
            assert len(pdf.pages) == 1


def test_sign_pdf():
    with tempfile.TemporaryDirectory() as tmp:
        input_pdf = Path(tmp) / "doc.pdf"
        signed_pdf = Path(tmp) / "signed.pdf"
        create_test_pdf(input_pdf)

        sign_pdf_recipe(input_pdf, signed_pdf, {
            "nameText": "John Doe",
            "position": "bottom-right",
            "page": "last"
        })
        assert signed_pdf.exists()
        assert signed_pdf.stat().st_size > input_pdf.stat().st_size


def test_redact_pdf_physical_removal():
    with tempfile.TemporaryDirectory() as tmp:
        input_pdf = Path(tmp) / "doc_to_redact.pdf"
        redacted_pdf = Path(tmp) / "redacted.pdf"
        create_test_pdf(input_pdf, text="The secret passcode is Omega77")

        # Verify text exists in original
        doc_orig = fitz.open(str(input_pdf))
        orig_text = doc_orig[0].get_text()
        doc_orig.close()
        assert "Omega77" in orig_text

        # Redact "Omega77"
        redact_pdf_recipe(input_pdf, redacted_pdf, {"terms": "Omega77"})
        assert redacted_pdf.exists()

        # Verify text is physically scrubbed and CANNOT be extracted/copied
        doc_redacted = fitz.open(str(redacted_pdf))
        redacted_text = doc_redacted[0].get_text()
        doc_redacted.close()
        assert "Omega77" not in redacted_text
        assert "secret passcode is" in redacted_text
