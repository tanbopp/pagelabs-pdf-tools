import requests
import json
import time
from pathlib import Path
import pikepdf
import fitz

API_BASE = "http://localhost:3001"

def create_sample_pdf(path: Path, text: str = "Confidential Top Secret 12345"):
    pdf = pikepdf.new()
    pdf.add_blank_page(page_size=(300, 300))
    stream = f"BT /F1 12 Tf 50 250 Td ({text}) Tj ET".encode("utf-8")
    pdf.pages[0]["/Contents"] = pdf.make_stream(stream)
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
    tmp = Path("apps/api/storage/uploads/e2e_tahap6_tmp")
    tmp.mkdir(parents=True, exist_ok=True)

    plain_pdf = tmp / "plain.pdf"
    create_sample_pdf(plain_pdf, text="Confidential Top Secret 12345 Document")

    # 1. Protect PDF
    print("Testing protect-pdf...")
    up1 = upload_file(plain_pdf)
    j_res = requests.post(f"{API_BASE}/api/v1/jobs", json={
        "tool": "protect-pdf",
        "files": [{"url": up1["url"], "name": up1["name"], "size": up1["size"]}],
        "options": {"password": "Password123!", "outputFilename": "protected_e2e.pdf"}
    })
    j_res.raise_for_status()
    status_data = poll_job(j_res.json()["jobId"])
    assert status_data["status"] == "completed", f"Protect failed: {status_data}"
    protected_job_id = j_res.json()["jobId"]
    print("protect-pdf PASSED! Result:", status_data["result_url"])

    # Verify password is scrubbed from database options
    check_job = requests.get(f"{API_BASE}/api/v1/jobs/{protected_job_id}").json()
    assert "password" not in check_job.get("options", {}), "SECURITY AUDIT FAILED: Password leaked in job query!"

    # Download protected PDF
    protected_download = requests.get(f"{API_BASE}{status_data['result_url']}")
    assert protected_download.status_code == 200
    protected_file_path = tmp / "downloaded_protected.pdf"
    protected_file_path.write_bytes(protected_download.content)

    # 2. Unlock PDF - Wrong Password (Should fail with secure error message)
    print("Testing unlock-pdf with wrong password...")
    up_wrong = upload_file(protected_file_path)
    j_wrong = requests.post(f"{API_BASE}/api/v1/jobs", json={
        "tool": "unlock-pdf",
        "files": [{"url": up_wrong["url"], "name": up_wrong["name"], "size": up_wrong["size"]}],
        "options": {"password": "WrongPassword!", "outputFilename": "fail.pdf"}
    })
    j_wrong.raise_for_status()
    status_wrong = poll_job(j_wrong.json()["jobId"])
    assert status_wrong["status"] == "failed", f"Unlock with wrong password should fail: {status_wrong}"
    print("unlock-pdf wrong password rejected as expected:", status_wrong.get("error_message"))

    # 3. Unlock PDF - Correct Password
    print("Testing unlock-pdf with correct password...")
    up2 = upload_file(protected_file_path)
    j_res = requests.post(f"{API_BASE}/api/v1/jobs", json={
        "tool": "unlock-pdf",
        "files": [{"url": up2["url"], "name": up2["name"], "size": up2["size"]}],
        "options": {"password": "Password123!", "outputFilename": "unlocked_e2e.pdf"}
    })
    j_res.raise_for_status()
    status_data = poll_job(j_res.json()["jobId"])
    assert status_data["status"] == "completed", f"Unlock failed: {status_data}"
    print("unlock-pdf PASSED! Result:", status_data["result_url"])

    # 4. Sign PDF
    print("Testing sign-pdf...")
    up3 = upload_file(plain_pdf)
    j_res = requests.post(f"{API_BASE}/api/v1/jobs", json={
        "tool": "sign-pdf",
        "files": [{"url": up3["url"], "name": up3["name"], "size": up3["size"]}],
        "options": {
            "nameText": "Alice Smith",
            "position": "bottom-right",
            "page": "last",
            "outputFilename": "signed_e2e.pdf"
        }
    })
    j_res.raise_for_status()
    status_data = poll_job(j_res.json()["jobId"])
    assert status_data["status"] == "completed", f"Sign failed: {status_data}"
    print("sign-pdf PASSED! Result:", status_data["result_url"])

    # 5. Redact PDF (Physical scrub)
    print("Testing redact-pdf (physical removal)...")
    up4 = upload_file(plain_pdf)
    j_res = requests.post(f"{API_BASE}/api/v1/jobs", json={
        "tool": "redact-pdf",
        "files": [{"url": up4["url"], "name": up4["name"], "size": up4["size"]}],
        "options": {
            "terms": "Top Secret, 12345",
            "outputFilename": "redacted_e2e.pdf"
        }
    })
    j_res.raise_for_status()
    status_data = poll_job(j_res.json()["jobId"])
    assert status_data["status"] == "completed", f"Redact failed: {status_data}"

    # Download and verify text is physically absent
    redacted_dl = requests.get(f"{API_BASE}{status_data['result_url']}")
    redacted_file_path = tmp / "downloaded_redacted.pdf"
    redacted_file_path.write_bytes(redacted_dl.content)

    doc = fitz.open(str(redacted_file_path))
    content_text = doc[0].get_text()
    doc.close()

    assert "Top Secret" not in content_text, "SECURITY AUDIT FAILED: Redacted term 'Top Secret' is still extractable!"
    assert "12345" not in content_text, "SECURITY AUDIT FAILED: Redacted term '12345' is still extractable!"
    assert "Confidential" in content_text, "Non-redacted content should remain intact"
    print("redact-pdf physical text scrub PASSED! Text confirmed unextractable.")

    print("\nALL 4 TAHAP 6 E2E SECURITY & CRYPTOGRAPHY CHECKS PASSED 100% GREEN!")

if __name__ == "__main__":
    run()
