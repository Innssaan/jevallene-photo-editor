# JEVALLENE PHOTO EDITOR

## PRODUCT REQUIREMENTS DOCUMENT (PRD)

- **Version:** 1.0
- **Product Name:** Jevallene Photo Editor
- **Product Type:** All-in-One AI Photo Editing & Image Tools
- **Platform:** Responsive Web Application
- **Target Devices:** Desktop, Tablet, Mobile
- **Account Requirement:** No Login / No Registration
- **Theme:** Light Mode & Dark Mode
- **Document Status:** Product Specification

---

## 1. PROJECT OVERVIEW

### 1.1 Product Description

Jevallene Photo Editor adalah platform web All-in-One Photo Editing yang menyediakan berbagai alat pengeditan gambar, manipulasi foto, AI Image Processing, dan image utilities dalam satu tempat.

Platform ini dirancang agar pengguna dapat mengedit, memperbaiki, mengubah, dan membuat gambar dengan mudah tanpa harus menginstal aplikasi tambahan atau membuat akun.

Jevallene Photo Editor menggabungkan fitur pengeditan foto konvensional dengan teknologi Artificial Intelligence untuk memberikan pengalaman editing yang praktis, modern, dan efisien.

Pengguna dapat mengakses berbagai tools melalui satu dashboard dengan navigasi sederhana, pencarian tools, kategori fitur, dan workflow yang konsisten.

### 1.2 Product Vision

Menjadi platform photo editing berbasis web yang menyediakan berbagai kebutuhan pengolahan gambar dalam satu ekosistem yang mudah digunakan, cepat, dan dapat diakses siapa saja.

### 1.3 Product Objectives

- Menyediakan berbagai photo editing tools dalam satu platform.
- Mempermudah pengguna menemukan tools yang dibutuhkan.
- Mengurangi kebutuhan menginstal aplikasi editing tambahan.
- Mengintegrasikan AI untuk meningkatkan kemampuan pengeditan gambar.
- Menyediakan pengalaman penggunaan tanpa login.
- Memastikan tampilan responsif di berbagai ukuran perangkat.
- Memberikan pengalaman editing yang intuitif bagi pemula maupun pengguna berpengalaman.

### 1.4 Target Audience

- Pengguna umum yang membutuhkan editing foto sederhana.
- Content creator.
- Social media users.
- Online sellers dan pemilik bisnis.
- Designer pemula.
- Pengguna yang membutuhkan foto formal atau paspor.
- Pengguna yang membutuhkan AI image processing.
- Pengguna yang membutuhkan image conversion dan compression.

---

## 2. PROBLEM & GOALS

### 2.1 Problems

Pengguna sering menghadapi beberapa kendala ketika mengolah gambar:

1. Harus menggunakan banyak aplikasi berbeda untuk kebutuhan editing yang berbeda.
2. Beberapa layanan mengharuskan pengguna membuat akun.
3. Banyak tools memiliki navigasi yang membingungkan.
4. Proses editing sederhana terkadang membutuhkan software yang terlalu kompleks.
5. Pengguna kesulitan menemukan tools tertentu.
6. Beberapa layanan membatasi ukuran file atau format gambar.
7. Tidak semua pengguna memiliki kemampuan desain grafis.

### 2.2 Goals

Jevallene Photo Editor bertujuan menyelesaikan masalah tersebut dengan:

- Menyatukan berbagai tools dalam satu platform.
- Menyediakan akses tanpa akun.
- Menyediakan fitur pencarian tools.
- Menggunakan navigasi yang sederhana.
- Menyediakan workflow yang konsisten.
- Menyediakan preview sebelum hasil diunduh.
- Menyediakan berbagai pilihan format export.
- Menggunakan AI untuk membantu pekerjaan editing yang lebih kompleks.

### 2.3 Success Metrics

- Pengguna dapat menemukan tools dengan cepat.
- Pengguna dapat menyelesaikan proses editing tanpa kebingungan.
- Tingkat keberhasilan upload dan export tinggi.
- Waktu pemrosesan gambar efisien.
- Navigasi nyaman digunakan di desktop maupun mobile.
- Error processing ditangani dengan informasi yang jelas.

---

## 3. CORE CONCEPT

### 3.1 Main Concept

Jevallene Photo Editor menggunakan pendekatan Tool-Based Application. Setiap fitur disediakan sebagai tools tersendiri yang memiliki halaman atau workspace masing-masing.

Pengguna dapat:

