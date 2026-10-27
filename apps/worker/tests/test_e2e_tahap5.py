import requests
import json
import time
from pathlib import Path
import pikepdf

API_BASE = "http://localhost:3001"

def create_sample_pdf(path: Path, num_pages: int = 1):
    pdf = pikepdf.new()
    for i in range(num_pages):
        pdf.add_blank_page(page_size=(300, 300))
        stream = f"BT /F1 12 Tf 50 {250 - i*20} Td (PageLabs E2E Tahap 5 Page {i+1}) Tj ET".encode("utf-8")
        pdf.pages[i]["/Contents"] = pdf.make_stream(stream)
    pdf.save(str(path))

def upload_file(file_path: Path, content_type: str = "application/pdf"):
    size = file_path.stat().st_size
    sign_res = requests.post(f"{API_BASE}/api/v1/uploads/sign", json={
        "filename": file_path.name,
        "size": size,
        "contentType": content_type
    })
    sign_res.raise_for_status()
    signed = sign_res.json()
    upload_url = signed["uploadUrl"]
    file_url = signed["fileUrl"]

    with open(file_path, "rb") as f:
        put_res = requests.put(upload_url, data=f, headers={"Content-Type": content_type})
        put_res.raise_for_status()

    return {"url": file_url, "name": file_path.name, "size": size}

def poll_job(job_id: str, max_wait=40):
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
    tmp = Path("apps/api/storage/uploads/e2e_tahap5_tmp")
    tmp.mkdir(parents=True, exist_ok=True)

    single_pdf = tmp / "sample_single.pdf"
    multi_pdf = tmp / "sample_multi.pdf"
    create_sample_pdf(single_pdf, num_pages=1)
    create_sample_pdf(multi_pdf, num_pages=3)

    # 1. PDF to Word
    print("Testing pdf-to-word...")
    up1 = upload_file(multi_pdf)
    j_res = requests.post(f"{API_BASE}/api/v1/jobs", json={
        "tool": "pdf-to-word",
        "files": [{"url": up1["url"], "name": up1["name"], "size": up1["size"]}],
        "options": {"ocr": False, "outputFilename": "extracted_doc.docx"}
    })
    j_res.raise_for_status()
    status_data = poll_job(j_res.json()["jobId"])
    assert status_data["status"] == "completed", f"PDF to Word failed: {status_data}"
    print("pdf-to-word PASSED! Result:", status_data["result_url"])

    # 2. PDF to Excel
    print("Testing pdf-to-excel...")
    up2 = upload_file(single_pdf)
    j_res = requests.post(f"{API_BASE}/api/v1/jobs", json={
        "tool": "pdf-to-excel",
        "files": [{"url": up2["url"], "name": up2["name"], "size": up2["size"]}],
        "options": {"outputFilename": "extracted_sheet.xlsx"}
    })
    j_res.raise_for_status()
    status_data = poll_job(j_res.json()["jobId"])
    assert status_data["status"] == "completed", f"PDF to Excel failed: {status_data}"
    print("pdf-to-excel PASSED! Result:", status_data["result_url"])

    # 3. PDF to PowerPoint
    print("Testing pdf-to-powerpoint...")
    up3 = upload_file(multi_pdf)
    j_res = requests.post(f"{API_BASE}/api/v1/jobs", json={
        "tool": "pdf-to-powerpoint",
        "files": [{"url": up3["url"], "name": up3["name"], "size": up3["size"]}],
        "options": {"outputFilename": "extracted_slides.pptx"}
    })
    j_res.raise_for_status()
    status_data = poll_job(j_res.json()["jobId"])
    assert status_data["status"] == "completed", f"PDF to PowerPoint failed: {status_data}"
    print("pdf-to-powerpoint PASSED! Result:", status_data["result_url"])

    # 4. PDF to JPG (Multi-page with ZIP output)
    print("Testing pdf-to-jpg...")
    up4 = upload_file(multi_pdf)
    j_res = requests.post(f"{API_BASE}/api/v1/jobs", json={
        "tool": "pdf-to-jpg",
        "files": [{"url": up4["url"], "name": up4["name"], "size": up4["size"]}],
        "options": {"dpi": 150, "format": "jpg", "outputFilename": "extracted_images.zip"}
    })
    j_res.raise_for_status()
    status_data = poll_job(j_res.json()["jobId"])
    assert status_data["status"] == "completed", f"PDF to JPG failed: {status_data}"

    # Verify download gives application/zip
    dl_res = requests.get(f"{API_BASE}{status_data['result_url']}")
    assert dl_res.status_code == 200, f"Download failed: {dl_res.status_code}"
    assert "zip" in dl_res.headers.get("Content-Type", ""), f"Expected ZIP content type: {dl_res.headers}"
    print("pdf-to-jpg PASSED! Result (ZIP):", status_data["result_url"], "Size:", len(dl_res.content))

    print("\nALL 4 TAHAP 5 E2E INTEGRATION CHECKS PASSED 100% GREEN!")

if __name__ == "__main__":
    run()
