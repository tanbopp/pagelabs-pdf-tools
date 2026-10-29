import sys
import json
import re
import sqlite3
import shutil
import tempfile
from pathlib import Path

from recipes.merge_pdf import merge_pdf_recipe, sanitize_filename
from recipes.split_pdf import split_pdf_recipe
from recipes.remove_pages import remove_pages_recipe
from recipes.extract_pages import extract_pages_recipe
from recipes.rotate_pdf import rotate_pdf_recipe
from recipes.organize_pdf import organize_pdf_recipe
from recipes.compress_pdf import compress_pdf_recipe
from recipes.repair_pdf import repair_pdf_recipe
from recipes.ocr_pdf import ocr_pdf_recipe
from recipes.pdf_to_pdfa import pdf_to_pdfa_recipe
from recipes.word_to_pdf import word_to_pdf_recipe
from recipes.excel_to_pdf import excel_to_pdf_recipe
from recipes.ppt_to_pdf import ppt_to_pdf_recipe
from recipes.jpg_to_pdf import jpg_to_pdf_recipe
from recipes.html_to_pdf import html_to_pdf_recipe
from recipes.pdf_to_word import pdf_to_word_recipe
from recipes.pdf_to_excel import pdf_to_excel_recipe
from recipes.pdf_to_ppt import pdf_to_ppt_recipe
from recipes.pdf_to_jpg import pdf_to_jpg_recipe
from recipes.protect_pdf import protect_pdf_recipe
from recipes.unlock_pdf import unlock_pdf_recipe
from recipes.sign_pdf import sign_pdf_recipe
from recipes.redact_pdf import redact_pdf_recipe
from recipes.scan_to_pdf import scan_to_pdf_recipe
from recipes.add_page_numbers import add_page_numbers_recipe
from recipes.add_watermark import add_watermark_recipe
from recipes.crop_pdf import crop_pdf_recipe
from recipes.pdf_forms import pdf_forms_recipe
from recipes.edit_pdf import edit_pdf_recipe
from recipes.compare_pdf import compare_pdf_recipe