1. Membuka dashboard.
2. Mencari atau memilih tools.
3. Mengunggah gambar.
4. Melakukan pengeditan.
5. Melihat hasil preview.
6. Mengunduh hasil akhir.

### 3.2 Core Principles

- **Easy to Use:** Semua fitur harus mudah dipahami tanpa membutuhkan pengalaman editing profesional.
- **No Account Required:** Pengguna tidak diwajibkan membuat akun, login, atau melakukan registrasi.
- **Discoverable Tools:** Pengguna dapat menemukan fitur melalui pencarian dan kategori.
- **Consistent Workflow:** Setiap tools memiliki pola penggunaan yang konsisten.
- **Privacy Focused:** File pengguna harus diproses dengan memperhatikan keamanan dan privasi.
- **Responsive Experience:** Platform harus nyaman digunakan melalui desktop, tablet, dan smartphone.

### 3.3 User Workflow

1. User membuka Jevallene Photo Editor.
2. User memilih tools melalui dashboard atau search.
3. User mengunggah gambar.
4. Sistem memvalidasi file.
5. User mengatur parameter editing.
6. Sistem memproses gambar.
7. User melihat hasil.
8. User dapat mengedit ulang atau mengunduh hasil.

---

## 4. FEATURES & FUNCTIONALITIES

### 4.1 Dashboard / Home

Dashboard merupakan halaman utama aplikasi.

Fitur:

- Brand logo dan nama aplikasi.
- Main navigation.
- Search tools.
- Upload image shortcut.
- Quick access tools.
- Popular tools.
- Recently used tools.
- Tool categories.
- Featured AI tools.
- Recent projects jika tersedia dalam penyimpanan lokal/session.

Dashboard harus memudahkan pengguna menemukan fitur tanpa harus melewati banyak halaman.

### 4.2 Tool Search

Fitur pencarian digunakan untuk menemukan tools dengan cepat.

Functionalities:

- Search berdasarkan nama tools.
- Search berdasarkan keyword.
- Search suggestions.
- Recent searches.
- Filter kategori.
- Menampilkan hasil yang relevan.
- Empty state.
- No results state.

Contoh: Pengguna mengetik `"background"`, sistem menampilkan: Remove Background, Change Background, Background Blur, Transparent Background.

### 4.3 Background Tools

#### A. Remove Background
Menghapus background gambar secara otomatis menggunakan AI atau teknologi background segmentation.
- Upload image, automatic background removal, preview before and after, transparent background preview, edge refinement jika didukung, download PNG, replace background shortcut.

#### B. Change Background
Mengganti background gambar.
- Upload image, background removal, select background color, upload custom background, background image library jika tersedia, preview, export.

#### C. Transparent Background
Menghasilkan gambar dengan background transparan.
- Upload image, background removal, transparency checkerboard, PNG export.

#### D. Background Blur
Memberikan efek blur pada background.
- Automatic subject detection, blur intensity, preview, export.

### 4.4 Photo Editing Tools

- **A. Crop & Rotate:** Crop image, free crop, aspect ratio presets, rotate, flip horizontal, flip vertical, reset.
- **B. Image Adjustments:** Brightness, contrast, saturation, exposure, temperature, tint, highlights, shadows, sharpness.
- **C. Filters:** Preset filters, filter intensity, preview, reset.
- **D. Add Text:** Add text, font selection, font size, font color, text alignment, text positioning, text outline atau shadow jika didukung.
- **E. Stickers & Elements:** Sticker library, shapes, decorative elements, resize, rotate, position adjustment.
- **F. Watermark:** Add text watermark, upload image watermark, opacity, position, size.
- **G. Border:** Border width, border color, border style, preview.
- **H. Rounded Corners:** Corner radius, preview, export.
- **I. Editing History:** Undo, redo, reset, before/after preview, layer management jika editor mendukung sistem layer.

### 4.5 AI Image Tools

- **A. AI Image Enhancer:** Upload image, automatic enhancement, preview, before/after comparison, download.
- **B. Image Upscaler:** 2x upscaling, 4x upscaling jika didukung, resolution preview, download.
- **C. Image Denoiser:** Noise reduction, intensity adjustment jika didukung, preview, export.
- **D. Object Remover:** Brush selection, eraser, object selection, processing, result preview.
- **E. Image Sharpen:** Sharpness adjustment, preview, export.
- **F. Face Enhancement:** Face detection, face enhancement, preview, export.
- **G. Image Colorizer:** Upload black and white image, AI colorization, preview, download.
- **H. Photo Restoration:** Upload old photo, restoration processing, preview, download.
- **I. AI Photo to Cartoon:** Upload image, cartoon style selection, processing, preview, download.
- **J. AI Image Generator:** Prompt input, style selection, aspect ratio, image generation settings, generate button, generated image gallery, regenerate, download, open in Photo Editor.

