'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, ShieldAlert, Upload, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';

export default function ReportPage() {
  const router = useRouter();

  const [reportType, setReportType] = useState<'hilang' | 'temuan'>('hilang');
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [isSuccess, setIsSuccess] = useState(false);

  const [formData, setFormData] = useState({
    namaBarang: '',
    kategori: 'Elektronik',
    lokasi: '',
    tanggal: '2026-10-23',
    waktu: '10:00',
    deskripsiPublik: '',
    ciriRahasia: '',
    namaPelapor: 'Alya Putri',
    email: 'alya.putri@mahasiswa.kampus.ac.id',
    telepon: '081234567890',
    setuju: true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSuccess(true);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div className="text-center space-y-2">
        <span className="text-xs font-bold text-sky-700 uppercase tracking-widest block">
          Formulir Terpadu
        </span>
        <h1 className="text-3xl font-extrabold text-[#123356]">
          {reportType === 'hilang' ? 'Laporkan Barang Hilang' : 'Laporkan Barang Temuan'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          Isi detail informasi barang. Petugas keamanan kampus akan memverifikasi dan mencocokkan data di sistem.
        </p>
      </div>

      {/* macOS Type Switcher */}
      <div className="flex justify-center">
        <div className="segmented-control p-1 bg-slate-200/70 rounded-2xl">
          <button
            type="button"
            onClick={() => setReportType('hilang')}
            className={`segmented-control-btn px-6 py-2 ${reportType === 'hilang' ? 'active' : ''}`}
          >
            Barang Hilang
          </button>
          <button
            type="button"
            onClick={() => setReportType('temuan')}
            className={`segmented-control-btn px-6 py-2 ${reportType === 'temuan' ? 'active' : ''}`}
          >
            Barang Ditemukan
          </button>
        </div>
      </div>

      {/* Step Indicators */}
      <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-500">
        <span className={`px-3 py-1 rounded-full ${currentStep === 1 ? 'bg-[#123356] text-white' : 'bg-slate-200'}`}>
          1. Detail Barang
        </span>
        <span className="text-slate-300">→</span>
        <span className={`px-3 py-1 rounded-full ${currentStep === 2 ? 'bg-[#123356] text-white' : 'bg-slate-200'}`}>
          2. Ciri Spesifik
        </span>
        <span className="text-slate-300">→</span>
        <span className={`px-3 py-1 rounded-full ${currentStep === 3 ? 'bg-[#123356] text-white' : 'bg-slate-200'}`}>
          3. Konfirmasi
        </span>
      </div>

      {/* Main Card Form */}
      <div className="apple-card p-6 sm:p-8 bg-white">
        
        {isSuccess ? (
          <div className="text-center py-8 space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest block mb-1">
                Laporan Berhasil Disimpan
              </span>
              <h2 className="text-2xl font-extrabold text-[#123356]">
                Nomor Tiket: #LNF-261023-0214
              </h2>
              <p className="text-xs text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
                Terima kasih, laporan Anda telah diterima. Sistem sedang mencocokkan ciri barang dengan laporan temuan yang ada.
              </p>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row justify-center gap-3">
              <button
                onClick={() => router.push('/lacak')}
                className="btn-primary text-xs py-2.5 px-5"
              >
                Lacak Status Laporan Ini
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="btn-secondary text-xs py-2.5 px-5"
              >
                Kembali ke Dashboard
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Step 1: Detail Barang */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="pb-3 border-b border-slate-100">
                  <h2 className="text-base font-bold text-[#123356]">Informasi Dasar Barang</h2>
                  <p className="text-xs text-slate-500">Tentukan nama dan lokasi kejadian sejelas mungkin.</p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Nama Barang</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Dompet Kulit Cokelat, Kunci Motor Honda..."
                    value={formData.namaBarang}
                    onChange={(e) => setFormData({ ...formData, namaBarang: e.target.value })}
                    className="macos-input w-full"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Kategori</label>
                    <select
                      value={formData.kategori}
                      onChange={(e) => setFormData({ ...formData, kategori: e.target.value as any })}
                      className="macos-input w-full"
                    >
                      <option>Elektronik</option>
                      <option>Dokumen</option>
                      <option>Aksesoris</option>
                      <option>Tas & Pakaian</option>
                      <option>Lainnya</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Lokasi Kejadian</label>
                    <input
                      type="text"
                      required
                      placeholder="Gedung A, Perpustakaan, Kantin..."
                      value={formData.lokasi}
                      onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })}
                      className="macos-input w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Tanggal Kejadian</label>
                    <input
                      type="date"
                      required
                      value={formData.tanggal}
                      onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                      className="macos-input w-full"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Perkiraan Waktu</label>
                    <input
                      type="time"
                      value={formData.waktu}
                      onChange={(e) => setFormData({ ...formData, waktu: e.target.value })}
                      className="macos-input w-full"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (!formData.namaBarang || !formData.lokasi) {
                        alert('Harap isi nama barang dan lokasi terlebih dahulu.');
                        return;
                      }
                      setCurrentStep(2);
                    }}
                    className="btn-primary text-xs"
                  >
                    <span>Lanjut ke Ciri Spesifik</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Ciri Spesifik & Rahasia */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="pb-3 border-b border-slate-100">
                  <h2 className="text-base font-bold text-[#123356]">Deskripsi &amp; Ciri Khusus</h2>
                  <p className="text-xs text-slate-500">Ciri privat digunakan untuk memverifikasi pemilik sah.</p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    Deskripsi Publik (Bisa dibaca umum)
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Sebutkan warna utama, bentuk, dan kondisi luar yang wajar diketahui umum..."
                    value={formData.deskripsiPublik}
                    onChange={(e) => setFormData({ ...formData, deskripsiPublik: e.target.value })}
                    className="macos-input w-full"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 block">
                      Ciri Rahasia / Bukti Kepemilikan (Privat)
                    </label>
                    <span className="text-[10px] text-amber-600 font-semibold flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3" />
                      <span>Hanya dilihat petugas</span>
                    </span>
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Contoh: ada stiker di bagian bawah, foto di dalam dompet, wallpaper kunci layar..."
                    value={formData.ciriRahasia}
                    onChange={(e) => setFormData({ ...formData, ciriRahasia: e.target.value })}
                    className="macos-input w-full"
                  />
                </div>

                {/* Upload Foto Mockup */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Foto Barang (Opsional)</label>
                  <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:bg-slate-50 cursor-pointer transition-colors">
                    <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                    <span className="text-xs font-semibold text-slate-700 block">Pilih file atau seret foto ke sini</span>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Format PNG, JPG, atau WEBP maks 5MB</span>
                  </div>
                </div>

                <div className="pt-4 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="btn-secondary text-xs"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Kembali</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="btn-primary text-xs"
                  >
                    <span>Lanjut ke Konfirmasi</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Kontak & Konfirmasi */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="pb-3 border-b border-slate-100">
                  <h2 className="text-base font-bold text-[#123356]">Kontak Pelapor &amp; Pernyataan</h2>
                  <p className="text-xs text-slate-500">Pastikan informasi kontak Anda dapat dihubungi.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Nama Lengkap</label>
                    <input
                      type="text"
                      required
                      value={formData.namaPelapor}
                      onChange={(e) => setFormData({ ...formData, namaPelapor: e.target.value })}
                      className="macos-input w-full"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Email Kampus</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="macos-input w-full"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Nomor WhatsApp / Telepon</label>
                  <input
                    type="tel"
                    required
                    value={formData.telepon}
                    onChange={(e) => setFormData({ ...formData, telepon: e.target.value })}
                    className="macos-input w-full"
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="setuju"
                    checked={formData.setuju}
                    onChange={(e) => setFormData({ ...formData, setuju: e.target.checked })}
                    className="w-4 h-4 rounded text-sky-600 border-slate-300 mt-0.5"
                  />
                  <label htmlFor="setuju" className="select-none leading-relaxed">
                    Saya menyatakan informasi di atas benar dan bersedia dihubungi petugas posko untuk keperluan verifikasi pengembalian barang.
                  </label>
                </div>

                <div className="pt-4 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="btn-secondary text-xs"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Kembali</span>
                  </button>
                  <button
                    type="submit"
                    className="btn-primary text-xs py-2.5 px-6 shadow-md"
                  >
                    Kirim Laporan Resmi
                  </button>
                </div>
              </div>
            )}

          </form>
        )}

      </div>

    </div>
  );
}
