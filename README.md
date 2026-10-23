# Campus Lost & Found

Portal MVP untuk mencari barang temuan, membuat laporan kehilangan, mengajukan klaim, dan melacak proses serah terima.

## Menjalankan aplikasi

```bash
npm install
npm run dev
```

Tanpa konfigurasi Supabase, aplikasi tetap bisa dijalankan sebagai preview dengan data mock lokal.

## Mengaktifkan Supabase

1. Buat project di Supabase.
2. Salin `.env.example` menjadi `.env.local`.
3. Isi `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` dari Project Settings > API.
4. Jalankan isi `supabase/schema.sql` di Supabase SQL Editor.
5. Jika schema sudah pernah dijalankan sebelumnya, jalankan juga `supabase/catalog-policy.sql` agar katalog dapat dibaca pengunjung tanpa login.
6. Jika schema sudah pernah dijalankan sebelumnya, tambahkan policy DELETE laporan draf dari bagian `reports` di `supabase/schema.sql`.
7. Tambahkan barang temuan nyata ke tabel `items` melalui Table Editor atau alur laporan barang temuan.
8. Atur Email Provider di Authentication > Providers. Untuk MVP lokal, email confirmation dapat dimatikan agar akun langsung bisa masuk.

## Profil, logout, dan foto

- Menu profil menyediakan halaman `/pengaturan` untuk mengubah nama dan nomor telepon.
- Tombol `Keluar` memanggil Supabase Auth sign-out.
- Foto laporan diunggah ke Storage bucket `item-images`, lalu URL publiknya disimpan di `reports.image_url`.
- Ukuran foto dibatasi 5MB dengan format PNG, JPG, atau WEBP.

Saat env Supabase tersedia, halaman registrasi dan login menggunakan Supabase Auth. Saat env belum tersedia, fallback mock hanya dipakai untuk preview lokal.

## Validasi

```bash
npm run build
npm run lint
```

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