> **Catatan:** AI model dan provider belum ditentukan. Integrasi harus disesuaikan dengan provider yang nantinya dipilih.

### 4.6 Image Utilities

- **A. Image Resizer:** Resize by width, resize by height, custom dimensions, maintain aspect ratio, preset dimensions.
- **B. Image Compressor:** Compression level, target file size jika didukung, quality adjustment, original size information, compressed size information, download.
- **C. Image Converter:** Supported formats: JPG/JPEG, PNG, WEBP, BMP, TIFF, GIF (jika didukung).
- **D. Image to PDF:** Upload image, multiple image support, page size, orientation, margin, image positioning, export PDF.
- **E. Metadata Viewer:** File name, file type, file size, image dimensions, color information, EXIF metadata (jika tersedia).
- **F. Color Picker:** Upload image, select pixel color, HEX, RGB, HSL (jika didukung), copy color value.
- **G. Image Splitter:** Grid selection, number of rows, number of columns, preview, download individual images, download ZIP.
- **H. Flip Image:** Horizontal flip, vertical flip, preview, export.

### 4.7 Creative & Specialized Tools

- **A. AI Product Photo:** Upload product image, background selection, scene selection, lighting style, environment selection, preview, generate, download. *(Hasil AI dapat mengubah detail produk; pengguna harus memeriksa kesesuaian dengan produk asli.)*
- **B. Passport Photo Maker:** Upload photo, background removal, background color, configurable photo dimensions, portrait positioning, crop adjustment, preview, export. *(Ukuran harus dapat dikonfigurasi berdasarkan negara/instansi; hasil tidak menjamin penerimaan resmi.)*
- **C. Profile Picture Maker:** Upload photo, background selection, shape selection, circle crop, border, shadow, preview, export.
- **D. Photo Collage Maker:** Multiple image upload, collage templates, grid layouts, spacing adjustment, border adjustment, background color, image positioning, preview, export.
- **E. ID Photo Background:** Upload image, automatic background removal, background color, edge refinement, preview, export.
- **F. Photo Frame:** Frame gallery, frame categories, frame preview, border adjustment, image positioning, export.
- **G. Meme Generator:** Upload image, meme templates, add top text, add bottom text, font selection, text size, text positioning, export.
- **H. Social Media Resizer:** Upload image, platform selection, preset dimensions, aspect ratio, crop preview, position adjustment, export.

---

## 5. UI/UX DIRECTION

### 5.1 Design Philosophy

Modern, Minimalist, Professional, Premium, User-friendly, Clean, Intuitive, Visually engaging. Hindari desain yang terlalu ramai atau dekoratif berlebihan.

### 5.2 Visual Direction

Pendekatan **Premium Creative Studio**: clean layout, refined typography, balanced whitespace, subtle shadows, consistent borders, elegant colors, carefully designed tool cards, professional image previews, consistent iconography.

### 5.3 Theme System

- **Light Mode:** Warm off-white background, white surface, dark charcoal text, muted gray secondary text, subtle neutral borders.
- **Dark Mode:** Deep charcoal background, slightly lighter surface, soft white text, muted gray secondary text, subtle dark borders.
- Pilihan tema tersimpan secara lokal (`localStorage`).

### 5.4 Navigation Structure

- **Desktop Sidebar:** Main (Home, All Tools, AI Tools, Background Tools, Photo Editor, Image Utilities, Creative Tools) & Additional (Recent Projects, Favorites, Settings).
- **Top Navigation:** Search, Theme switcher, Settings shortcut.
- Sidebar dapat di-collapse; mobile memiliki navigasi adaptif.

### 5.5 Dashboard Layout

1. Welcome section
2. Search tools
3. Upload image shortcut
4. Quick actions
5. Popular tools
6. Tool categories
7. Featured AI tools
8. Recent projects

### 5.6 Editor Workspace

- **Desktop:** Top Toolbar (Back, Tool name, Undo, Redo, Before/After, Reset, Export), Left Panel (Editing tools & options), Center Canvas (Main image preview, transparent checkerboard, zoom, fit to screen), Right Panel (Properties, adjustments, layer settings, export options).
- **Mobile:** Image preview sebagai fokus utama, bottom toolbar, touch-friendly controls, bottom sheet untuk pengaturan, navigasi sederhana.

