import requests
import json
import time
from pathlib import Path
import pikepdf

API_BASE = "http://localhost:3001"

def create_sample_pdf(path: Path):
    pdf = pikepdf.new()
    pdf.add_blank_page(page_size=(300, 300))
    stream = b"BT /F1 12 Tf 50 250 Td (PageLabs E2E Test PDF) Tj ET"
    pdf.pages[0]["/Contents"] = pdf.make_stream(stream)
    pdf.save(str(path))

def create_scanned_pdf(path: Path):
    pdf = pikepdf.new()
    pdf.add_blank_page(page_size=(200, 200))
    pdf.save(str(path))

def upload_file(file_path: Path):
    size = file_path.stat().st_size
    sign_res = requests.post(f"{API_BASE}/api/v1/uploads/sign", json={
        "filename": file_path.name,
        "size": size,
        "contentType": "application/pdf"
    })
    sign_res.raise_for_status()
    signed = sign_res.json()
    upload_url = signed["uploadUrl"]
    file_url = signed["fileUrl"]

    with open(file_path, "rb") as f:
        put_res = requests.put(upload_url, data=f, headers={"Content-Type": "application/pdf"})
        put_res.raise_for_status()

    return {"url": file_url, "name": file_path.name, "size": size}

def poll_job(job_id: str, max_wait=30):
    start = time.time()
    while time.time() - start < max_wait:
        res = requests.get(f"{API_BASE}/api/v1/jobs/{job_id}")
        res.raise_for_status()
        data = res.json()
        if data["status"] in ("completed", "failed"):
            return data
        time.sleep(1)
    raise TimeoutError(f"Job {job_id} timed out")

def run():
    tmp = Path("apps/api/storage/uploads/e2e_tmp")
    tmp.mkdir(parents=True, exist_ok=True)
    sample_pdf = tmp / "sample_text.pdf"
    scanned_pdf = tmp / "sample_scanned.pdf"
    create_sample_pdf(sample_pdf)
    create_scanned_pdf(scanned_pdf)

    # 1. Test Compress PDF
    print("Testing compress-pdf...")
    up1 = upload_file(sample_pdf)
    j_res = requests.post(f"{API_BASE}/api/v1/jobs", json={
        "tool": "compress-pdf",
        "files": [{"url": up1["url"], "name": up1["name"], "size": up1["size"]}],
        "options": {"level": "recommended", "outputFilename": "compressed_e2e.pdf"}
    })
    j_res.raise_for_status()
    job_id = j_res.json()["jobId"]
    status_data = poll_job(job_id)
    assert status_data["status"] == "completed", f"Compress failed: {status_data}"
    print("compress-pdf PASSED! Result:", status_data["result_url"])

    # 2. Test Repair PDF
    print("Testing repair-pdf...")
    up2 = upload_file(sample_pdf)
    j_res = requests.post(f"{API_BASE}/api/v1/jobs", json={
        "tool": "repair-pdf",
        "files": [{"url": up2["url"], "name": up2["name"], "size": up2["size"]}],
        "options": {"outputFilename": "repair_e2e.pdf"}
    })
    j_res.raise_for_status()
    status_data = poll_job(j_res.json()["jobId"])
    assert status_data["status"] == "completed", f"Repair failed: {status_data}"
    print("repair-pdf PASSED! Result:", status_data["result_url"])

    # 3. Test OCR PDF rejection on text-containing PDF
    print("Testing ocr-pdf text rejection...")
    up3 = upload_file(sample_pdf)
    j_res = requests.post(f"{API_BASE}/api/v1/jobs", json={
        "tool": "ocr-pdf",
        "files": [{"url": up3["url"], "name": up3["name"], "size": up3["size"]}],
        "options": {"language": "English", "outputFilename": "ocr_reject.pdf"}
    })
    j_res.raise_for_status()
    status_data = poll_job(j_res.json()["jobId"])
    assert status_data["status"] == "failed", f"OCR should fail on text PDF: {status_data}"
    assert "already contains searchable text" in status_data.get("error_message", "")
    print("ocr-pdf rejection PASSED! Error message as expected:", status_data["error_message"])

    # 4. Test OCR PDF on scanned PDF
    print("Testing ocr-pdf on scanned PDF...")
    up4 = upload_file(scanned_pdf)
    j_res = requests.post(f"{API_BASE}/api/v1/jobs", json={
        "tool": "ocr-pdf",
        "files": [{"url": up4["url"], "name": up4["name"], "size": up4["size"]}],
        "options": {"language": "English", "outputFilename": "ocr_success.pdf"}
    })
    j_res.raise_for_status()
    status_data = poll_job(j_res.json()["jobId"])
    assert status_data["status"] == "completed", f"OCR on scanned failed: {status_data}"
    print("ocr-pdf on scanned PDF PASSED! Result:", status_data["result_url"])

    # 5. Test PDF to PDF/A
    print("Testing pdf-to-pdfa...")
    up5 = upload_file(sample_pdf)
    j_res = requests.post(f"{API_BASE}/api/v1/jobs", json={
        "tool": "pdf-to-pdfa",
        "files": [{"url": up5["url"], "name": up5["name"], "size": up5["size"]}],
        "options": {"conformance": "PDF/A-2b", "outputFilename": "pdfa_e2e.pdf"}
    })
    j_res.raise_for_status()
    status_data = poll_job(j_res.json()["jobId"])
    assert status_data["status"] == "completed", f"PDF/A failed: {status_data}"
    print("pdf-to-pdfa PASSED! Result:", status_data["result_url"])

    print("\nALL 5 E2E INTEGRATION CHECKS PASSED 100% GREEN!")

if __name__ == "__main__":
    run()
