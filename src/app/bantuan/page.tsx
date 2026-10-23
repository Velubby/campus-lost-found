'use client';

import { useState } from 'react';
import Link from 'next/link';
import { HelpCircle, ChevronDown, ShieldCheck, Mail, Phone, MapPin, ArrowRight } from 'lucide-react';

export default function HelpPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Apakah saya harus masuk terlebih dahulu untuk mengklaim barang?',
      a: 'Ya, Anda diarahkan untuk masuk menggunakan akun email kampus agar identitas dapat diverifikasi secara valid oleh petugas keamanan sebelum serah terima.'
    },
    {
      q: 'Bagaimana jika barang saya belum muncul di katalog pencarian?',
      a: 'Segera buat laporan melalui menu Lapor Barang Hilang. Sistem akan menyimpan data laporan Anda dan mencocokkannya secara otomatis setiap kali ada barang baru yang ditemukan.'
    },
    {
      q: 'Berapa lama proses verifikasi kepemilikan barang berlangsung?',
      a: 'Verifikasi klaim biasanya selesai dalam waktu 24 hingga 48 jam kerja. Petugas posko akan menghubungi Anda melalui kontak yang terdaftar.'
    },
    {
      q: 'Di mana posko pengambilan barang yang telah disetujui?',
      a: 'Pengambilan fisik dilakukan di Pos Keamanan Utama Gedung B dengan menunjukkan KTM atau kartu identitas resmi kampus.'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Header */}
      <div className="text-center space-y-2">
        <span className="text-xs font-bold text-sky-700 uppercase tracking-widest block">
          Pusat Bantuan
        </span>
        <h1 className="text-3xl font-extrabold text-[#123356]">
          Bagaimana kami bisa membantumu?
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          Panduan langkah, jawaban pertanyaan umum, dan kontak resmi posko Lost &amp; Found Kampus.
        </p>
      </div>

      {/* 4 Panduan Steps (Apple Card) */}
      <div className="apple-card p-6 sm:p-8 bg-white space-y-6">
        <h2 className="text-base font-bold text-[#123356]">Panduan Alur Layanan</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
            <span className="w-6 h-6 rounded-full bg-[#123356] text-white flex items-center justify-center font-bold text-xs">1</span>
            <h3 className="font-bold text-xs text-slate-900">Cari Barang</h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Gunakan kata kunci dan filter gedung untuk mengecek barang temuan terbaru.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
            <span className="w-6 h-6 rounded-full bg-[#123356] text-white flex items-center justify-center font-bold text-xs">2</span>
            <h3 className="font-bold text-xs text-slate-900">Lapor Barang</h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Isi formulir barang hilang atau temuan beserta ciri umum dan lokasi kejadian.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
            <span className="w-6 h-6 rounded-full bg-[#123356] text-white flex items-center justify-center font-bold text-xs">3</span>
            <h3 className="font-bold text-xs text-slate-900">Klaim Rahasia</h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Jawab pertanyaan ciri privat untuk membuktikan kepemilikan Anda kepada petugas.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
            <span className="w-6 h-6 rounded-full bg-[#123356] text-white flex items-center justify-center font-bold text-xs">4</span>
            <h3 className="font-bold text-xs text-slate-900">Ambil Barang</h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Kunjungi Pos Satpam Gedung B dengan membawa KTM setelah klaim disetujui.
            </p>
          </div>
        </div>
      </div>

      {/* Accordion FAQ */}
      <div id="faq" className="apple-card p-6 sm:p-8 bg-white space-y-4">
        <h2 className="text-base font-bold text-[#123356] pb-2 border-b border-slate-100">
          Pertanyaan yang Sering Diajukan (FAQ)
        </h2>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="border border-slate-200 rounded-xl overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-4 text-left font-bold text-xs sm:text-sm text-[#123356] flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3 bg-slate-50/50">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Privacy Notice Card */}
      <div id="privasi" className="apple-card p-6 bg-sky-50/60 border border-sky-100 flex items-start gap-4">
        <ShieldCheck className="w-6 h-6 text-sky-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-sky-900">Kebijakan Privasi &amp; Keamanan</h3>
          <p className="text-xs text-sky-800 leading-relaxed">
            Sistem tidak mempublikasikan data identitas pribadi, foto kartu, atau nomor seri barang ke publik. Verifikasi ciri khusus barang dilakukan secara rahasia antara pelapor dan petugas satpam yang berwenang.
          </p>
        </div>
      </div>

    </div>
  );
}
