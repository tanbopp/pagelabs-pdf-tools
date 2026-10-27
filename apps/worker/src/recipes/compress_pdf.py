import io
import shutil
import subprocess
from pathlib import Path
import pikepdf
from PIL import Image


def find_gs_binary() -> str | None:
    for cmd in ["gs", "gswin64c", "gswin32c"]:
        if shutil.which(cmd):
            return cmd
    return None


def compress_images_pikepdf(pdf: pikepdf.Pdf, level: str) -> None:
    """
    Compress embedded images according to level:
      - 'less': high quality (JPEG quality ~75, max dimension 2400px)
      - 'recommended': balanced (JPEG quality ~50, max dimension 1600px)
      - 'extreme': maximum compression (JPEG quality ~25, max dimension 1000px)
    """
    params = {
        "less": {"quality": 75, "max_dim": 2400},
        "recommended": {"quality": 50, "max_dim": 1600},
        "extreme": {"quality": 25, "max_dim": 1000},
    }
    cfg = params.get(level, params["recommended"])
    quality = cfg["quality"]
    max_dim = cfg["max_dim"]

    seen_objects = set()

    for page in pdf.pages:
        if "/Resources" not in page or "/XObject" not in page.Resources:
            continue

        xobjects = page.Resources.XObject
        for name in list(xobjects.keys()):
            stream = xobjects[name]
            if getattr(stream, "Subtype", None) != pikepdf.Name("/Image"):
                continue

            obj_id = stream.objgen
            if obj_id in seen_objects:
                continue
            seen_objects.add(obj_id)

            try:
                raw_img = pikepdf.PdfImage(stream)
                pil_img = raw_img.as_pil_image()
                w, h = pil_img.size

                # Only resize if larger than max_dim
                scale = min(1.0, max_dim / max(w, h))
                if scale < 1.0:
                    new_w = max(1, int(w * scale))
                    new_h = max(1, int(h * scale))
                    pil_img = pil_img.resize((new_w, new_h), Image.Resampling.LANCZOS)

                # Ensure image format suitable for JPEG compression
                if pil_img.mode in ("RGBA", "LA") or (pil_img.mode == "P" and "transparency" in pil_img.info):
                    # Keep transparency if any or convert with white background
                    bg = Image.new("RGB", pil_img.size, (255, 255, 255))
                    if pil_img.mode == "P":
                        pil_img = pil_img.convert("RGBA")
                    bg.paste(pil_img, mask=pil_img.split()[-1] if "A" in pil_img.mode else None)
                    pil_img = bg
                elif pil_img.mode not in ("RGB", "L"):
                    pil_img = pil_img.convert("RGB")

                buf = io.BytesIO()
                pil_img.save(buf, format="JPEG", quality=quality, optimize=True)
                new_bytes = buf.getvalue()

                # Replace image stream if new compressed version is smaller
                orig_len = len(stream.read_raw_bytes())
                if len(new_bytes) < orig_len:
                    stream.write(new_bytes, filter=pikepdf.Name("/DCTDecode"))
                    stream.Width = pil_img.width
                    stream.Height = pil_img.height
                    stream.ColorSpace = (
                        pikepdf.Name("/DeviceRGB")
                        if pil_img.mode == "RGB"
                        else pikepdf.Name("/DeviceGray")
                    )
                    stream.BitsPerComponent = 8
                    if "/DecodeParms" in stream:
                        del stream["/DecodeParms"]
            except Exception:
                # If an image cannot be parsed or converted, leave it untouched
                pass


def compress_pdf_recipe(
    input_path: Path,
    output_path: Path,
    options: dict
) -> Path:
    """
    Compress PDF:
    level:
      - 'less': /prepress (high quality)
      - 'recommended': /ebook (balanced, default)
      - 'extreme': /screen (maximum compression)
    """
    level = options.get("level", "recommended")
    gs_bin = find_gs_binary()

    settings_map = {
        "less": "/prepress",
        "recommended": "/ebook",
        "extreme": "/screen",
    }
    pdf_settings = settings_map.get(level, "/ebook")

    compressed_via_gs = False

    if gs_bin:
        cmd = [
            gs_bin,
            "-sDEVICE=pdfwrite",
            "-dCompatibilityLevel=1.7",
            f"-dPDFSETTINGS={pdf_settings}",
            "-dNOPAUSE",
            "-dQUIET",
            "-dBATCH",
            f"-sOutputFile={str(output_path)}",
            str(input_path),
        ]
        try:
            res = subprocess.run(cmd, capture_output=True, timeout=250)
            if res.returncode == 0 and output_path.exists() and output_path.stat().st_size > 0:
                with pikepdf.open(output_path) as verify:
                    if len(verify.pages) > 0:
                        compressed_via_gs = True
        except Exception:
            compressed_via_gs = False

    # If GS is not available or produced no real reduction, use intelligent PIL/pikepdf compression
    if not compressed_via_gs:
        with pikepdf.open(input_path) as pdf:
            compress_images_pikepdf(pdf, level)
            pdf.save(
                str(output_path),
                linearize=True,
                compress_streams=True,
                object_stream_mode=pikepdf.ObjectStreamMode.generate,
            )

    return output_path
