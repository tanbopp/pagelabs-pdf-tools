# PageLabs — PRD Tahap 9: UX/UI Polish & Micro-interactions

**File:** `prd/PRD_09.md`
**Document Type:** Product Requirements Document
**Scope:** Tahap 9 — UX Polish (Tool-by-Tool Usability Improvements)
**Companion to:** `PAGELABS_TECHNOLOGY.md`, `DESIGN.md`, `ROADMAP.md`
**Target Executor:** AI Agent (Antigravity)
**Prerequisite:** Tahap 1 s/d 8 harus sudah 100% Hijau. Fokus PRD ini adalah **Frontend Only** (tidak mengubah logika backend).

---

## 1. Ringkasan Eksekutif
Fondasi backend sudah sempurna. Namun, antarmuka pengguna (UI) saat ini masih terasa kaku dan generik. PRD ini bertujuan untuk **memoles UX per tool** agar pengguna tidak kebingungan, meminimalisir klik, dan memberikan *feedback* yang instan. 

**Prinsip Utama UX:**
1. **Zero-Configuration:** Berikan *default* yang masuk akal. Pengguna bisa langsung klik "Process" tanpa harus mengubah pengaturan.
2. **Inline Feedback:** Jangan gunakan *alert* atau *pop-up* untuk hal kecil. Gunakan *toast*, *state* tombol, atau *skeleton*.
3. **Smart Grouping:** Kelompokkan opsi yang mirip, sembunyikan opsi lanjutan di bawah tombol "Advanced" jika terlalu banyak.

---

## 2. Peningkatan UX Per Tool (Spesifikasi Frontend)

### 2.1 Tool: Merge PDF
- **Masalah:** Jika pengguna mengunggah 50 file, *grid* menjadi sangat panjang dan sulit di-*scroll*.
- **Perbaikan:** 
  - Tambahkan *sticky bar* di bagian atas kanvas (saat file > 5) yang menampilkan "X files selected" beserta tombol "Sort by Name" (A-Z) agar pengguna tidak perlu menyortir manual.
  - Tampilkan *skeleton loading* (kotak abu-abu) di posisi thumbnail saat `pdfjs-dist` sedang merender halaman.

### 2.2 Tool: Split PDF & Extract Pages
- **Masalah:** Pengguna sering salah memasukkan format *range* (misal: `1-3, 5`).
- **Perbaikan:** 
  - Tambahkan *inline validation*. Jika format salah, *border input* berubah menjadi tebal (neutral grayscale) dan muncul teks kecil di bawahnya: *"Use format: 1-3, 5"*.
  - Tambahkan tombol pintas: "Select All Pages" / "Clear".

### 2.3 Tool: Remove Pages
- **Masalah:** Pengguna tidak tahu halaman mana yang akan terhapus sampai mereka memprosesnya.
- **Perbaikan:** 
  - Di bawah input *range*, tampilkan *text preview* kecil: *"You are about to remove 3 pages out of 10."*
  - Tombol proses: ubah teks menjadi **"Remove 3 Pages"** (dinamis mengikuti jumlah halaman yang akan dihapus).

### 2.4 Tool: Organize PDF
- **Masalah:** Rotasi dan hapus per halaman memakan banyak klik.
- **Perbaikan:**
  - Tambahkan *Floating Action Bar* di bagian bawah tengah layar jika ada halaman yang dipilih: *"Rotate Selected (90°)"*, *"Delete Selected"*.
  - Tambahkan tombol "Rotate All" di *sticky header*.

### 2.5 Tool: Compress PDF
- **Masalah:** Pengguna tidak tahu seberapa kecil hasilnya.
- **Perbaikan:**
  - UI saat memilih tingkat kompresi harus menampilkan *mockup card* kecil: 
    - *"Less compression (High Quality)"* → `~2 MB`
    - *"Recommended"* → `~800 KB`
    - *"Extreme"* → `~300 KB`
  - (Gunakan estimasi statis berbasis ukuran file input di *client-side*).

