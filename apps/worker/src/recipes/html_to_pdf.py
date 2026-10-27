from pathlib import Path
from playwright.sync_api import sync_playwright


def html_to_pdf_recipe(
    input_path: Path,
    output_path: Path,
    options: dict = None
) -> Path:
    """
    Convert HTML file (.html, .htm) to PDF using Playwright Chromium headless.
    Options:
      - pageSize: 'a4' | 'letter' (default 'a4')
    """
    options = options or {}
    page_size = options.get("pageSize", "a4").lower()
    format_name = "Letter" if page_size == "letter" else "A4"

    file_url = input_path.resolve().as_uri()

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        try:
            page = browser.new_page()
            # Navigate to the local HTML file
            page.goto(file_url, wait_until="networkidle")

            page.pdf(
                path=str(output_path),
                format=format_name,
                print_background=True,
                margin={"top": "0.4in", "bottom": "0.4in", "left": "0.4in", "right": "0.4in"},
            )
        finally:
            browser.close()

    return output_path
