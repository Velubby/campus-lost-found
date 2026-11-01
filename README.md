# Lost & Found

Aplikasi untuk melaporkan barang hilang atau temuan, mengajukan klaim kepemilikan, dan mengikuti proses pengembaliannya.

## Tentang aplikasi

Informasi barang hilang dan temuan dikumpulkan di satu tempat agar pengguna dapat mencari barang dan memantau laporannya. Pengguna memberikan ciri kepemilikan saat mengajukan klaim, lalu petugas memeriksa informasi tersebut dan mengatur pengambilan barang.

## Fitur utama

### Untuk pengguna

- Mencari barang temuan berdasarkan kata kunci, kategori, lokasi, dan tanggal, dengan urutan terbaru atau terlama.
- Melaporkan barang hilang atau temuan beserta keterangan dan foto opsional.
- Mengajukan klaim dengan ciri khusus barang serta melihat laporan, klaim, perkembangan, dan riwayatnya.
- Menjadwalkan pengambilan untuk klaim yang disetujui dan melihat tiket pengambilan.
- Mengubah profil dan nomor telepon; informasi akademik bersifat opsional.

### Untuk petugas

- Meninjau laporan kehilangan dan memeriksa ciri kepemilikan pada klaim.
- Menyetujui, menolak, atau meninjau kembali klaim, serta menentukan lokasi pengambilan.
- Mencatat penemu dan lokasi penyimpanan barang, serta menyelesaikan proses penyerahan pada laporan kehilangan.

## Cara kerja

1. Pengguna masuk dan membuat laporan barang hilang atau temuan.
2. Barang yang dilaporkan ditemukan masuk ke katalog agar dapat dicari oleh pemiliknya.
3. Pemilik mengajukan klaim dengan menjelaskan ciri khusus barang dan memberikan nomor yang dapat dihubungi.
4. Petugas memeriksa informasi kepemilikan, memutuskan klaim, dan menentukan lokasi pengambilan jika disetujui.
5. Pemilik dengan klaim yang disetujui memilih jadwal, lalu menunjukkan tiket saat mengambil barang di lokasi yang ditentukan.

## Teknologi

Next.js, React, TypeScript, Tailwind CSS, TanStack Query, Radix UI, dan Supabase (PostgreSQL, Auth, Storage).

## Menjalankan di komputer sendiri

Siapkan Node.js, npm, dan proyek Supabase.

### 1. Clone dan instal dependensi

```bash
git clone https://github.com/Velubby/campus-lost-found.git
cd campus-lost-found
npm install
```

### 2. Buat `.env.local`

Isi dengan URL proyek dan publishable key dari dashboard Supabase, bukan service-role key:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

### 3. Siapkan Supabase

Pada proyek Supabase baru, jalankan [supabase/schema.sql](supabase/schema.sql) melalui SQL Editor. Skrip ini membuat tabel, aturan akses, trigger profil dan laporan, serta bucket foto publik `item-images`.

[supabase/catalog-policy.sql](supabase/catalog-policy.sql) adalah patch kebijakan katalog untuk instalasi lama. Jalankan setelah schema tersedia jika instalasi lama belum mengizinkan pembacaan katalog publik; patch ini tidak diperlukan setelah memasang `schema.sql` terbaru.

Gunakan provider Email untuk pendaftaran dan login email/password. Pengaturan **Confirm email** menentukan apakah pengguna harus mengonfirmasi email sebelum masuk. Login Google juga tersedia di kode, tetapi memerlukan konfigurasi provider Google dan izin URL pengalihan `http://localhost:3000/auth/callback` di Supabase.

Pada proyek Supabase yang digunakan saat ini, **Confirm email** dinonaktifkan dan provider Google sudah diaktifkan. Jika membuat proyek Supabase sendiri, konfigurasi autentikasi perlu diatur kembali melalui dashboard; pengaturan ini tidak diterapkan oleh `schema.sql`.

Untuk memberi akses petugas, daftarkan akun lalu ubah kolom `role` pada baris akun tersebut di tabel `profiles` menjadi `satpam` melalui Table Editor Supabase. Akun baru memiliki peran bawaan `user`.

### 4. Jalankan aplikasi

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

## Pengecekan kode

```bash
npm run lint
npm run build
```
