from pathlib import Path
import fitz  # PyMuPDF


def pdf_forms_recipe(
    input_path: Path,
    output_path: Path,
    options: dict = None
) -> Path:
    """
    Detect interactive form fields (widgets/annotations) and optionally flatten them.
    Options:
      - flatten: bool (default True)
    """
    options = options or {}
    should_flatten = bool(options.get("flatten", True))

    doc = fitz.open(str(input_path))

    # Detect form fields across all pages
    total_fields = 0
    for page in doc:
        for widget in page.widgets():
            total_fields += 1

    # Also check AcroForm or annotations if widgets() is empty
    if total_fields == 0:
        for page in doc:
            for annot in page.annots():
                # Check for Widget subtype (19) or interactive form
                if annot.type[0] == 19 or annot.info.get("name"):
                    total_fields += 1

    if total_fields == 0:
        doc.close()
        raise ValueError("No interactive form fields found in this PDF document")

    if should_flatten:
        # Bake/flatten interactive form widgets onto page content stream
        for page in doc:
            for widget in list(page.widgets()):
                widget.field_flags |= fitz.PDF_FIELD_IS_READ_ONLY
        # PyMuPDF flatten (bake annotations & form widgets)
        for page in doc:
            # Bake annotations into page stream
            page.apply_redactions()

    doc.save(str(output_path), garbage=3, deflate=True)
    doc.close()

    return output_path