### 2.6 Tool: Convert To PDF (Word, Excel, PPT, JPG, HTML)
- **Masalah:** Jika file yang di-upload formatnya salah, baru ketahuan setelah diproses.
- **Perbaikan:**
  - Ubah teks di `FileDropZone` secara dinamis sesuai tool. (Misal untuk Word: *"Drop DOCX or DOC here"*).
  - Lakukan *Client-Side Validation* yang ketat: Jika user mengunggah `.pdf` ke tool Word to PDF, langsung tolak dengan *Toast* dan jangan masukkan ke *state*.

### 2.7 Tool: Convert From PDF (PDF to Word, Excel, JPG)
- **Masalah:** Proses ini memakan waktu lama, pengguna bisa bosan menunggu.
- **Perbaikan:**
  - Ganti `ProgressCard` yang standar dengan *Progress Card* yang menampilkan tips acak (misal: *"Did you know? PageLabs doesn't store your files forever."*).
  - Tombol *Process* harus menampilkan status *"Extracting text..."* atau *"Converting..."* berdasarkan *polling* status dari API.

### 2.8 Tool: Security (Protect, Unlock, Sign, Redact)
- **Masalah:** Input password rentan typo, dan *Signature pad* sulit digunakan di desktop.
- **Perbaikan:**
  - **Protect PDF:** Tambahkan tombol ikon "Mata" (Eye) untuk melihat/menyembunyikan *password*.
  - **Sign PDF:** Jangan hanya *upload file*. Buat area *canvas* interaktif di UI (`react-signature-canvas`) agar pengguna bisa langsung menggambar tanda tangan menggunakan *mouse* atau *touchscreen*.

### 2.9 Tool: Edit (Add Watermark, Page Numbers, Crop)
- **Masalah:** Pengguna tidak bisa membayangkan posisi watermark atau nomor halaman sebelum diproses.
- **Perbaikan:**
  - **Live Preview:** Tampilkan gambar halaman pertama PDF (di-render via `pdfjs-dist` di *client*) di samping panel opsi. 
  - Jika pengguna mengganti posisi watermark/nomor halaman, *overlay* teks/gambar langsung bergeser secara reaktif di atas *live preview* tersebut (tanpa harus memproses ke backend).

---

## 3. Global UX Enhancements

1. **Dynamic Button Text:** 
   - Ubah teks tombol submit secara dinamis. 
   - Contoh: Di halaman *Merge PDF*, jika 0 file: *"Select files"*. Jika 2 file: *"Merge 2 PDFs"*. Saat loading: *"Merging..."*.
2. **Toast Notifications:**
   - Pastikan setiap kali file ditambahkan, muncul *Toast* singkat: *"1 file added"*.
   - Pastikan setiap error validasi file (misal ukuran terlalu besar) muncul *Toast* yang jelas, bukan sekadar *silent fail*.
3. **Dropzone Animations:**
   - Saat file di-*drag* ke atas area *Dropzone*, ubah warna *border* dan tambahkan animasi *pulse* (halus) untuk memberi tahu pengguna bahwa area tersebut aktif.
4. **Mobile Responsiveness:**
   - Pastikan layout 2-kolom (seperti di Merge/Organize) berubah menjadi 1-kolom (vertikal) di layar *mobile* (`< 768px`). Panel opsi pindah ke bawah kanvas, dan menjadi `w-full` bukan `sticky`.

---

## 4. Kriteria Selesai (Definition of Done)
- [ ] Semua tool memiliki *dynamic button text*.
- [ ] Validasi client-side berjalan (file yang salah format langsung ditolak sebelum ke backend).
- [ ] `Signature Pad` berfungsi menggunakan canvas (tanpa harus upload gambar) untuk tool Sign PDF.
- [ ] *Live Preview* berfungsi di tool Add Watermark dan Add Page Numbers.
- [ ] Tampilan *responsive* di mobile (1 kolom, tidak ada elemen yang terpotong).
- [ ] Desain tetap mematuhi `DESIGN.md` (Shadowless, Full-Rounded, Whitespace).
- [ ] Lulus `pnpm run build` tanpa error.

---

**End of Document.**