# PageLabs — PRD Tahap 8: Polish, Hardening & Production Readiness

**File:** `prd/PRD_08.md`
**Document Type:** Product Requirements Document
**Scope:** Tahap 8 — Production Readiness, Security, Performance, & Accessibility
**Companion to:** `PAGELABS_TECHNOLOGY.md`, `DESIGN.md`, `ROADMAP.md`
**Target Executor:** AI Agent (Antigravity)
**Prerequisite:** Tahap 1 s/d 7 harus sudah 100% Hijau. AI Tools sengaja di-skip (Coming Soon).

---

## 1. Ringkasan Eksekutif
Seluruh 25 tool (non-AI) telah dibangun. Tahap 8 berfokus pada **Hardening** (keamanan), **Performance** (kecepatan), **Accessibility** (kemudahan akses), dan persiapan **Deployment** (produksi). Kita harus memastikan tidak ada kebocoran memori, *error* yang tidak tertangani, dan UI yang ramah pembaca layar.

---

## 2. Security & Hardening (Backend & Frontend)

1. **Rate Limiting (Redis/BullMQ):**
   - Pastikan limit anonim (10 job/jam) berjalan ketat di environment *production*.
   - Tambahkan *error handling* di UI jika user terkena rate limit (Tampilkan `ErrorAlert`: "You have reached the limit. Please try again in an hour.").
2. **Header Keamanan (Next.js & API):**
   - Konfigurasi `next.config.js` untuk menyertakan header:
     - `Content-Security-Policy` (CSP) (izinkan `self` dan domain API).
     - `X-Frame-Options: DENY`
     - `X-Content-Type-Options: nosniff`
     - `Referrer-Policy: strict-origin-when-cross-origin`
3. **Validasi Tipe File (Magic Bytes):**
   - Jangan hanya percaya pada ekstensi atau MIME type (karena bisa dipalsukan). Di sisi API (`POST /jobs`), periksa *magic bytes* dari file yang di-upload (misal: file harus diawali dengan `%PDF` untuk PDF, `\x89PNG` untuk PNG).
4. **Sanitasi Path & Eksekusi (Worker):**
   - Pastikan nama file yang di-upload di-*sanitize* secara ketat sebelum disimpan di `tmpdir` (cegah *directory traversal* `../`).
   - Pastikan tidak ada *command injection* di semua `subprocess.run` (jangan gunakan `shell=True`).

---

## 3. Performance & Optimization

1. **Frontend Caching:**
   - Pastikan halaman Home dan Placeholder menggunakan *Static Site Generation* (SSG) atau *React Server Components* yang di-*cache*.
   - Konfigurasi `next/font` untuk Manrope agar di-*preload* dan tidak menyebabkan *Layout Shift* (CLS).
2. **Asset Optimization:**
   - Pastikan semua ikon (Lucide) di-*tree-shake* agar tidak membebani bundle.
3. **Worker Performance:**
   - Gunakan `pikepdf` secara efisien. Jika memproses file besar (di atas 50MB), pastikan worker tidak mengalami *Out of Memory* (OOM).
   - Tambahkan `try-except` di level worker untuk memastikan *file temporary* tetap terhapus (shred) meskipun proses PDF gagal di tengah jalan.

---

## 4. Accessibility (A11y) & UX Polish

1. **Screen Reader & Keyboard Navigation:**
   - Uji tabulasi (tombol `Tab`) di semua halaman. Fokus harus terlihat jelas (menggunakan `ring-2 ring-ring`).
   - Pastikan `FileDropZone` bisa diakses via keyboard (`Enter` atau `Space` untuk membuka file picker).
   - Setiap tombol ikon (seperti `X` di FileChip, ikon *Drag*) harus memiliki atribut `aria-label` yang jelas.
2. **Reduced Motion:**
   - Pastikan transisi animasi (terutama saat *drag-and-drop* atau *loading spinner*) di-*disable* jika OS pengguna mengaktifkan `prefers-reduced-motion`.
3. **Empty States & Error Handling:**
   - Pastikan semua error dari backend (seperti `PROCESSING_FAILED`, `FILE_TOO_LARGE`) ditangkap dengan baik oleh frontend dan ditampilkan menggunakan komponen `ErrorAlert` dengan bahasa yang ramah (bukan *stack trace*).
   - Pastikan halaman 404 (`not-found.tsx`) didesain dengan rapi.

---

## 5. Deployment Readiness (Documentation & Env)

1. **Docker Production Build:**
   - Pastikan `docker-compose.prod.yml` dibuat. 
   - Pastikan worker Python menggunakan *multi-stage build* agar ukuran image tidak membengkak.
2. **Environment Variables:**
   - Buat file `.env.production.example` yang memisahkan *Secret Keys* (S3, Redis, DB).
3. **Root `README.md`:**
   - Tulis panduan lengkap: Cara Setup Lokal (Development), Cara Build Production, dan Cara Deploy (Vercel untuk Frontend, Railway/VPS untuk API & Worker).

---

## 6. Kriteria Selesai (Definition of Done)
- [ ] Semua halaman lulus uji *Accessibility* (0 error di axe DevTools).
- [ ] Rate limit berfungsi dan memunculkan UI yang tepat.
- [ ] Header keamanan (CSP, X-Frame-Options) terpasang di Next.js.
- [ ] File berbahaya (misal `.exe` yang di-rename jadi `.pdf`) ditolak oleh validasi *Magic Bytes*.
- [ ] Semua transisi *drag-and-drop* dan *loading* menghormati `prefers-reduced-motion`.
- [ ] `README.md` dan panduan deployment selesai ditulis.
- [ ] Lulus `pnpm run build` dengan 0 warning / 0 error di seluruh monorepo.

---

**End of Document.**