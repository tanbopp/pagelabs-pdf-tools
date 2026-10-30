export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface FaqCategory {
  id: string;
  title: string;
  items: FaqItem[];
}

export interface FaqLocaleContent {
  title: string;
  description: string;
  categoriesLabel: string;
  onThisPageLabel: string;
  categories: FaqCategory[];
}

export const faqLocales: Record<"en" | "id", FaqLocaleContent> = {
  en: {
    title: "Help Center & FAQ",
    description: "Complete guide and answers covering all PageLabs PDF utilities, file security, limits, and processing features.",
    categoriesLabel: "Categories",
    onThisPageLabel: "On this page",
    categories: [
      {
        id: "general-privacy",
        title: "General & Privacy",
        items: [
          {
            id: "are-files-safe",
            question: "Are my files safe?",
            answer:
              "Yes. All file transfers are secured using HTTPS encryption. We do not analyze, share, or sell your files to third parties. Your documents are handled in strictly isolated environments.",
          },
          {
            id: "keep-copy",
            question: "Do you keep a copy of my files?",
            answer:
              "No. Files are permanently deleted from our servers 2 hours after processing. You can also delete them manually right after downloading your result. We do not retain any backups.",
          },
          {
            id: "need-account",
            question: "Do I need an account?",
            answer:
              "No. PageLabs is completely free and requires no sign-up, registration, or credit card. You can start using every tool immediately without friction.",
          },
          {
            id: "max-file-size",
            question: "What is the maximum file size?",
            answer:
              "The limit is 100MB per file, with a maximum of 20 files per operation. This limit ensures optimal server throughput and reliable turnaround times.",
          },
        ],
      },
      {
        id: "organize-manage",
        title: "Organize & Manage",
        items: [
          {
            id: "merge-pdf",
            question: "How do I merge PDFs?",
            answer:
              "Upload multiple files to the Merge PDF tool, drag them into your preferred order, and click Merge. You can combine multiple documents into a single, cohesive PDF in seconds.",
          },
          {
            id: "split-pdf",
            question: "How do I split a PDF?",
            answer:
              "Use Split PDF to divide your document. You can split by custom page ranges, fixed page intervals, or extract individual pages to download separately.",
          },
          {
            id: "remove-pages",
            question: "How do I remove pages?",
            answer:
              "Use Remove Pages, select or enter the specific page numbers you want to delete, and process. The tool creates a clean PDF containing only the pages you want to keep.",
          },
          {
            id: "extract-pages",
            question: "How do I extract pages?",
            answer:
              "Use Extract Pages to pull specific pages into a new PDF document. You can choose to merge all extracted pages into a single file or keep them separate.",
          },
          {
            id: "reorder-pages",
            question: "How do I reorder pages?",
            answer:
              "Use Organize PDF to visually drag and drop pages into any order, rotate them, or delete them. You can also combine multiple PDFs into this visual canvas before saving.",
          },
          {
            id: "rotate-pdf",
            question: "How do I rotate a PDF?",
            answer:
              "Use Rotate PDF to rotate all pages or specific pages by 90, 180, or 270 degrees. This fixes upside-down scans and misaligned document orientations permanently.",
          },
          {
            id: "scan-to-pdf",
            question: "What does Scan to PDF do?",
            answer:
              "Scan to PDF converts your photos or scanned image files (JPG/PNG) into a single PDF document. You can reorder images and adjust orientation prior to exporting.",
          },
        ],
      },
      {
        id: "optimize-repair",
        title: "Optimize & Repair",
        items: [
          {
            id: "compress-pdf",
            question: "How do I compress a PDF?",
            answer:
              "Use Compress PDF to reduce file size. 'Recommended' mode balances image quality and file size, while 'Extreme' reduces the file size as much as possible for email sharing.",
          },
          {
            id: "repair-pdf",
            question: "How do I repair a broken PDF?",
            answer:
              "Use Repair PDF to analyze and recover unreadable or corrupted documents. The engine attempts to reconstruct the PDF xref table and recover all undamaged content.",
          },
          {
            id: "ocr-pdf",
            question: "How does OCR work?",
            answer:
              "OCR PDF (Optical Character Recognition) scans images of text and makes them searchable and selectable. It supports multiple languages and embeds an invisible text layer directly onto the document.",
          },
          {
            id: "pdf-to-pdfa",
            question: "What is PDF to PDF/A?",
            answer:
              "PDF to PDF/A converts your PDF into an ISO-standardized format designed for long-term archiving. It embeds all necessary fonts, color profiles, and metadata so files remain readable decades into the future.",
          },
        ],
      },
      {
        id: "convert-to-pdf",
        title: "Convert To PDF",
        items: [
          {
            id: "word-to-pdf",
            question: "How do I convert Word to PDF?",
            answer:
              "Use Word to PDF to convert .docx and .doc files while preserving your layout, fonts, and images. The conversion produces a high-fidelity vector PDF ready for sharing.",
          },
          {
            id: "excel-to-pdf",
            question: "How do I convert Excel to PDF?",
            answer:
              "Use Excel to PDF for spreadsheets (.xlsx and .xls). The tool formats sheets cleanly, allowing you to fit content to page widths for readable printing.",
          },
          {
            id: "powerpoint-to-pdf",
            question: "How do I convert PowerPoint to PDF?",
            answer:
              "Use PowerPoint to PDF to convert .pptx and .ppt presentations into PDF slides. All slide geometries, typography, and graphics are preserved accurately.",
          },
          {
            id: "jpg-to-pdf",
            question: "How do I convert JPG to PDF?",
            answer:
              "Use JPG to PDF to compile images into a PDF. You can upload multiple images, drag to reorder them, and adjust orientation and page margins before downloading.",
          },
          {
            id: "html-to-pdf",
            question: "How do I convert HTML to PDF?",
            answer:
              "Use HTML to PDF to convert HTML files and markup into a PDF document. It accurately renders page structure and formatting for offline reading.",
          },
        ],
      },
      {
        id: "convert-from-pdf",
        title: "Convert From PDF",
        items: [
          {
            id: "pdf-to-word",
            question: "How do I convert PDF to Word?",
            answer:
              "Use PDF to Word to extract content into editable .docx documents. If your PDF contains scanned pages, enable the OCR option to convert images into editable paragraphs.",
          },
          {
            id: "pdf-to-excel",
            question: "How do I extract tables to Excel?",
            answer:
              "Use PDF to Excel with advanced table detection algorithms. It converts document tables into formatted spreadsheet rows and columns (.xlsx). Note that best results require PDFs with clear tabular structures.",
          },
          {
            id: "pdf-to-powerpoint",
            question: "How do I convert PDF to PowerPoint?",
            answer:
              "Use PDF to PowerPoint to turn PDF pages into presentation slides. Each page is converted into a high-quality presentation asset ready for slide decks.",
          },
          {
            id: "pdf-to-jpg",
            question: "How do I convert PDF to JPG?",
            answer:
              "Use PDF to JPG to extract every page as a high-resolution image. If your PDF has multiple pages, the resulting images are packaged in a convenient ZIP file.",
          },
          {
            id: "heic-to-jpg",
            question: "How do I convert HEIC to JPG?",
            answer:
              "Use the HEIC to JPG tool. Upload your Apple photos, choose the quality, and download the standard JPG files (packaged in a ZIP).",
          },
        ],
      },
      {
        id: "security-edit",
        title: "Security & Edit",
        items: [
          {
            id: "protect-pdf",
            question: "How do I protect a PDF?",
            answer:
              "Use Protect PDF to encrypt your file with a password using robust AES-256 encryption. You can also restrict user permissions such as printing, content copying, or form editing.",
          },
          {
            id: "unlock-pdf",
            question: "How do I unlock a PDF?",
            answer:
              "Use Unlock PDF to permanently remove password restrictions from your file. You must know the current password to unlock the document; we do not crack passwords.",
          },
          {
            id: "sign-pdf",
            question: "How do I sign a PDF?",
            answer:
              "Use Sign PDF to draw your signature directly on the canvas, type your initials, or upload an image file of your signature. You can position and scale signatures across any page.",
          },
          {
            id: "redact-pdf",
            question: "How do I redact text?",
            answer:
              "Use Redact PDF to permanently black out sensitive information. Unlike simple visual covers, the redacted text and underlying metadata are physically removed from the file.",
          },
          {
            id: "add-page-numbers",
            question: "How do I add page numbers?",
            answer:
              "Use Add Page Numbers to insert numbering across your document. You can customize the positioning (header/footer), formatting (e.g., 'Page 1 of 10'), and typography.",
          },
          {
            id: "add-watermark",
            question: "How do I add a watermark?",
            answer:
              "Use Add Watermark to stamp text or image watermarks onto your PDF pages. You can adjust placement, rotation, and opacity to protect proprietary documents.",
          },
          {
            id: "crop-pdf",
            question: "How do I crop a PDF?",
            answer:
              "Use Crop PDF to trim margins by adjusting the bounding box of your pages. This removes excess whitespace and optimizes documents for mobile screens or printing.",
          },
          {
            id: "pdf-forms",
            question: "How do I fill PDF forms?",
            answer:
              "Use PDF Forms to fill out interactive form fields directly in your browser. You can flatten the form once complete to ensure answers cannot be modified.",
          },
          {
            id: "compare-pdf",
            question: "How do I compare two PDFs?",
            answer:
              "Use Compare PDF to highlight visual and textual differences between two versions of a document. It makes revisions and draft alterations instantly recognizable.",
          },
        ],
      },
    ],
  },
  id: {
    title: "Pusat Bantuan & Tanya Jawab",
    description: "Panduan lengkap dan jawaban mendalam mencakup seluruh alat PDF PageLabs, keamanan file, batasan operasi, dan fitur pemrosesan.",
    categoriesLabel: "Kategori",
    onThisPageLabel: "Di halaman ini",
    categories: [
      {
        id: "general-privacy",
        title: "Umum & Privasi",
        items: [
          {
            id: "are-files-safe",
            question: "Apakah file saya aman?",
            answer:
              "Ya. Semua proses transfer file diamankan menggunakan enkripsi HTTPS. Kami tidak menganalisis, membagikan, atau menjual dokumen Anda kepada pihak ketiga. Berkas diproses dalam lingkungan komputasi yang terisolasi.",
          },
          {
            id: "keep-copy",
            question: "Apakah Anda menyimpan salinan file saya?",
            answer:
              "Tidak. File otomatis dihapus permanen dari server kami 2 jam setelah pemrosesan selesai. Anda juga dapat langsung menghapusnya secara manual segera setelah mengunduh hasilnya. Kami tidak menyimpan berkas cadangan.",
          },
          {
            id: "need-account",
            question: "Apakah saya perlu membuat akun?",
            answer:
              "Tidak. PageLabs sepenuhnya gratis dan tidak membutuhkan pendaftaran, akun pengguna, atau kartu kredit. Anda dapat langsung menggunakan semua alat tanpa hambatan.",
          },
          {
            id: "max-file-size",
            question: "Berapa batas ukuran file maksimum?",
            answer:
              "Batas maksimal adalah 100MB per file, dengan maksimal 20 file dalam satu kali operasi. Batasan ini diterapkan untuk menjaga kecepatan proses dan mencegah server kelebihan beban.",
          },
        ],
      },
      {
        id: "organize-manage",
        title: "Atur & Kelola",
        items: [
          {
            id: "merge-pdf",
            question: "Bagaimana cara menggabungkan PDF?",
            answer:
              "Unggah beberapa file ke alat Merge PDF, seret thumbnail ke urutan yang Anda inginkan, lalu klik Gabungkan. Anda dapat menyatukan banyak dokumen menjadi satu file PDF utuh dalam beberapa detik.",
          },
          {
            id: "split-pdf",
            question: "Bagaimana cara memisahkan PDF?",
            answer:
              "Gunakan alat Split PDF untuk membagi dokumen Anda. Anda dapat memisahkan berdasarkan rentang halaman kustom, interval halaman tetap, atau mengekstrak halaman tertentu untuk diunduh terpisah.",
          },
          {
            id: "remove-pages",
            question: "Bagaimana cara menghapus halaman?",
            answer:
              "Gunakan alat Remove Pages, tentukan atau pilih nomor halaman yang ingin Anda buang, lalu jalankan proses. Alat ini akan menghasilkan file PDF baru yang hanya memuat halaman yang Anda pertahankan.",
          },
          {
            id: "extract-pages",
            question: "Bagaimana cara mengekstrak halaman?",
            answer:
              "Gunakan alat Extract Pages untuk mengambil halaman tertentu menjadi dokumen PDF baru. Anda dapat memilih untuk menggabungkan seluruh halaman yang diekstrak menjadi satu file atau memisahkannya.",
          },
          {
            id: "reorder-pages",
            question: "Bagaimana cara menyusun ulang halaman?",
            answer:
              "Gunakan alat Organize PDF untuk menata urutan halaman secara visual lewat drag and drop, memutar orientasi, atau menghapus halaman. Anda juga dapat menambahkan PDF lain ke kanvas visual ini.",
          },
          {
            id: "rotate-pdf",
            question: "Bagaimana cara memutar PDF?",
            answer:
              "Gunakan alat Rotate PDF untuk memutar seluruh halaman atau halaman tertentu sebesar 90, 180, atau 270 derajat. Alat ini memperbaiki orientasi scan yang terbalik secara permanen.",
          },
          {
            id: "scan-to-pdf",
            question: "Apa fungsi dari Scan to PDF?",
            answer:
              "Scan to PDF mengonversi foto atau file gambar hasil pemindaian (JPG/PNG) menjadi satu dokumen PDF rapi. Anda dapat mengatur ulang urutan gambar dan rotasinya sebelum mengekspor.",
          },
        ],
      },
      {
        id: "optimize-repair",
        title: "Optimasi & Perbaikan",
        items: [
          {
            id: "compress-pdf",
            question: "Bagaimana cara mengompres PDF?",
            answer:
              "Gunakan alat Compress PDF untuk merampingkan ukuran file. Mode 'Direkomendasikan' menjaga keseimbangan kualitas gambar dan ukuran, sedangkan mode 'Ekstrem' mengecilkan ukuran semaksimal mungkin untuk kemudahan pengiriman email.",
          },
          {
            id: "repair-pdf",
            question: "Bagaimana cara memperbaiki PDF yang rusak?",
            answer:
              "Gunakan alat Repair PDF untuk menganalisis dan memulihkan dokumen yang rusak atau tidak bisa dibuka. Mesin pemrosesan akan merekonstruksi struktur xref tabel PDF dan memulihkan konten yang masih utuh.",
          },
          {
            id: "ocr-pdf",
            question: "Bagaimana cara kerja OCR?",
            answer:
              "OCR PDF (Optical Character Recognition) memindai teks dalam bentuk gambar dan menjadikannya teks yang dapat dicari dan dipilih. Fitur ini mendukung berbagai bahasa dan menyematkan lapisan teks tak terlihat langsung pada dokumen.",
          },
          {
            id: "pdf-to-pdfa",
            question: "Apa itu PDF to PDF/A?",
            answer:
              "PDF to PDF/A mengonversi dokumen PDF Anda ke format standar ISO yang dirancang untuk pengarsipan jangka panjang. Format ini menyematkan semua font, profil warna, dan metadata sehingga file tetap terbaca sempurna puluhan tahun ke depan.",
          },
        ],
      },
      {
        id: "convert-to-pdf",
        title: "Konversi Ke PDF",
        items: [
          {
            id: "word-to-pdf",
            question: "Bagaimana cara mengonversi Word ke PDF?",
            answer:
              "Gunakan alat Word to PDF untuk mengubah file .docx dan .doc dengan mempertahankan tata letak, jenis huruf, dan gambar secara presisi. Hasil konversi berupa dokumen vektor berkualitas tinggi.",
          },
          {
            id: "excel-to-pdf",
            question: "Bagaimana cara mengonversi Excel ke PDF?",
            answer:
              "Gunakan alat Excel to PDF untuk mengonversi spreadsheet (.xlsx dan .xls). Dokumen ditata rapi dan Anda dapat menyesuaikan lembar kerja agar pas dengan lebar halaman cetak.",
          },
          {
            id: "powerpoint-to-pdf",
            question: "Bagaimana cara mengonversi PowerPoint ke PDF?",
            answer:
              "Gunakan alat PowerPoint to PDF untuk mengubah presentasi .pptx dan .ppt menjadi slide PDF. Seluruh geometri slide, tipografi, dan grafik akan dipertahankan dengan akurat.",
          },
          {
            id: "jpg-to-pdf",
            question: "Bagaimana cara mengonversi JPG ke PDF?",
            answer:
              "Gunakan alat JPG to PDF untuk menyusun banyak gambar menjadi dokumen PDF. Anda dapat mengunggah banyak gambar, mengatur urutannya, serta menyesuaikan ukuran kertas dan margin.",
          },
          {
            id: "html-to-pdf",
            question: "Bagaimana cara mengonversi HTML ke PDF?",
            answer:
              "Gunakan alat HTML to PDF untuk mengubah dokumen HTML statis menjadi format PDF. Tampilan web dirender secara utuh untuk kebutuhan dokumentasi dan bacaan offline.",
          },
        ],
      },
      {
        id: "convert-from-pdf",
        title: "Konversi Dari PDF",
        items: [
          {
            id: "pdf-to-word",
            question: "Bagaimana cara mengonversi PDF ke Word?",
            answer:
              "Gunakan alat PDF to Word untuk mengekstrak isi PDF menjadi dokumen .docx yang dapat diedit. Jika PDF merupakan hasil scan, aktifkan opsi OCR untuk mengubah gambar teks menjadi paragraf tulisan yang dapat diedit.",
          },
          {
            id: "pdf-to-excel",
            question: "Bagaimana cara mengekstrak tabel ke Excel?",
            answer:
              "Gunakan alat PDF to Excel yang dilengkapi deteksi tabel pintar. Alat ini mengonversi tabel PDF menjadi baris dan kolom spreadsheet (.xlsx). Hasil terbaik didapatkan dari dokumen dengan struktur tabel yang jelas.",
          },
          {
            id: "pdf-to-powerpoint",
            question: "Bagaimana cara mengonversi PDF ke PowerPoint?",
            answer:
              "Gunakan alat PDF to PowerPoint untuk mengubah lembaran PDF menjadi slide presentasi. Setiap halaman dirender sebagai elemen visual berkualitas tinggi yang siap dipresentasikan.",
          },
          {
            id: "pdf-to-jpg",
            question: "Bagaimana cara mengonversi PDF ke JPG?",
            answer:
              "Gunakan alat PDF to JPG untuk mengekstrak setiap halaman PDF menjadi gambar resolusi tinggi. Jika dokumen memiliki banyak halaman, berkas gambar akan otomatis dikemas dalam file ZIP.",
          },
          {
            id: "heic-to-jpg",
            question: "Bagaimana cara mengonversi HEIC ke JPG?",
            answer:
              "Gunakan alat HEIC to JPG. Unggah foto Apple Anda, pilih kualitas, dan unduh file JPG standar (dikemas dalam ZIP).",
          },
        ],
      },
      {
        id: "security-edit",
        title: "Keamanan & Edit",
        items: [
          {
            id: "protect-pdf",
            question: "Bagaimana cara melindungi dokumen PDF?",
            answer:
              "Gunakan alat Protect PDF untuk mengenkripsi berkas Anda dengan kata sandi menggunakan enkripsi AES-256. Anda juga dapat membatasi izin pengguna seperti mencetak, menyalin konten, atau mengedit formulir.",
          },
          {
            id: "unlock-pdf",
            question: "Bagaimana cara membuka kunci PDF?",
            answer:
              "Gunakan alat Unlock PDF jika Anda mengetahui kata sandinya. Anda wajib memasukkan kata sandi yang benar untuk menghapus proteksi; kami tidak menyediakan fitur peretasan kata sandi.",
          },
          {
            id: "sign-pdf",
            question: "Bagaimana cara menandatangani PDF?",
            answer:
              "Gunakan alat Sign PDF untuk menggambar tanda tangan langsung, mengetik inisial nama, atau mengunggah gambar tanda tangan transparan. Anda dapat meletakkan tanda tangan di halaman mana pun.",
          },
          {
            id: "redact-pdf",
            question: "Bagaimana cara menyensor teks (redact)?",
            answer:
              "Gunakan alat Redact PDF untuk menghapus dan menghitamkan informasi sensitif secara permanen. Berbeda dari sekadar menutup warna, teks yang disensor dan metadata di bawahnya benar-benar dihapus dari berkas.",
          },
          {
            id: "add-page-numbers",
            question: "Bagaimana cara menambahkan nomor halaman?",
            answer:
              "Gunakan alat Add Page Numbers untuk menyematkan penomoran pada dokumen. Anda dapat menentukan posisi penomoran, format tampilan (misal: 'Halaman 1 dari 10'), dan gaya font.",
          },
          {
            id: "add-watermark",
            question: "Bagaimana cara menambahkan watermark?",
            answer:
              "Gunakan alat Add Watermark untuk menempelkan stempel teks atau logo gambar pada halaman PDF dengan tingkat transparansi yang dapat disesuaikan.",
          },
          {
            id: "crop-pdf",
            question: "Bagaimana cara memotong margin PDF (crop)?",
            answer:
              "Gunakan alat Crop PDF untuk memangkas margin kosong dengan menyesuaikan kotak batas halaman. Ini membantu merapikan dokumen saat dibaca di layar ponsel atau dicetak.",
          },
          {
            id: "pdf-forms",
            question: "Bagaimana cara mengisi formulir PDF?",
            answer:
              "Gunakan alat PDF Forms untuk mengisi kolom formulir interaktif langsung di browser. Anda dapat meratakan (flatten) formulir setelah selesai agar data tidak dapat diubah lagi.",
          },
          {
            id: "compare-pdf",
            question: "Bagaimana cara membandingkan dua file PDF?",
            answer:
              "Gunakan alat Compare PDF untuk melihat perbedaan teks dan visual antara dua versi dokumen secara berdampingan. Alat ini memudahkan peninjauan revisi kontrak atau naskah.",
          },
        ],
      },
    ],
  },
};
