from PIL import Image
import pillow_heif
import zipfile
import os
from pathlib import Path

# Register HEIF opener with Pillow
pillow_heif.register_heif_opener()

def heic_to_jpg_recipe(
    input_files: list[Path] | list[str],
    output_path: Path | str,
    options: dict | None = None
) -> Path:
    """
    Convert Apple HEIC/HEIF photos to JPG packaged into a ZIP archive.
    Options:
      - quality: 'high' (default 95), 'medium' (75), 'low' (50)
    """
    options = options or {}
    quality = options.get("quality", "high")
    quality_map = {"high": 95, "medium": 75, "low": 50}
    q_val = quality_map.get(quality, 95)

    output_zip_path = Path(output_path)
    output_dir = output_zip_path.parent
    output_dir.mkdir(parents=True, exist_ok=True)

    with zipfile.ZipFile(str(output_zip_path), "w", compression=zipfile.ZIP_DEFLATED) as zipf:
        for idx, input_file in enumerate(input_files):
            input_p = Path(input_file)
            try:
                img = Image.open(str(input_p))
                # If image contains transparency / alpha channel or paletted mode, convert to RGB for JPEG
                if img.mode in ("RGBA", "P", "LA"):
                    img = img.convert("RGB")
                elif img.mode != "RGB":
                    img = img.convert("RGB")

                # Derive clean output filename
                base_name = input_p.stem or f"image_{idx + 1}"
                output_filename = f"{base_name}.jpg"

                temp_out_path = output_dir / f"tmp_{idx}_{output_filename}"
                img.save(str(temp_out_path), "JPEG", quality=q_val)

                zipf.write(str(temp_out_path), arcname=output_filename)

                if temp_out_path.exists():
                    temp_out_path.unlink()
            except Exception as e:
                # Log error and continue to next file
                print(f"[WARN] Failed to convert {input_p.name}: {e}")

    return output_zip_path

# Alias for compatibility
heic_to_jpg = heic_to_jpg_recipe