---

## 6. TECHNOLOGY STACK

- **Frontend:** React, Next.js / Vite, TypeScript, Tailwind CSS.
- **Image Processing:** HTML Canvas API, Web Workers, WebAssembly, Sharp (jika server-side), browser-based image processing libraries.
- **Storage:** Temporary processing storage, browser `localStorage` untuk preferensi, `IndexedDB` untuk data lokal, tanpa cloud storage permanen / sinkronisasi antarperangkat.
- **AI Integration:** Arsitektur modular agar dapat dihubungkan ke berbagai provider; API keys wajib di server, bukan di frontend.
- **PWA Support:** Installable web app, app manifest, service worker, static asset caching, basic offline experience.

---

## 7. DEVELOPMENT ROADMAP

- **Phase 1 — Foundation & MVP (P0):** Project setup, design system, responsive app shell, home dashboard, sidebar navigation, tool search, All Tools page, Light & Dark Mode, image upload manager, preview, basic image editor (Crop & Rotate, Adjustments), Image Resizer, Image Compressor, Image Converter, Export system, Error handling.
- **Phase 2 — Core Image Tools (P1):** Remove/Change/Transparent/Blur Background, Filters, Add Text, Watermark, Border, Rounded Corners, Image to PDF, Metadata Viewer, Color Picker, Image Splitter.
- **Phase 3 — AI Features (P1/P2):** AI Image Enhancer, Upscaler, Denoiser, Object Remover, Sharpen, Face Enhancement, Colorizer, Photo Restoration, AI Photo to Cartoon, AI Image Generator.
- **Phase 4 — Creative Tools (P1/P2):** AI Product Photo, Passport Photo Maker, Profile Picture Maker, Photo Collage Maker, ID Photo Background, Photo Frame, Meme Generator, Social Media Resizer.
- **Phase 5 — Optimization:** Performance, batch processing, ZIP download, mobile experience, PWA, accessibility, browser compatibility, security review, error monitoring.

---

## 8. ADDITIONAL NOTES

### 8.1 No Login Policy
Tidak membutuhkan akun, login, registrasi, atau verifikasi email.

### 8.2 File Upload & Validation
Validasi format file, ukuran file, dimensi gambar, unsupported files, dan corrupted files dengan pesan error yang jelas.

### 8.3 File Privacy & Security
HTTPS, validasi sisi server (jika diproses di server), batasan ukuran upload, temporary storage dengan penghapusan berkala, transparansi jika gambar dikirim ke AI pihak ketiga, dan tidak menampilkan API credentials di frontend.

### 8.4 Processing Experience
Status proses: `Waiting`, `Uploading`, `Processing`, `Completed`, `Failed`. Tidak menampilkan persentase progress palsu.

### 8.5 Export System
Preview hasil, pilih format output, atur kualitas & resolusi (jika didukung), unduh tunggal maupun batch.

### 8.6 Error Handling
Error state untuk upload failed, unsupported file, file too large, processing failed, AI service unavailable, network error, dan export failed.

### 8.7 Performance
Optimasi ukuran gambar, lazy loading, Web Workers untuk komputasi berat, non-blocking UI, dan manajemen memori mobile.

### 8.8 Important Implementation Rules
1. Jangan membuat tombol yang hanya terlihat berfungsi tetapi tidak memiliki fungsi.
2. Jangan membuat fitur palsu.
3. Jika suatu fitur belum diimplementasikan, tampilkan status yang jelas.
4. Jangan mengarang API atau AI provider.
5. Jangan menyimpan API keys di frontend.
6. Semua tools harus mengikuti design system yang konsisten.
7. Prioritaskan pengalaman pengguna dibanding dekorasi.
8. Jangan memaksa pengguna melewati halaman yang tidak diperlukan.
9. Pastikan seluruh navigasi dapat digunakan.
10. Pastikan layout responsif.

### 8.9 Acceptance Criteria
- Dashboard dapat digunakan.
- Pengguna dapat menemukan tools melalui search.
- Semua kategori memiliki navigasi yang jelas.
- Upload dan preview gambar berfungsi.
- Tools yang sudah dirilis dapat melakukan pemrosesan sesuai fungsinya.
- Export menghasilkan file yang benar.
- Light Mode dan Dark Mode berfungsi.
- Layout responsif.
- Error ditampilkan dengan jelas.
- Pengguna tidak perlu login.
- File pengguna ditangani sesuai kebijakan privasi.

---

*Jevallene Photo Editor — Your Creative Space for Every Image.*
