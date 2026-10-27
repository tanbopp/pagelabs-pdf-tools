from pathlib import Path
import pikepdf


def unlock_pdf_recipe(
    input_path: Path,
    output_path: Path,
    options: dict = None
) -> Path:
    """
    Remove password protection from PDF.
    Options:
      - password: str (required)
    """
    if options is None:
        options = {}

    password = options.get("password")
    if not password:
        raise ValueError("Password is required to unlock PDF")

    try:
        with pikepdf.open(input_path, password=password) as pdf:
            # Save without encryption
            pdf.save(output_path)
    except pikepdf.PasswordError:
        raise PermissionError("Incorrect password for PDF")
    except Exception as e:
        if "password" in str(e).lower():
            raise PermissionError("Incorrect password for PDF")
        raise ValueError(f"Failed to unlock PDF: {str(e)}")

    return output_path
