'use client';

import { useState, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, MapPin, Calendar, Clock, ShieldCheck, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { ITEMS_DATA } from '@/data/items';

function ItemDetailContent() {
  const params = useParams();
  const router = useRouter();
  const itemId = params.id as string;

  const item = ITEMS_DATA.find(i => i.id === itemId) || ITEMS_DATA[2]; // Default to Tas Ransel if not found

  // Modal claim state
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [claimSubmitted, setClaimSubmitted] = useState(false);
  const [claimAnswers, setClaimAnswers] = useState({
    ciriKhusus: '',
    isiBarang: '',
    kontak: '08123456789'
  });

  const handleClaimSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setClaimSubmitted(true);
    setTimeout(() => {
      setIsClaimModalOpen(false);
      router.push('/lacak');
    }, 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Link href="/cari" className="hover:text-slate-900 flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Pencarian</span>
        </Link>
        <span>/</span>
        <span className="text-slate-800">{item.title}</span>
      </nav>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* Left Column: Image & Photo Protection Notice */}
        <div className="lg:col-span-6 space-y-4">
          <div className="relative aspect-4/3 w-full rounded-3xl overflow-hidden bg-slate-100 border border-slate-200/90 shadow-md">
            <Image
              src={item.image}
              alt={item.title}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              priority
            />
          </div>

          {/* Thumbnails */}
          <div className="flex items-center gap-3">
            <div className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-sky-600 shadow-xs">
              <Image src={item.image} alt="Thumbnail 1" fill sizes="64px" className="object-cover" />
            </div>
            <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-400">
              + 1 foto
            </div>
          </div>

          {/* Privacy Notice Banner */}
          <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-100 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-sky-700 shrink-0 mt-0.5" />
            <p className="text-xs text-sky-900 leading-relaxed">
              Foto publik sengaja tidak menampilkan isi bagian dalam atau nomor seri rahasia untuk melindungi pemilik asli dari klaim sembarangan.
            </p>
          </div>
        </div>

        {/* Right Column: Information, Specs, Match Banner & Claim Action */}
        <div className="lg:col-span-6 space-y-6">
          
          <div className="space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                {item.status}
              </span>
              {item.matchedReportId && (
                <span className="text-xs text-slate-500 font-medium">
                  Cocok dengan laporan #{item.matchedReportId}
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#123356] tracking-tight">
              {item.title}
            </h1>
            <p className="text-sm text-slate-500 font-medium">
              {item.category} · Kondisi terawat &amp; aman di posko
            </p>
          </div>

          {/* 3 Specs Cards (Figma Spec Grid) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <MapPin className="w-3.5 h-3.5 text-sky-600" />
                <span>Lokasi Ditemukan</span>
              </div>
              <span className="text-sm font-bold text-[#123356] block truncate">
                {item.location}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <Calendar className="w-3.5 h-3.5 text-sky-600" />
                <span>Tanggal Temuan</span>
              </div>
              <span className="text-sm font-bold text-[#123356] block">
                {item.date}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <Clock className="w-3.5 h-3.5 text-sky-600" />
                <span>Waktu Ditemukan</span>
              </div>
              <span className="text-sm font-bold text-[#123356] block">
                {item.time}
              </span>
            </div>
          </div>

          {/* Public Description */}
          <div className="space-y-2">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Ciri Publik
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              {item.description}
            </p>
          </div>

          {/* Green Match Alert if Matched */}
          {item.matchedReportId && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-emerald-900">
                  Kemungkinan cocok dengan barangmu
                </h3>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Lokasi, tanggal, dan ciri publik sesuai dengan laporan aktif #{item.matchedReportId}.
                </p>
              </div>
            </div>
          )}

          {/* Verification Box & CTA Button */}
          <div className="apple-card p-5 space-y-4 bg-white/90">
            <div>
              <h3 className="text-sm font-bold text-[#123356]">Merasa ini milikmu?</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Siapkan jawaban tentang ciri khusus atau isi barang yang hanya diketahui pemilik sah. Informasi ini akan dicocokkan petugas saat verifikasi.
              </p>
            </div>

            <button
              onClick={() => setIsClaimModalOpen(true)}
              className="w-full btn-primary text-sm py-3 flex items-center justify-center gap-2 shadow-md"
            >
              <ShieldCheck className="w-4 h-4 text-sky-300" />
              <span>Ajukan Klaim Kepemilikan</span>
            </button>
          </div>

          <p className="text-xs text-center text-slate-500">
            Butuh bantuan langsung? Hubungi <span className="font-semibold text-slate-700">Rizky A. · Satpam Area B</span> di Pos Keamanan Gedung B.
          </p>

        </div>

      </div>

      {/* macOS Style Ownership Verification Modal */}
      {isClaimModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            
            {/* macOS Window Titlebar */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500 inline-block cursor-pointer" onClick={() => setIsClaimModalOpen(false)} />
                <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
              </div>
              <span className="text-xs font-bold text-slate-700">Verifikasi Kepemilikan Barang</span>
              <button
                onClick={() => setIsClaimModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            {claimSubmitted ? (
              <div className="p-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-[#123356]">Klaim Berhasil Dikirim!</h3>
                <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                  Permintaan klaim Anda untuk <strong>{item.title}</strong> telah dicatat. Petugas akan meninjau jawaban ciri khusus Anda. Mengalihkan ke pelacakan status...
                </p>
              </div>
            ) : (
              <form onSubmit={handleClaimSubmit} className="p-6 space-y-4">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-sky-700 uppercase tracking-wider">Secret Ownership</span>
                  <h3 className="text-lg font-bold text-[#123356]">
                    Buktikan bahwa ini barang milikmu
                  </h3>
                  <p className="text-xs text-slate-500">
                    Jawab pertanyaan di bawah ini seakurat mungkin. Hanya petugas penanggung jawab yang dapat melihat jawaban ini.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Ciri khusus yang tidak terlihat di foto
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Contoh: gantungan kunci kecil di resleting dalam, bekas goresan di pojok kanan bawah..."
                    value={claimAnswers.ciriKhusus}
                    onChange={(e) => setClaimAnswers({ ...claimAnswers, ciriKhusus: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Rincian isi di dalam barang (jika berupa tas/dompet)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Sebutkan benda atau dokumen apa saja yang ada di dalamnya..."
                    value={claimAnswers.isiBarang}
                    onChange={(e) => setClaimAnswers({ ...claimAnswers, isiBarang: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Nomor WhatsApp / Telepon aktif
                  </label>
                  <input
                    type="tel"
                    required
                    value={claimAnswers.kontak}
                    onChange={(e) => setClaimAnswers({ ...claimAnswers, kontak: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsClaimModalOpen(false)}
                    className="btn-secondary text-xs py-2 px-4"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="btn-primary text-xs py-2 px-5"
                  >
                    Kirim Pengajuan Klaim
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}

export default function ItemDetailPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-500">Memuat detail barang...</div>}>
      <ItemDetailContent />
    </Suspense>
  );
}
