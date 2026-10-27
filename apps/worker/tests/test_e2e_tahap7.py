import requests
import json
import time
from pathlib import Path
from PIL import Image
import pikepdf
import fitz

API_BASE = "http://localhost:3001"

def create_sample_pdf(path: Path, text: str = "Test Content", num_pages: int = 1):
    pdf = pikepdf.new()
    for i in range(num_pages):
        pdf.add_blank_page(page_size=(300, 300))
        stream = f"BT /F1 12 Tf 50 {250 - i*20} Td ({text} Page {i+1}) Tj ET".encode("utf-8")
        pdf.pages[i]["/Contents"] = pdf.make_stream(stream)
    pdf.save(str(path))

def create_sample_form_pdf(path: Path):
    doc = fitz.open()
    page = doc.new_page(width=300, height=300)
    widget = fitz.Widget()
    widget.rect = fitz.Rect(50, 50, 200, 80)
    widget.field_type = fitz.PDF_WIDGET_TYPE_TEXT
    widget.field_name = "UserFullName"
    widget.field_value = "Jane Doe"
    page.add_widget(widget)
    doc.save(str(path))
    doc.close()

def create_sample_image(path: Path):
    im = Image.new("RGB", (300, 300), (90, 140, 200))
    im.save(str(path), format="JPEG")

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
    tmp = Path("apps/api/storage/uploads/e2e_tahap7_tmp")
    tmp.mkdir(parents=True, exist_ok=True)

    sample_pdf = tmp / "sample_doc.pdf"
    sample_form_pdf = tmp / "sample_form.pdf"
    sample_diff1_pdf = tmp / "sample_v1.pdf"
    sample_diff2_pdf = tmp / "sample_v2.pdf"
    sample_img = tmp / "photo.jpg"

    create_sample_pdf(sample_pdf, text="PageLabs Doc", num_pages=2)
    create_sample_form_pdf(sample_form_pdf)
    create_sample_pdf(sample_diff1_pdf, text="Original Version A", num_pages=1)
    create_sample_pdf(sample_diff2_pdf, text="Updated Version B", num_pages=1)
    create_sample_image(sample_img)

    # 1. Scan to PDF
    print("Testing scan-to-pdf...")
    up_img = upload_file(sample_img, content_type="image/jpeg")
    j_res = requests.post(f"{API_BASE}/api/v1/jobs", json={
        "tool": "scan-to-pdf",
        "files": [{"url": up_img["url"], "name": up_img["name"], "size": up_img["size"]}],
        "options": {"autoDeskew": False, "outputFilename": "scan_e2e.pdf"}
    })
    j_res.raise_for_status()
    status_data = poll_job(j_res.json()["jobId"])
    assert status_data["status"] == "completed", f"Scan to PDF failed: {status_data}"
    print("scan-to-pdf PASSED! Result:", status_data["result_url"])

    # 2. Add Page Numbers
    print("Testing add-page-numbers...")
    up1 = upload_file(sample_pdf)
    j_res = requests.post(f"{API_BASE}/api/v1/jobs", json={
        "tool": "add-page-numbers",
        "files": [{"url": up1["url"], "name": up1["name"], "size": up1["size"]}],
        "options": {"position": "bottom-center", "startNumber": 1, "format": "Page 1", "outputFilename": "numbered_e2e.pdf"}
    })
    j_res.raise_for_status()
    status_data = poll_job(j_res.json()["jobId"])
    assert status_data["status"] == "completed", f"Add Page Numbers failed: {status_data}"
    print("add-page-numbers PASSED! Result:", status_data["result_url"])

    # 3. Add Watermark
    print("Testing add-watermark...")
    up2 = upload_file(sample_pdf)
    j_res = requests.post(f"{API_BASE}/api/v1/jobs", json={
        "tool": "add-watermark",
        "files": [{"url": up2["url"], "name": up2["name"], "size": up2["size"]}],
        "options": {"type": "text", "text": "CONFIDENTIAL", "opacity": 0.5, "position": "diagonal", "outputFilename": "wm_e2e.pdf"}
    })
    j_res.raise_for_status()
    status_data = poll_job(j_res.json()["jobId"])
    assert status_data["status"] == "completed", f"Watermark failed: {status_data}"
    print("add-watermark PASSED! Result:", status_data["result_url"])

    # 4. Crop PDF
    print("Testing crop-pdf...")
    up3 = upload_file(sample_pdf)
    j_res = requests.post(f"{API_BASE}/api/v1/jobs", json={
        "tool": "crop-pdf",
        "files": [{"url": up3["url"], "name": up3["name"], "size": up3["size"]}],
        "options": {"mode": "manual", "top": 15, "bottom": 15, "left": 15, "right": 15, "outputFilename": "crop_e2e.pdf"}
    })
    j_res.raise_for_status()
    status_data = poll_job(j_res.json()["jobId"])
    assert status_data["status"] == "completed", f"Crop failed: {status_data}"
    print("crop-pdf PASSED! Result:", status_data["result_url"])

    # 5. PDF Forms
    print("Testing pdf-forms...")
    up4 = upload_file(sample_form_pdf)
    j_res = requests.post(f"{API_BASE}/api/v1/jobs", json={
        "tool": "pdf-forms",
        "files": [{"url": up4["url"], "name": up4["name"], "size": up4["size"]}],
        "options": {"flatten": True, "outputFilename": "forms_e2e.pdf"}
    })
    j_res.raise_for_status()
    status_data = poll_job(j_res.json()["jobId"])
    assert status_data["status"] == "completed", f"Forms failed: {status_data}"
    print("pdf-forms PASSED! Result:", status_data["result_url"])

    # 6. Compare PDF
    print("Testing compare-pdf...")
    up_v1 = upload_file(sample_diff1_pdf)
    up_v2 = upload_file(sample_diff2_pdf)
    j_res = requests.post(f"{API_BASE}/api/v1/jobs", json={
        "tool": "compare-pdf",
        "files": [
            {"url": up_v1["url"], "name": up_v1["name"], "size": up_v1["size"]},
            {"url": up_v2["url"], "name": up_v2["name"], "size": up_v2["size"]}
        ],
        "options": {"outputFilename": "diff_e2e.pdf"}
    })
    j_res.raise_for_status()
    status_data = poll_job(j_res.json()["jobId"])
    assert status_data["status"] == "completed", f"Compare failed: {status_data}"
    print("compare-pdf PASSED! Result:", status_data["result_url"])

    print("\nALL 6 TAHAP 7 E2E INTEGRATION CHECKS PASSED 100% GREEN!")

if __name__ == "__main__":
    run()
