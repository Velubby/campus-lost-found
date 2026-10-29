# Campus Lost & Found

Portal layanan digital terpadu kampus untuk pencarian barang temuan, pelaporan barang hilang, pengajuan klaim kepemilikan, dan pelacakan proses serah terima barang dengan aman dan transparan.

---

## 🌟 Fitur Utama

### 1. Portal Pengguna (Mahasiswa & Civitas Kampus)
- **Katalog & Pencarian Barang Temuan (`/cari`):**
  - Pencarian cepat dengan filter kategori (Elektronik, Dokumen, Aksesoris, Tas, dll.).
  - Filter lokasi temuan kampus dan rentang waktu.
  - Sorting berdasarkan waktu ditemukan terbaru/terlama.
  - Modal detail barang & form pengajuan klaim kepemilikan langsung.
- **Form Pelaporan Cerdas (`/lapor`):**
  - Auto-switch form jenis laporan (*Barang Hilang* vs *Barang Temuan*) via URL parameter (`?type=hilang` / `?type=temuan`).
  - Unggah foto barang ke Supabase Storage (`item-images`) dengan validasi ukuran & format.
  - Popup modal konfirmasi sukses laporan dengan kode tiket dan tombol salin cepat.
- **Menu Laporan Saya (`/laporan-saya`):**
  - Navigasi tab terpisah: **Barang Hilang Saya**, **Barang Temuan Saya**, dan **Klaim Barang Temuan**.
  - Sub-filter status laporan (Semua, Menunggu Verifikasi, Sedang Dicari, Ditemukan, Selesai, Ditolak).
  - Banner notifikasi langsung jika barang hilang telah berhasil ditemukan oleh petugas.
- **Lacak Laporan Realtime (`/lacak`):**
  - Pelacak progres bertahap (Dibuat &rarr; Diverifikasi &rarr; Dicari &rarr; Ditemukan &rarr; Klaim &rarr; Serah Terima).
  - Riwayat aktivitas/log peristiwa terkini dan pemilih multi-laporan.
- **Profil & Akun Pengguna (`/pengaturan`):**
  - Pengaturan profil (nama lengkap, nomor telepon / WhatsApp) terintegrasi Supabase Auth.

### 2. Panel Petugas / Keamanan (`/admin`)
- **Dashboard Ringkasan Operasional:**
  - Monitoring metrik laporan baru, barang tersimpan, klaim pending, dan serah terima.
- **Pencatatan Rantai Penjagaan (*Chain of Custody*):**
  - Form pencatatan data identitas penemu saat barang diterima di pos satpam/petugas.
- **Verifikasi Klaim & SOP Keamanan:**
  - *Blind Verification SOP Checklist* untuk memastikan kecocokan ciri khusus sebelum klaim disetujui.
  - Dialog tolak klaim dengan pencatatan alasan penolakan.
  - Fitur **"Tinjau Kembali" (*Reopen*)** untuk memulihkan klaim yang ditolak jika terjadi missclick dari petugas.
- **Pemanggilan Pemilik & Serah Terima:**
  - Tombol panggil pemilik via WhatsApp otomatis dengan pesan pengingat lokasi & berkas yang harus dibawa.
  - Modal konfirmasi serah terima barang fisik kepada pemilik yang sah.

### 3. Tampilan & UI Modern
- Desain *Apple-inspired* bersih menggunakan palet *Campus Navy* (`#123356`).
- Dropdown form kustom (`select.form-input`) dengan ikon chevron SVG responsif.
- Identitas visual resmi kampus (`logo.svg`) pada Navbar, Footer, favicon, dan metadata aplikasi.

---

## 🛠️ Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Bahasa:** TypeScript
- **Styling:** Tailwind CSS & Vanilla CSS Design System
- **State & Data Fetching:** React Query (`@tanstack/react-query`)
- **UI Components:** Radix UI Dialog primitives & Lucide Icons
- **Backend & Auth:** [Supabase](https://supabase.com/) (PostgreSQL, Storage, Auth via `@supabase/ssr`)
- **Knowledge Graph:** Graphify AST & semantic code mapping

---

## 🚀 Menjalankan Aplikasi

### 1. Instalasi Dependensi
```bash
npm install
```

### 2. Konfigurasi Lingkungan (`.env.local`)
Salin berkas template lingkungan:
```bash
cp .env.example .env.local
```
Lalu lengkapi variabel berikut dari dashboard Supabase (**Project Settings > API**):
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

> **Catatan:** Tanpa konfigurasi Supabase, aplikasi tetap dapat dijalankan dalam mode preview lokal menggunakan mock data.

### 3. Menjalankan Server Pengembangan
```bash
npm run dev
```
Buka [http://localhost:3000](http://localhost:3000) pada peramban web Anda.

---

## 🗄️ Konfigurasi Database Supabase

1. Buka **SQL Editor** pada dashboard Supabase.
2. Jalankan skrip [supabase/schema.sql](file:///c:/ivan-dev/campus-lost-found/supabase/schema.sql) untuk membuat tabel:
   - `profiles` (Data profil civitas)
   - `reports` (Laporan barang hilang / temuan)
   - `report_events` (Riwayat timeline aktivitas)
   - `items` (Katalog barang temuan terdaftar)
   - `claims` (Klaim kepemilikan barang)
3. Jalankan skrip [supabase/catalog-policy.sql](file:///c:/ivan-dev/campus-lost-found/supabase/catalog-policy.sql) agar katalog barang temuan dapat diakses publik tanpa login.
4. Buat Storage Bucket publik bernama `item-images` untuk menampung unggahan foto barang (maksimal 5MB, format PNG/JPG/WEBP).
5. Pada menu **Authentication > Providers > Email**, Anda dapat menonaktifkan *Confirm Email* untuk kemudahan pengujian akun lokal.

---

## 🧪 Validasi & Pengujian

Jalankan perintah berikut untuk memeriksa build dan linting:
```bash
npm run build
npm run lint
```

Untuk memperbarui knowledge graph kode proyek:
```bash
python -m graphify update .
```
