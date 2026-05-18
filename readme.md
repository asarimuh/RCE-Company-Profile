# Rising Creators Entertainment - Company Profile Website

Website profil perusahaan resmi untuk **Rising Creators Entertainment**, sebuah agensi *live entertainment* inovatif yang berbasis di Indonesia. Website ini dirancang dengan pendekatan modern, performa tinggi, dan tata letak multi-halaman (*multi-page layout*) yang responsif.

## 🚀 Fitur Utama

- **Desain Modern & Responsif:** Pengalaman visual yang konsisten di semua perangkat (Desktop, Tablet, dan Mobile) menggunakan *Fluid Typography* (`clamp`).
- **Arsitektur CSS Modular:** Pemisahan file CSS per halaman (`src/css/pages/`) untuk menjaga kerapian kode dan performa *bundle size* yang optimal.
- **Struktur Multi-Halaman Kontemporer:**
  - **Beranda (Homepage):** Menampilkan Hero, About Us, Services, Talents, Gallery, Blog, FAQ, dan Kontak dalam satu alur yang intuitif.
  - **Detail Layanan:** Halaman khusus dengan layout terpadu (*unified background*) untuk *Digital Entertainment*, *Corporate & Legal Solutions*, dan *E-Commerce*.
  - **Artikel Blog Edukatif:** Desain artikel panjang (*long-form content*) yang dioptimalkan untuk kenyamanan membaca (*high readability*).
- **Ramah SEO:** Penggunaan HTML Semantik yang tepat (seperti tag `<article>`) untuk memudahkan indeksasi oleh Googlebot.
- **Vite & Rollup Bundler:** Konfigurasi kustom untuk manajemen aset statis dan kompilasi multi-halaman otomatis.

---

## 🛠️ Stas & Teknologi

- **Core:** HTML5, CSS3, JavaScript (ES6+)
- **Build Tool:** [Vite](https://vite.dev/)
- **Bundler:** Rollup
- **Fonts:** Montserrat & Poppins (via Google Fonts)

---

## 📁 Struktur Folder Proyek

```text
├── dist/                        # File hasil produksi siap deploy
├── src/                         # Kode sumber aplikasi
│   ├── css/                     # Folder manajemen gaya (Styling)
│   │   ├── components/          # CSS Komponen global (Navbar, Footer)
│   │   ├── layouts/             # CSS Struktur section beranda
│   │   ├── pages/               # CSS Khusus untuk sub-pages (Services & Blog)
│   │   └── main.css             # Master CSS File
│   ├── js/
│   │   └── main.js              # Script utama aplikasi
│   ├── pages/                   # Folder halaman terpisah (Sub-pages)
│   │   ├── blog/                # Detail Artikel Blog (e.g., teknik-vokal.html)
│   │   └── services/            # Detail Layanan (e.g., e-commerce.html)
│   ├── public/                  # Aset statis yang tidak diproses Vite
│   │   └── assets/              # Logo, Icon, dan Gambar Background
│   └── index.html               # Halaman Utama (Beranda)
├── package.json                 # Dependensi & script proyek
└── vite.config.js               # Konfigurasi rute multi-halaman Vite