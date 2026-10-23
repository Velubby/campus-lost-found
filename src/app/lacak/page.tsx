'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, CheckCircle2, MessageSquare, Clock, MapPin, User, ShieldCheck, ArrowRight } from 'lucide-react';

export default function TrackingPage() {
  const steps = [
    { num: 1, title: 'Laporan Dibuat', completed: true },
    { num: 2, title: 'Diverifikasi', completed: true },
    { num: 3, title: 'Dicari', completed: true },
    { num: 4, title: 'Ditemukan', completed: true, active: true },
    { num: 5, title: 'Klaim', completed: false },
    { num: 6, title: 'Serah Terima', completed: false },
  ];

  const timelineEvents = [
    {
      title: 'Barang ditemukan',
      time: '04 Okt · 12.42',
      desc: 'Petugas Gedung B menemukan ransel yang sesuai di meja Kantin Barat.',
      current: true,
    },
    {
      title: 'Pencarian aktif',
      time: '04 Okt · 10.10',
      desc: 'Laporan diteruskan ke satpam area Kantin, Gedung B, dan petugas kebersihan.',
    },
    {
      title: 'Laporan diverifikasi',
      time: '04 Okt · 09.34',
      desc: 'Detail dan ciri spesifik telah ditinjau oleh petugas.',
    },
    {
      title: 'Laporan dibuat',
      time: '04 Okt · 09.22',
      desc: 'Laporan #LNF-261004-0187 berhasil diterima sistem.',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#123356]">
            Lacak Laporan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Setiap pembaruan penanganan tercatat secara transparan dan real-time.
          </p>
        </div>

        <button
          onClick={() => alert('Menghubungi Petugas Pos Utama Gedung B: Rizky A. (021-555-0110)')}
          className="btn-secondary text-xs flex items-center gap-2 self-start sm:self-auto"
        >
          <MessageSquare className="w-4 h-4 text-slate-600" />
          <span>Hubungi Petugas</span>
        </button>
      </div>

      {/* Main Status & Step Tracker Card (Figma Layout) */}
      <div className="apple-card p-6 sm:p-8 space-y-8 bg-white">
        
        {/* Card Header Info */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-slate-100">
          <div>
            <h2 className="text-2xl font-extrabold text-[#123356]">Tas Ransel Hitam</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Nomor laporan · #LNF-261004-0187
            </p>
          </div>
          <div className="text-left sm:text-right">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wider inline-block">
              SAAT INI · DITEMUKAN
            </span>
            <span className="text-[11px] text-slate-400 block mt-1">
              Diperbarui 8 menit lalu
            </span>
          </div>
        </div>

        {/* Horizontal Step Tracker */}
        <div className="overflow-x-auto py-2">
          <div className="min-w-[620px] flex items-center justify-between relative px-4">
            
            {/* Connecting lines */}
            <div className="absolute top-4 left-10 right-10 h-0.5 bg-slate-200 -z-0" />

            {steps.map((s, idx) => (
              <div key={s.num} className="flex flex-col items-center gap-2 relative z-10">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    s.completed
                      ? 'bg-[#123356] text-white shadow-xs'
                      : 'bg-white border-2 border-slate-200 text-slate-400'
                  } ${s.active ? 'ring-4 ring-emerald-100 bg-[#123356]' : ''}`}
                >
                  {s.completed ? <Check className="w-4 h-4 text-white" /> : s.num}
                </div>
                <span
                  className={`text-xs whitespace-nowrap ${
                    s.active
                      ? 'font-bold text-[#123356]'
                      : s.completed
                      ? 'font-medium text-slate-700'
                      : 'text-slate-400'
                  }`}
                >
                  {s.title}
                </span>
              </div>
            ))}

          </div>
        </div>

        {/* Action Banner inside tracker card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-emerald-900">
                Kemungkinan barangmu sudah ditemukan
              </h3>
              <p className="text-xs text-emerald-700 mt-0.5">
                Periksa foto barang temuan lalu ajukan klaim kepemilikan.
              </p>
            </div>
          </div>

          <Link
            href="/barang/3"
            className="px-4 py-2.5 rounded-xl bg-[#123356] hover:bg-[#0c233c] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 shrink-0 transition-transform active:scale-95 shadow-xs"
          >
            <span>Lihat Barang &amp; Ajukan Klaim</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

      </div>

      {/* 2-Column Bottom: Riwayat Aktivitas & Informasi Laporan */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Riwayat Aktivitas (Timeline) */}
        <div className="lg:col-span-8 apple-card p-6 sm:p-8 space-y-6">
          <h3 className="text-base font-bold text-[#123356] pb-3 border-b border-slate-100">
            Riwayat Aktivitas
          </h3>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {timelineEvents.map((evt, idx) => (
              <div key={idx} className="relative">
                {/* Node indicator */}
                <div
                  className={`absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 bg-white ${
                    evt.current
                      ? 'border-[#123356] bg-[#123356] ring-4 ring-sky-100'
                      : 'border-slate-300'
                  }`}
                />
                
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-slate-900">{evt.title}</h4>
                  <span className="text-[11px] text-slate-400 font-medium shrink-0">{evt.time}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {evt.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Metadata Laporan */}
        <div className="lg:col-span-4 apple-card p-6 space-y-5">
          <h3 className="text-base font-bold text-[#123356] pb-3 border-b border-slate-100">
            Informasi Laporan
          </h3>

          <div className="space-y-4 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Lokasi Terakhir</span>
              <span className="font-bold text-slate-800 text-sm mt-0.5 block">Kantin Barat</span>
            </div>

            <div>
              <span className="text-slate-400 block font-medium">Dilaporkan</span>
              <span className="font-bold text-slate-800 mt-0.5 block">04 Okt 2026 · 09.22 WIB</span>
            </div>

            <div>
              <span className="text-slate-400 block font-medium">Petugas Penanggung Jawab</span>
              <span className="font-bold text-slate-800 mt-0.5 block">Rizky A. · Satpam Area B</span>
            </div>

            <div>
              <span className="text-slate-400 block font-medium">Estimasi Respons</span>
              <span className="font-bold text-emerald-700 mt-0.5 block">Hari ini sebelum 17.00 WIB</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
