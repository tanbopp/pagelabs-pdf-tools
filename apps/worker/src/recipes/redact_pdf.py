from pathlib import Path
import fitz  # PyMuPDF


def redact_pdf_recipe(
    input_path: Path,
    output_path: Path,
    options: dict = None
) -> Path:
    """
    Permanently black out and physically remove text from PDF.
    Options:
      - terms: str (comma-separated) or list[str] (required)
    """
    if options is None:
        options = {}

    terms_opt = options.get("terms", [])
    if isinstance(terms_opt, str):
        search_terms = [t.strip() for t in terms_opt.split(",") if t.strip()]
    elif isinstance(terms_opt, list):
        search_terms = [str(t).strip() for t in terms_opt if str(t).strip()]
    else:
        search_terms = []

    doc = fitz.open(str(input_path))

    for page in doc:
        for term in search_terms:
            if not term:
                continue
            # Search for occurrences of the term on this page
            rects = page.search_for(term)
            for rect in rects:
                # Add redact annotation: black fill (0, 0, 0)
                page.add_redact_annot(rect, fill=(0, 0, 0))

        # Physically remove text and vector data underlying the redact annotations
        page.apply_redactions()

    # Save scrubbed PDF without retaining deleted object streams
    doc.save(
        str(output_path),
        garbage=4,
        deflate=True,
        clean=True,
    )
    doc.close()

    return output_path
