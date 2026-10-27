# PageLabs — PRD Tahap 7: Parity & Edit Tools

**File:** `prd/PRD_07.md`
**Document Type:** Product Requirements Document
**Scope:** Tahap 7 — Tool Pelengkap (Paritas iLovePDF)
**Companion to:** `PAGELABS_TECHNOLOGY.md`, `DESIGN.md`, `ROADMAP.md`
**Target Executor:** AI Agent (Antigravity)
**Prerequisite:** Tahap 1 s/d 6 harus sudah 100% Hijau.

---

## 1. Ringkasan Eksekutif
Tahap ini melengkapi inventaris tool non-AI kita agar sejajar dengan iLovePDF. Kita akan menambahkan tool manipulasi lanjutan (Watermark, Page Numbers, Crop, Forms, Compare) dan *Scan to PDF*. 

**Prinsip Desain:** Wajib mengikuti `DESIGN.md`. Tool yang memiliki fitur "Edit" harus menggunakan UI yang sangat bersih (whitespace lapang) dan tidak membingungkan.

---

## 2. Perombakan Kategori (Tool Registry)
Perbarui file `packages/shared/src/tools.ts`:
1. Buat kategori baru: `edit` (Edit PDF).
2. Pindahkan `pdf-to-pdfa` dari kategori `optimize` ke `convert-from`.
3. Tambahkan tool baru ke dalam kategori masing-masing.

---

## 3. Spesifikasi Tool Baru

### 7.1 Scan to PDF (`/tools/scan-to-pdf`)
- **Kategori:** Organize
- **Accept:** `.jpg`, `.jpeg`, `.png`
- **Deskripsi UI:** "Convert photos to PDF."
- **Opsi UI:** 
  - Upload banyak gambar (menggunakan `FileDropZone` multi-file seperti JPG to PDF).
  - Toggle: "Auto-deskew" (Default: false).
- **Backend:** Gunakan `img2pdf` untuk menggabungkan gambar. Jika *Auto-deskew* aktif, gunakan library Python `unpaper` (melalui subprocess) untuk merapikan gambar miring sebelum dijadikan PDF.

### 7.2 Add Page Numbers (`/tools/add-page-numbers`)
- **Kategori:** Edit
- **Accept:** `application/pdf`
- **Deskripsi UI:** "Add numbers to pages."
- **Opsi UI:**
  - Select Position: Bottom Center (Default), Bottom Right, Bottom Left, Top Right, dll.
  - Input Start Number (Default: 1).
  - Select Format: "1", "Page 1", "1 / N".
- **Backend:** Gunakan `pikepdf` + `reportlab` untuk meng-overlay teks nomor halaman.

### 7.3 Add Watermark (`/tools/add-watermark`)
- **Kategori:** Edit
- **Accept:** `application/pdf`
- **Deskripsi UI:** "Stamp a watermark."
- **Opsi UI:**
  - Radio: Text / Image.
  - Jika Text: Input teks (cth: "CONFIDENTIAL").
  - Jika Image: Upload gambar PNG.
  - Slider Opacity (0.1 - 1.0).
  - Select Position (Center, Diagonal, Top, Bottom).
- **Backend:** Gunakan `pikepdf` + `reportlab` untuk meng-overlay teks atau gambar transparan.

### 7.4 Crop PDF (`/tools/crop-pdf`)
- **Kategori:** Edit
- **Accept:** `application/pdf`
- **Deskripsi UI:** "Trim PDF margins."
- **Opsi UI:**
  - Mode: "Auto-crop" (Deteksi margin otomatis) atau "Manual".
  - Jika Manual: Input margin Top, Bottom, Left, Right (dalam satuan *points* atau *mm*).
  - Terapkan ke: "All pages" (Default).
- **Backend:** Gunakan `pikepdf` untuk memodifikasi `MediaBox` dan `CropBox`. (Untuk Auto-crop, gunakan `pikepdf` dengan script deteksi bounding box).

### 7.5 PDF Forms (`/tools/pdf-forms`)
- **Kategori:** Edit
- **Accept:** `application/pdf`
- **Deskripsi UI:** "Fill or flatten forms."
- **Opsi UI:**
  - Toggle: "Flatten form fields" (Jadikan teks permanen, tidak bisa diedit lagi).
  - *(Catatan: Karena mengisi form secara dinamis via UI sangat kompleks, untuk tahap ini, tool ini difokuskan untuk me-render form agar bisa diisi lewat browser PDF viewer bawaan, ATAU sekadar mem-flatten form. Jika tidak ada field, lempar error).*
- **Backend:** Gunakan `pypdf` untuk mendeteksi field dan melakukan `flatten()`.

### 7.6 Compare PDF (`/tools/compare-pdf`)
- **Kategori:** Security
- **Accept:** `application/pdf` (Menerima 2 file).
- **Deskripsi UI:** "Find differences."
- **Opsi UI:** Tidak ada.
- **Backend:** 
  - Gunakan library Python `diff-pdf` (melalui subprocess). 
  - Bandingkan 2 file. Hasil output adalah PDF baru dengan kotak merah/hijau yang menandai perbedaan.
  - Jika tidak ada perbedaan, return error `PROCESSING_FAILED` ("No differences found").

---

## 4. Kriteria Selesai (Definition of Done)
- [ ] Tool Registry dirombak sesuai kategori baru (termasuk menambah `edit` dan memindah PDF/A).
- [ ] Home page mem-render 7 kategori dengan tool yang lengkap (AI tetap Coming Soon).
- [ ] 6 tool baru berfungsi (Scan to PDF, Add Page Numbers, Add Watermark, Crop, Forms, Compare).
- [ ] Khusus `Compare PDF` dan `Scan to PDF`, pastikan `FileDropZone` di-set untuk menerima 2 file (Compare) atau multi-file (Scan).
- [ ] Lulus `pnpm run build` (0 error) dan desain sesuai `DESIGN.md` (terutama untuk slider opacity di Watermark dan input kustom di Crop).

---

**End of Document.**