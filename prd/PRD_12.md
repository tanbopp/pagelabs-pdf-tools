# PageLabs — PRD Tahap 12: Advanced Add Page Numbers

**File:** `prd/PRD_12.md`
**Scope:** Tahap 12 — Add Page Numbers (iLovePDF UX Replication)
**Target Executor:** AI Agent (Antigravity)
**Prerequisite:** Tahap 1 s/d 11 Hijau.

## 1. Tujuan
Membangun ulang UI/UX tool **Add Page Numbers** agar persis seperti iLovePDF: memiliki *live preview* penempatan nomor, pilihan *margin*, *mode* halaman (Single/Facing), format teks, dan format font.

## 2. Spesifikasi UI (Panel Kanan)
Panel kanan harus memiliki opsi berikut (dikelompokkan dengan rapi dan hemat teks):

1. **Page Mode:**
   - Radio Group: `Single page` (default), `Facing pages`.
   - Checkbox: `First page is cover page` (hanya muncul jika Facing pages dipilih).
2. **Position (Visual Grid):**
   - Tampilkan kotak grid 3x3 (seperti gambar referensi).
   - Saat salah satu kotak diklik, kotak tersebut terisi warna (primary) dan posisi nomor halaman di *Live Preview* (canvas kiri) langsung berpindah.
3. **Margin:**
   - Select: `Small`, `Recommended` (default), `Big`.
4. **Pages (Range):**
   - Input: `First number` (default 1).
   - Input: `from page` dan `to page`.
5. **Text Format (Teks Nomor):**
   - Select: `Insert only page number` (default), `Page {n}`, `Page {n} of {p}`, `Custom`.
   - Jika `Custom` dipilih, munculkan input teks (misal: `- {n} -`).
6. **Font Format:**
   - Select Font: Arial (default), Times New Roman, Courier.
   - Select Size: 10, 12, 14, 16, 18, 24.
   - Toggle Icon: Bold (B), Italic (I), Underline (U).
   - Color Picker: (Default hitam, atau abu-abu gelap).

## 3. Live Preview (Canvas Kiri)
- Render halaman PDF menggunakan `pdfjs-dist`.
- Di atas halaman PDF, render overlay teks nomor halaman secara reaktif.
- Jika user mengubah posisi, margin, atau format teks, overlay langsung berubah secara instan tanpa harus memproses ke backend.

## 4. Backend Logic (Worker)
- Update API schema untuk menerima opsi baru: `{ mode, position, margin, startNumber, fromPage, toPage, format, font, size, bold, italic, underline }`.
- Di worker (`pikepdf` + `reportlab`):
  - Iterasi halaman yang dipilih.
  - Hitung koordinat X dan Y berdasarkan `position` (9 grid) dan `margin` (Small/Rec/Big).
  - Format teks sesuai pilihan (ganti `{n}` dengan nomor halaman, `{p}` dengan total halaman).
  - Terapkan gaya font menggunakan `reportlab.pdfbase.pdfmetrics`.
  - Overlay teks ke halaman PDF.

## 5. Kriteria Selesai
- [ ] UI panel kanan sesuai dengan gambar referensi (Grid 3x3, Select Margin, Select Format, Font Format).
- [ ] Live Preview di canvas langsung berubah saat opsi diubah.
- [ ] Hasil PDF dari backend memiliki nomor halaman yang posisinya persis sesuai preview.
- [ ] Mendukung format teks `Page 1 of 10`, dan custom teks.
- [ ] Desain sesuai `DESIGN.md` (shadowless, rounded, dark mode neutral).
- [ ] Lulus build (0 error).

Silakan eksekusi perbaikan ini sekarang.