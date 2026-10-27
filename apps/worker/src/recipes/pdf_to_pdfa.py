import shutil
import subprocess
from pathlib import Path
import pikepdf


def find_gs_binary() -> str | None:
    for cmd in ["gs", "gswin64c", "gswin32c"]:
        if shutil.which(cmd):
            return cmd
    return None


def pdf_to_pdfa_recipe(
    input_path: Path,
    output_path: Path,
    options: dict
) -> Path:
    """
    Convert PDF to PDF/A archival format:
    Options:
      - conformance: "PDF/A-2b" (default) or "PDF/A-3b"
    Uses Ghostscript with PDF/A device settings.
    Fallback: pikepdf XMP metadata embedding.
    """
    conformance = options.get("conformance", "PDF/A-2b")
    # PDF/A part number (2 or 3)
    pdfa_part = 3 if "3" in str(conformance) else 2
    pdfa_conf = "B"

    gs_bin = find_gs_binary()
    converted_via_gs = False

    if gs_bin:
        cmd = [
            gs_bin,
            f"-dPDFA={pdfa_part}",
            "-dBATCH",
            "-dNOPAUSE",
            "-sColorConversionStrategy=UseDeviceIndependentColor",
            "-sDEVICE=pdfwrite",
            "-dPDFACompatibilityPolicy=1",
            f"-sOutputFile={str(output_path)}",
            str(input_path),
        ]
        try:
            res = subprocess.run(cmd, capture_output=True, timeout=250)
            if res.returncode == 0 and output_path.exists() and output_path.stat().st_size > 0:
                with pikepdf.open(output_path) as verify:
                    if len(verify.pages) > 0:
                        converted_via_gs = True
        except Exception:
            converted_via_gs = False

    if not converted_via_gs:
        # Fallback using pikepdf to set PDF/A metadata & standard linearization
        with pikepdf.open(input_path) as pdf:
            # Inject PDF/A identification schema into XMP metadata
            try:
                with pdf.open_metadata(set_pikepdf_as_editor=False) as meta:
                    meta["pdfaid:part"] = str(pdfa_part)
                    meta["pdfaid:conformance"] = pdfa_conf
            except Exception:
                pass

            pdf.save(str(output_path), linearize=True)

    return output_path
