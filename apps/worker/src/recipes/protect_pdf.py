from pathlib import Path
import pikepdf


def protect_pdf_recipe(
    input_path: Path,
    output_path: Path,
    options: dict = None
) -> Path:
    """
    Encrypt PDF with AES-256 (R=6) password.
    Options:
      - password: str (required)
      - allowPrinting: bool (default False)
      - allowCopying: bool (default False)
    """
    if options is None:
        options = {}

    password = options.get("password")
    if not password:
        raise ValueError("Password is required to protect PDF")

    allow_printing = bool(options.get("allowPrinting", False))
    allow_copying = bool(options.get("allowCopying", False))

    # Configure pikepdf permissions
    # If not allowed, restrict printing and extraction (copying)
    permissions = pikepdf.Permissions(
        accessibility=True,
        extract=allow_copying,
        print_lowres=allow_printing,
        print_highres=allow_printing,
        modify_annotation=False,
        modify_assembly=False,
        modify_form=False,
        modify_other=False,
    )

    encryption = pikepdf.Encryption(
        user=password,
        owner=password,
        allow=permissions,
        R=6,  # AES-256
    )

    with pikepdf.open(input_path) as pdf:
        pdf.save(output_path, encryption=encryption)

    return output_path