def main():
    if len(sys.argv) < 2:
        sys.stderr.write(json.dumps({"error_code": "INVALID_INVOCATION", "error_message": "Missing job ID"}))
        sys.exit(1)

    job_id = sys.argv[1]

    db_path = Path(__file__).resolve().parent.parent.parent / "api" / "data" / "pagelabs.db"
    if not db_path.exists():
        sys.stderr.write(json.dumps({"error_code": "DB_NOT_FOUND", "error_message": "Database not found"}))
        sys.exit(1)

    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()
    cursor.execute("SELECT tool, files, options FROM jobs WHERE id = ?", (job_id,))
    row = cursor.fetchone()

    if not row:
        sys.stderr.write(json.dumps({"error_code": "JOB_NOT_FOUND", "error_message": f"Job {job_id} not found"}))
        sys.exit(1)

    tool, files_json, options_json = row
    files_list = json.loads(files_json)
    options = json.loads(options_json) if options_json else {}

    tmpdir = Path(tempfile.mkdtemp(prefix=f"pagelabs_{job_id}_"))

    try:
        api_storage_uploads = Path(__file__).resolve().parent.parent.parent / "api" / "storage" / "uploads"
        api_storage_results = Path(__file__).resolve().parent.parent.parent / "api" / "storage" / "results"
        api_storage_results.mkdir(parents=True, exist_ok=True)

        local_input_paths = []
        for file_info in files_list:
            url = file_info.get("url", "")
            file_id = url.split("/")[-1]
            source_file = api_storage_uploads / file_id

            if not source_file.exists():
                raise FileNotFoundError(f"Source file not found: {file_id}")

            # Prevent directory traversal attacks or malicious path patterns
            raw_input_name = file_info.get("name", file_id)
            safe_input_name = Path(raw_input_name).name
            safe_input_name = re.sub(r"[^\w\s.-]", "_", safe_input_name).strip() or file_id
            tmp_input = tmpdir / safe_input_name
            shutil.copy2(source_file, tmp_input)
            local_input_paths.append(tmp_input)

        raw_out_name = options.get("outputFilename", "result.pdf")
        # Sanitize filename while respecting original extension if provided
        base_name = Path(raw_out_name).name
        cleaned = re.sub(r"[^a-zA-Z0-9._-]", "", base_name) or "result.pdf"
        out_name = cleaned
        # If output is zip (e.g. for split or extract separate)
        is_zip = False

        if tool == "merge-pdf":
            tmp_output = tmpdir / out_name
            merge_pdf_recipe(local_input_paths, tmp_output, options)
        elif tool == "split-pdf":
            is_zip = True
            tmp_output = tmpdir / "split.zip"
            split_pdf_recipe(local_input_paths[0], tmp_output, options)
        elif tool == "remove-pages":
            tmp_output = tmpdir / out_name
            remove_pages_recipe(local_input_paths[0], tmp_output, options)
        elif tool == "extract-pages":
            if options.get("separateFiles"):
                is_zip = True
                tmp_output = tmpdir / "extracted.zip"
            else:
                tmp_output = tmpdir / out_name
            extract_pages_recipe(local_input_paths[0], tmp_output, options)
        elif tool == "rotate-pdf":
            tmp_output = tmpdir / out_name
            rotate_pdf_recipe(local_input_paths[0], tmp_output, options)
        elif tool == "organize-pdf":
            tmp_output = tmpdir / out_name
            organize_pdf_recipe(local_input_paths, tmp_output, options)
        elif tool == "compress-pdf":
            tmp_output = tmpdir / out_name
            compress_pdf_recipe(local_input_paths[0], tmp_output, options)
        elif tool == "repair-pdf":
            tmp_output = tmpdir / out_name
            repair_pdf_recipe(local_input_paths[0], tmp_output, options)
        elif tool == "ocr-pdf":
            tmp_output = tmpdir / out_name
            ocr_pdf_recipe(local_input_paths[0], tmp_output, options)
        elif tool == "pdf-to-pdfa":
            tmp_output = tmpdir / out_name
            pdf_to_pdfa_recipe(local_input_paths[0], tmp_output, options)
        elif tool == "word-to-pdf":
            tmp_output = tmpdir / out_name
            word_to_pdf_recipe(local_input_paths[0], tmp_output, options)
        elif tool == "excel-to-pdf":
            tmp_output = tmpdir / out_name
            excel_to_pdf_recipe(local_input_paths[0], tmp_output, options)
        elif tool == "powerpoint-to-pdf":
            tmp_output = tmpdir / out_name
            ppt_to_pdf_recipe(local_input_paths[0], tmp_output, options)
        elif tool == "jpg-to-pdf":
            tmp_output = tmpdir / out_name
            jpg_to_pdf_recipe(local_input_paths, tmp_output, options)
        elif tool == "html-to-pdf":
            tmp_output = tmpdir / out_name
            html_to_pdf_recipe(local_input_paths[0], tmp_output, options)
        elif tool == "pdf-to-word":
            tmp_output = tmpdir / out_name
            pdf_to_word_recipe(local_input_paths[0], tmp_output, options)
        elif tool == "pdf-to-excel":
            tmp_output = tmpdir / out_name
            pdf_to_excel_recipe(local_input_paths[0], tmp_output, options)
        elif tool == "pdf-to-powerpoint":
            tmp_output = tmpdir / out_name
            pdf_to_ppt_recipe(local_input_paths[0], tmp_output, options)
        elif tool == "pdf-to-jpg":
            tmp_output = tmpdir / out_name
            tmp_output = pdf_to_jpg_recipe(local_input_paths[0], tmp_output, options)
        elif tool == "protect-pdf":
            tmp_output = tmpdir / out_name
            protect_pdf_recipe(local_input_paths[0], tmp_output, options)
        elif tool == "unlock-pdf":
            tmp_output = tmpdir / out_name
            unlock_pdf_recipe(local_input_paths[0], tmp_output, options)
        elif tool == "sign-pdf":
            tmp_output = tmpdir / out_name
            sign_pdf_recipe(local_input_paths[0], tmp_output, options)
        elif tool == "redact-pdf":
            tmp_output = tmpdir / out_name
            redact_pdf_recipe(local_input_paths[0], tmp_output, options)
        elif tool == "scan-to-pdf":
            tmp_output = tmpdir / out_name
            scan_to_pdf_recipe(local_input_paths, tmp_output, options)
        elif tool == "add-page-numbers":
            tmp_output = tmpdir / out_name
            add_page_numbers_recipe(local_input_paths[0], tmp_output, options)
        elif tool == "add-watermark":
            tmp_output = tmpdir / out_name
            add_watermark_recipe(local_input_paths[0], tmp_output, options)
        elif tool == "crop-pdf":
            tmp_output = tmpdir / out_name
            crop_pdf_recipe(local_input_paths[0], tmp_output, options)
        elif tool == "pdf-forms":
            tmp_output = tmpdir / out_name
            pdf_forms_recipe(local_input_paths[0], tmp_output, options)
        elif tool == "edit-pdf":
            tmp_output = tmpdir / out_name
            edit_pdf_recipe(local_input_paths[0], tmp_output, options)
        elif tool == "compare-pdf":
            tmp_output = tmpdir / out_name
            compare_pdf_recipe(local_input_paths, tmp_output, options)
        else:
            raise ValueError(f"Unsupported tool: {tool}")

        final_result_filename = f"{job_id}_{tmp_output.name}"
        final_result_path = api_storage_results / final_result_filename
        shutil.copy2(tmp_output, final_result_path)

        result_size = final_result_path.stat().st_size

        output_data = {
            "result_url": str(final_result_path),
            "result_size": result_size,
        }
        print(json.dumps(output_data))
        sys.exit(0)

    except MemoryError:
        sys.stderr.write(json.dumps({
            "error_code": "OUT_OF_MEMORY",
            "error_message": "Process exceeded available memory. Please try with smaller files or fewer pages."
        }))
        sys.exit(1)
    except PermissionError as pe:
        sys.stderr.write(json.dumps({
            "error_code": "PASSWORD_PROTECTED",
            "error_message": str(pe)
        }))
        sys.exit(1)
    except Exception as e:
        sys.stderr.write(json.dumps({
            "error_code": "PROCESSING_FAILED",
            "error_message": str(e)
        }))
        sys.exit(1)
    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)


if __name__ == "__main__":
    main()
