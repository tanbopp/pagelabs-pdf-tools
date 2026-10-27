# PageLabs — PRD Tahap 5: Convert From PDF

**File:** `prd/PRD_05.md`
**Document Type:** Product Requirements Document
**Scope:** Tahap 5 — Convert From PDF (PDF to Word, Excel, PPT, JPG)
**Companion to:** `PAGELABS_TECHNOLOGY.md`, `DESIGN.md`, `ROADMAP.md`
**Target Executor:** AI Agent (Antigravity)
**Prerequisite:** Tahap 1 s/d 4 harus sudah 100% Hijau.

---

## 1. Ringkasan Eksekutif
Tahap 5 berfokus pada ekstraksi dan konversi dari file PDF ke format lain. Semua tool di tahap ini menerima **1 file PDF input**.

**Prinsip Desain:** Wajib mengikuti `DESIGN.md`. Layout UI harus sangat simpel, mengingat proses *parsing* bisa memakan waktu, pastikan `ProgressCard` memberikan *feedback* yang jelas.

---

## 2. Spesifikasi Tool & UI

Perbarui `packages/shared/src/tools.ts` (set `available: true`) dan buat halaman UI baru.

### 5.1 PDF to Word (`/tools/pdf-to-word`)
- **Accept:** `application/pdf`
- **Deskripsi UI:** "Extract PDF to Word."
- **Opsi UI:** Toggle "OCR if scanned" (Default: false).
- **Backend:** 
  - Jika Toggle mati: Gunakan LibreOffice Headless (`soffice --infilter="writer_pdf_import" --convert-to docx`).
  - Jika Toggle nyala: Jalankan OCR terlebih dahulu (menggunakan `ocrmypdf`), lalu konversi ke `.docx`.

### 5.2 PDF to Excel (`/tools/pdf-to-excel`)
- **Accept:** `application/pdf`
- **Deskripsi UI:** "Extract PDF tables to Excel."
- **Opsi UI:** Tidak ada.
- **Backend:** Gunakan LibreOffice Headless (`soffice --convert-to xlsx`). (Catatan: Ekstraksi tabel kompleks dari PDF memang sulit, LibreOffice adalah *baseline* terbaik tanpa library berbayar).

### 5.3 PDF to PowerPoint (`/tools/pdf-to-powerpoint`)
- **Accept:** `application/pdf`
- **Deskripsi UI:** "Convert PDF pages to slides."
- **Opsi UI:** Tidak ada.
- **Backend:** Gunakan LibreOffice Headless (`soffice --convert-to pptx`).

### 5.4 PDF to JPG (`/tools/pdf-to-jpg`)
- **Accept:** `application/pdf`
- **Deskripsi UI:** "Convert pages to JPG images."
- **Opsi UI:**
  - Select DPI: 72 (Web), 150 (Medium - Default), 300 (Print).
  - Select Format: JPG atau PNG.
- **Backend:**
  - Gunakan Ghostscript (`gs -sDEVICE=jpeg -r<dpi> -o output_%d.jpg input.pdf`).
  - Jika PDF memiliki lebih dari 1 halaman, kompres semua hasil gambar ke dalam bentuk file `.zip`.

---

## 3. Backend Requirements (Updates)

1. **Docker Worker (`apps/worker`):**
   - LibreOffice dan Ghostscript sudah terinstal dari Tahap 3 & 4. Tidak ada dependensi baru.
2. **Worker Recipes:**
   - `pdf_to_word.py`, `pdf_to_excel.py`, `pdf_to_ppt.py`: Gunakan `subprocess.run(["soffice", ...])`.
   - `pdf_to_jpg.py`: Gunakan `subprocess.run(["gs", ...])`. Pastikan file output di-zip menggunakan library Python `zipfile`.
3. **API Gateway (`apps/api`):**
   - Validasi `accept` hanya untuk PDF.
   - Perbarui Tool Registry.

---

## 4. Kriteria Selesai (Definition of Done)
- [ ] 4 tool baru muncul di Home dan aktif.
- [ ] PDF to Word berhasil mengekstrak teks dan gambar ke `.docx`.
- [ ] PDF to Excel menghasilkan `.xlsx` (meskipun format tabelnya mungkin tidak sempurna, file harus bisa dibuka tanpa *error*).
- [ ] PDF to PowerPoint menghasilkan `.pptx` dengan gambar halaman di tiap *slide*.
- [ ] PDF to JPG menghasilkan ZIP berisi gambar (jika > 1 halaman) dengan resolusi sesuai pilihan DPI.
- [ ] Lulus `pnpm run build` dan pengujian E2E.

---

**End of Document.**