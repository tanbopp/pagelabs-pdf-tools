# PageLabs — PRD Tahap 6: Security Tools

**File:** `prd/PRD_06.md`
**Document Type:** Product Requirements Document
**Scope:** Tahap 6 — Security (Protect, Unlock, Sign, Redact)
**Companion to:** `PAGELABS_TECHNOLOGY.md`, `DESIGN.md`, `ROADMAP.md`
**Target Executor:** AI Agent (Antigravity)
**Prerequisite:** Tahap 1 s/d 5 harus sudah 100% Hijau.

---

## 1. Ringkasan Eksekutif
Tahap 6 berfokus pada manipulasi kriptografi dan keamanan PDF. Semua tool di sini memerlukan penanganan memori yang aman (jangan pernah menyimpan password di database atau log).

**Prinsip Desain:** Wajib mengikuti `DESIGN.md`. UI harus sangat simpel. Jangan gunakan warna merah untuk peringatan keamanan; gunakan *neutral grayscale* (sesuai aturan desain kita) dengan ikon yang jelas.

---

## 2. Spesifikasi Tool & UI

Perbarui `packages/shared/src/tools.ts` (set `available: true`) dan buat halaman UI baru.

### 6.1 Protect PDF (`/tools/protect-pdf`)
- **Accept:** `application/pdf`
- **Deskripsi UI:** "Encrypt PDF with a password."
- **Opsi UI:**
  - Input Password (type="password").
  - Input Confirm Password.
  - Checkbox: "Allow printing", "Allow copying text" (Default: false / restricted).
- **Backend (`pikepdf`):**
  - Gunakan `pikepdf.Encryption(user=password, owner=password, R=6)` (AES-256).
  - Terapkan flag permission sesuai checkbox.
  - **PENTING:** Password harus dioper via Queue (Redis) sebagai parameter job, dan langsung dihapus setelah job selesai.

### 6.2 Unlock PDF (`/tools/unlock-pdf`)
- **Accept:** `application/pdf`
- **Deskripsi UI:** "Remove PDF password."
- **Opsi UI:** Input Password (type="password").
- **Backend (`pikepdf`):**
  - Buka file dengan `pikepdf.open(file, password=pwd)`.
  - Simpan ulang tanpa enkripsi.
  - Jika password salah, lempar `pikepdf.PasswordError` dan kembalikan pesan error UI yang aman ("Incorrect password").

### 6.3 Sign PDF (`/tools/sign-pdf`)
- **Accept:** `application/pdf`
- **Deskripsi UI:** "Sign your document."
- **Opsi UI:**
  - Upload Gambar Tanda Tangan (`.png` dengan background transparan).
  - Select Halaman (Default: Terakhir).
  - Position (Select: Bottom Right, Bottom Center, Top Right).
  - Optional: Input Teks Nama (jika tidak upload gambar).
- **Backend (`pikepdf` + `reportlab`):**
  - Overlay gambar tanda tangan atau teks ke halaman yang ditentukan menggunakan `reportlab.pdfgen.canvas` yang di-merge dengan `pikepdf.Page.add_overlay()`.
  - *(Catatan: Untuk Tahap 6, ini adalah visual signature. PAdES cryptography bisa ditambahkan nanti di iterasi berikutnya).*

### 6.4 Redact PDF (`/tools/redact-pdf`)
- **Accept:** `application/pdf`
- **Deskripsi UI:** "Permanently black out text."
- **Opsi UI:**
  - Input teks (comma-separated) yang ingin disensor (misal: "Rahasia, 12345, Budi").
- **Backend (`pikepdf` + `pdfminer.six`):**
  - Cari koordinat teks yang cocok menggunakan `pdfminer`.
  - Gunakan `pikepdf` untuk menggambar kotak hitam (Rectangle) di atas koordinat tersebut dan hapus objek teks aslinya (flatten).
  - **PENTING:** Teks yang sudah di-redact TIDAK BOLEH bisa di-copy atau diekstrak lagi (bukan sekadar ditutup kotak hitam).

---

## 3. Backend Requirements (Updates)

1. **Docker Worker (`apps/worker`):**
   - Instal library Python: `pyhanko`, `reportlab`, `pdfminer.six`.
2. **Queue & API Gateway:**
   - **Sangat Kritis:** Pastikan *password* tidak pernah tercatat di *structured logger* (log hanya boleh mencatat `job.created` tanpa menyertakan isi payload).
   - Payload `options` yang berisi password harus di-*sanitize* dari database setelah job selesai (atau jangan simpan password di DB sama sekali, melainkan gunakan Redis *ephemeral storage*).
3. **Worker Recipes:**
   - Terapkan resep `protect_pdf.py`, `unlock_pdf.py`, `sign_pdf.py`, dan `redact_pdf.py`.

---

## 4. Kriteria Selesai (Definition of Done)
- [ ] 4 tool baru muncul di Home dan aktif.
- [ ] Protect PDF menghasilkan file yang meminta password saat dibuka.
- [ ] Unlock PDF berhasil membuka file berpassword (dan menolak jika password salah).
- [ ] Sign PDF berhasil menempelkan gambar/teks tanda tangan di posisi yang tepat.
- [ ] Redact PDF benar-benar menghapus teks (diuji dengan mencoba *copy-paste* teks dari file hasil).
- [ ] **KEAMANAN:** Password tidak muncul di log terminal, tidak tersimpan di database setelah job selesai.
- [ ] Lulus `pnpm run build` dan pengujian E2E.

---

**End of Document.**