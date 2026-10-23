export interface Item {
  id: string;
  title: string;
  category: 'Elektronik' | 'Dokumen' | 'Aksesoris' | 'Tas & Pakaian' | 'Lainnya';
  categoryTag: string;
  location: string;
  date: string;
  time: string;
  image: string;
  description: string;
  publicNotes: string;
  status: 'Ditemukan' | 'Menunggu Verifikasi' | 'Klaim Disetujui' | 'Selesai';
  matchedReportId?: string;
  isMine?: boolean;
}

export const ITEMS_DATA: Item[] = [
  {
    id: '1',
    title: 'Dompet Kulit Cokelat',
    category: 'Aksesoris',
    categoryTag: 'DOMPET',
    location: 'Gedung A · Lt. 2',
    date: '04 Okt 2026',
    time: '08.35',
    image: '/images/dompet-cokelat.webp',
    description: 'Dompet kulit berwarna cokelat ditemukan di dekat meja lobi Gedung A.',
    publicNotes: 'Dompet pria merk Polo, terdapat kartu tanda mahasiswa di dalamnya.',
    status: 'Ditemukan',
    matchedReportId: 'LNF-261004-0102'
  },
  {
    id: '2',
    title: 'Kunci Motor + Gantungan',
    category: 'Aksesoris',
    categoryTag: 'KUNCI',
    location: 'Parkiran Utama',
    date: '04 Okt 2026',
    time: '09.20',
    image: '/images/kunci-motor.webp',
    description: 'Satu set kunci motor Honda dengan gantungan tali kulit Triumph.',
    publicNotes: 'Kunci motor bebek, gantungan warna hitam bertuliskan Triumph.',
    status: 'Ditemukan'
  },
  {
    id: '3',
    title: 'Tas Ransel Hitam',
    category: 'Tas & Pakaian',
    categoryTag: 'TAS',
    location: 'Kantin Barat',
    date: '04 Okt 2026',
    time: '12.42 WIB',
    image: '/images/hero-lost-found.png',
    description: 'Ransel hitam ukuran sedang berbahan kanvas dengan dua kompartemen utama. Ditemukan di meja dekat jendela Kantin Barat.',
    publicNotes: 'Bagian luar tampak terawat, isi dan ciri privat telah dicatat petugas.',
    status: 'Ditemukan',
    matchedReportId: 'LNF-261004-0187',
    isMine: true
  },
  {
    id: '4',
    title: 'Botol Minum Hijau',
    category: 'Lainnya',
    categoryTag: 'BOTOL',
    location: 'Perpustakaan · Lt. 3',
    date: '04 Okt 2026',
    time: '10.05',
    image: '/images/botol-hijau.webp',
    description: 'Botol minum tumbler stainless warna hijau lumut tertinggal di bilik belajar.',
    publicNotes: 'Tumbler merk MiiR warna hijau lumut dengan tutup hitam.',
    status: 'Ditemukan'
  },
  {
    id: '5',
    title: 'Kalkulator Scientific',
    category: 'Elektronik',
    categoryTag: 'ELEKTRONIK',
    location: 'Gedung C · R. 104',
    date: '04 Okt 2026',
    time: '11.40',
    image: '/images/kalkulator.webp',
    description: 'Kalkulator scientific Casio tertinggal di ruang kuliah 104 setelah jam kuliah.',
    publicNotes: 'Kalkulator Casio fx-991EX dengan stiker inisial di bagian belakang.',
    status: 'Ditemukan'
  },
  {
    id: '6',
    title: 'Kartu Tanda Mahasiswa (KTM)',
    category: 'Dokumen',
    categoryTag: 'DOKUMEN',
    location: 'Selasar Gedung B',
    date: '04 Okt 2026',
    time: '12.10',
    image: '/images/dompet-cokelat.webp',
    description: 'KTM atas nama mahasiswa Fakultas Ilmu Komputer terselip di bangku selasar.',
    publicNotes: 'Disimpan rapi di pos keamanan Gedung B untuk verifikasi pemilik.',
    status: 'Ditemukan'
  }
];

export interface UserReport {
  id: string;
  itemTitle: string;
  reportCode: string;
  type: 'hilang' | 'temuan';
  status: 'Aktif' | 'Draf' | 'Selesai' | 'Klaim';
  statusText: string;
  badgeType: 'DITEMUKAN' | 'DRAF' | 'SELESAI' | 'KLAIM';
  updatedAt: string;
  officer: string;
  image?: string;
  description: string;
}

export const USER_REPORTS: UserReport[] = [
  {
    id: 'r1',
    itemTitle: 'Tas Ransel Hitam',
    reportCode: '#LNF-261004-0187',
    type: 'hilang',
    status: 'Aktif',
    statusText: 'Barang yang cocok telah ditemukan di Kantin Barat. Periksa detail dan ajukan klaim.',
    badgeType: 'DITEMUKAN',
    updatedAt: 'Diperbarui 8 menit lalu',
    officer: 'Petugas Rizky A.',
    image: '/images/hero-lost-found.png',
    description: 'Tas ransel hitam kanvas tertinggal di sekitar kantin barat.'
  },
  {
    id: 'r2',
    itemTitle: 'Payung Lipat Biru',
    reportCode: '#LNF-261003-0091',
    type: 'hilang',
    status: 'Draf',
    statusText: 'Detail lokasi terakhir sudah tersimpan. Lengkapi ciri spesifik sebelum dikirim.',
    badgeType: 'DRAF',
    updatedAt: 'Disimpan 03 Okt 2026 · 19.14',
    officer: 'Belum ditugaskan',
    description: 'Payung lipat warna navy dengan pegangan kayu.'
  },
  {
    id: 'r3',
    itemTitle: 'Botol Minum Hijau',
    reportCode: '#KLM-260928-0064',
    type: 'temuan',
    status: 'Selesai',
    statusText: 'Kepemilikan telah diverifikasi dan barang diserahkan di Pos Utama Gedung B.',
    badgeType: 'SELESAI',
    updatedAt: 'Selesai 30 Sep 2026 · 15.20',
    officer: 'Petugas Hendra',
    image: '/images/botol-hijau.webp',
    description: 'Tumbler MiiR warna hijau lumut di perpustakaan.'
  }
];
