# Campus Lost & Found

Aplikasi untuk mencari barang temuan, membuat laporan kehilangan atau temuan, mengajukan klaim, dan melacak laporan. Proyek menggunakan Next.js 16.4.2, React 19.3.0, TypeScript, Tailwind CSS 4, dan Supabase untuk database, autentikasi, serta penyimpanan foto.

## Status proyek

Aplikasi menggunakan Supabase. `supabase/schema.sql` sudah diterapkan pada proyek Supabase yang digunakan saat ini. Untuk menjalankan aplikasi, hubungkan konfigurasi lokal ke proyek Supabase tersebut.

## Setup lokal

### 1. Instal dependensi

Siapkan Node.js dan npm, lalu jalankan dari direktori proyek:

```bash
npm install
```

### 2. Konfigurasi environment

Buat `.env.local` di direktori proyek dan isi kedua variabel berikut dengan URL serta publishable key dari proyek Supabase yang sama:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=<URL proyek Supabase>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable key proyek Supabase>
```

Kedua variabel ini dibaca oleh konfigurasi dan client Supabase aplikasi. Gunakan publishable key, bukan service-role key atau secret key, karena variabel `NEXT_PUBLIC_*` tersedia di browser. Jangan commit `.env.local`.

Mulai ulang server pengembangan setelah mengubah environment.

### 3. Siapkan database jika menggunakan proyek Supabase baru

Untuk proyek Supabase saat ini, `schema.sql` sudah diterapkan, sehingga langkah ini tidak perlu diulang hanya untuk menjalankan aplikasi secara lokal.

Untuk proyek Supabase baru, jalankan SQL melalui Supabase SQL Editor dengan urutan berikut:

1. **`supabase/schema.sql`**: membuat enum, tabel `profiles`, `items`, `reports`, `claims`, dan `report_events`; mengaktifkan Row Level Security (RLS); memasang policy, fungsi, serta trigger; dan membuat bucket publik `item-images` beserta policy aksesnya.
2. **`supabase/catalog-policy.sql`**, hanya jika perlu memperbarui policy katalog pada skema lama: mengizinkan pembacaan tabel `items` oleh pengunjung tanpa login dan pengguna terautentikasi. File ini membutuhkan tabel `items` dari langkah pertama. Policy yang sama sudah tercakup dalam `schema.sql` saat ini, sehingga tidak wajib dijalankan lagi setelah pemasangan skema terbaru.

`schema.sql` juga memuat pembaruan data laporan, klaim, dan katalog yang sudah ada. Jangan memperlakukannya sebagai skrip reset atau menjalankannya ulang tanpa meninjau dampaknya terhadap data.

Skema tidak menyertakan seed katalog contoh. Barang temuan dapat ditambahkan melalui alur laporan temuan; trigger database menerbitkannya ke tabel `items`.

### 4. Konfigurasi autentikasi

Registrasi menggunakan Supabase Auth `signUp`, sedangkan login menggunakan email dan password melalui `signInWithPassword`. Pastikan provider Email di Supabase Authentication aktif.

**TODO: konfirmasi apakah konfirmasi email diaktifkan pada proyek Supabase saat ini.** Pengaturan tersebut berada di dashboard Supabase dan tidak dapat dipastikan dari kode repository. Jika diaktifkan, pengguna perlu mengonfirmasi email sebelum login.

### 5. Jalankan aplikasi

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

Untuk menjalankan hasil build produksi secara lokal, siapkan environment yang sama sebelum build, lalu jalankan:

```bash
npm run build
npm run start
```

## Halaman aplikasi

Halaman berada di `src/app` menggunakan Next.js App Router.

| Rute | Kegunaan |
| --- | --- |
| `/` | Beranda |
| `/cari` | Pencarian dan filter katalog barang |
| `/barang/[id]` | Detail barang dan pengajuan klaim |
| `/lapor` | Formulir laporan kehilangan atau temuan |
| `/lacak` | Pelacakan laporan |
| `/laporan-saya` | Daftar laporan pengguna |
| `/daftar` | Registrasi akun |
| `/masuk` | Login |
| `/dashboard` | Dashboard pengguna |
| `/pengaturan` | Pengaturan profil |
| `/admin` | Halaman petugas keamanan |
| `/bantuan` | Bantuan |

Akses petugas memerlukan nilai `satpam` pada kolom `profiles.role`. Profil baru memiliki role bawaan `user`; registrasi biasa tidak otomatis memberikan akses petugas.

## Foto laporan

- Foto diunggah ke bucket Supabase Storage `item-images`, dan URL publiknya disimpan di `reports.image_url`.
- Formulir menerima PNG, JPG, atau WEBP dengan ukuran maksimal 5 MB.
- Foto laporan temuan diburamkan sebelum diunggah.
- Bucket bersifat publik. Policy unggah membatasi folder pertama pada path file ke ID pengguna yang login.

## Pemeriksaan kode

```bash
npm run lint
npm run build
```

`lint` menjalankan ESLint dan `build` menjalankan build produksi Next.js.
