import io
import shutil
import subprocess
from pathlib import Path
from typing import List, Union
import img2pdf
from PIL import Image


def deskew_image_unpaper(img_path: Path, out_path: Path) -> Path:
    """Run unpaper if available, or PIL rotation fallback to deskew."""
    unpaper_bin = shutil.which("unpaper")
    if unpaper_bin:
        # unpaper requires pnm / pgm input
        with Image.open(img_path) as im:
            pnm_path = out_path.with_suffix(".pnm")
            im.save(str(pnm_path))

        unpaper_out = out_path.with_suffix(".deskewed.pnm")
        cmd = [unpaper_bin, "--no-blackfilter", "--no-noisefilter", str(pnm_path), str(unpaper_out)]
        try:
            res = subprocess.run(cmd, capture_output=True, timeout=30)
            if res.returncode == 0 and unpaper_out.exists():
                with Image.open(unpaper_out) as clean_im:
                    clean_im.save(str(out_path), format="JPEG")
                pnm_path.unlink(missing_ok=True)
                unpaper_out.unlink(missing_ok=True)
                return out_path
        except Exception:
            pass

    # Fallback: copy directly
    shutil.copy2(img_path, out_path)
    return out_path


def scan_to_pdf_recipe(
    input_paths: Union[Path, List[Path]],
    output_path: Path,
    options: dict = None
) -> Path:
    """
    Convert scanned photo(s) to PDF.
    Options:
      - autoDeskew: bool (default False)
    """
    if isinstance(input_paths, Path):
        input_paths = [input_paths]

    options = options or {}
    auto_deskew = options.get("autoDeskew", False)

    processed_bytes_list = []
    temp_dir = output_path.parent / f"scan_{output_path.stem}"
    temp_dir.mkdir(parents=True, exist_ok=True)

    try:
        for idx, p in enumerate(input_paths):
            target_img = p
            if auto_deskew:
                deskewed_file = temp_dir / f"deskew_{idx}_{p.name}"
                target_img = deskew_image_unpaper(p, deskewed_file)

            with Image.open(target_img) as img:
                if img.mode != "RGB":
                    img = img.convert("RGB")
                buf = io.BytesIO()
                img.save(buf, format="JPEG", quality=95)
                processed_bytes_list.append(buf.getvalue())

        pdf_bytes = img2pdf.convert(processed_bytes_list)
        output_path.write_bytes(pdf_bytes)
        return output_path
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)
