# PageLabs — PRD Tahap 11: Edit PDF (Annotate & Edit Mode)

**File:** `prd/PRD_11.md`
**Scope:** Tahap 11 — Tool Edit PDF dengan mode Annotate dan Edit
**Target Executor:** AI Agent (Antigravity)
**Prerequisite:** Tahap 1 s/d 10 harus sudah Hijau.

## 1. Ringkasan
Membangun tool **Edit PDF** dengan dua mode utama yang dapat dipilih pengguna:
1. **Annotate Mode:** Menambahkan anotasi (teks, highlight, freehand, shapes) di atas PDF.
2. **Edit Mode:** Mengedit teks atau objek yang sudah ada di dalam PDF (jika memungkinkan).

## 2. Referensi Library
- **Annotate:** Gunakan `fresh-air-pdf` (React component) atau `@pdf-annotator/pdf-annotator` [citation:3][citation:8].
- **Edit:** Gunakan `Aspose.PDF FOSS` atau library sejenis yang mendukung editing konten [citation:1][citation:4].

## 3. Spesifikasi UI (Sesuai Referensi)
- **Layout 2-Kolom:** Canvas kiri (PDF viewer), Panel kanan (Tools & Settings).
- **Toolbar Atas:** Tombol "Annotate" dan "Edit" (mode switch).
- **Annotate Toolbar:** Ikon untuk Text, Highlight, Freehand (Draw), Shapes (Rectangle, Circle, Arrow), Eraser, Undo/Redo.
- **Edit Toolbar:** Ikon untuk Text Edit, Font, Size, Bold/Italic/Underline.
- **Panel Kanan:** Menampilkan properti dari tool yang sedang aktif (misal: warna highlight, ketebalan garis).
- **Tombol Simpan:** Di pojok kanan bawah panel, "Save changes".

## 4. Flow UX
1. User upload file.
2. Default mode: **Annotate**.
3. User memilih tool dari toolbar.
4. User berinteraksi dengan PDF (klik, drag, ketik).
5. User bisa switch ke **Edit** mode (jika didukung).
6. User klik "Save changes" untuk menyimpan hasil.
7. Backend memproses file yang sudah dianotasi/diedit.

## 5. Backend Requirements
- API menerima file PDF + data anotasi (JSON) atau file PDF hasil edit.
- Jika menggunakan library client-side (seperti `fresh-air-pdf`), hasil edit bisa langsung di-export sebagai PDF baru dan di-upload ke backend untuk disimpan.
- Pastikan worker mendukung tool `edit-pdf` di registry (set `available: true`).

## 6. Kriteria Selesai
- [ ] Tool Edit PDF muncul di Home.
- [ ] Mode Annotate berfungsi: bisa menambah teks, highlight, freehand, shapes.
- [ ] Mode Edit berfungsi (minimal untuk teks yang ada, jika library mendukung).
- [ ] UI sesuai tema (shadowless, rounded, dark mode neutral).
- [ ] Lulus build (0 error).

Silakan eksekusi perbaikan ini sekarang.