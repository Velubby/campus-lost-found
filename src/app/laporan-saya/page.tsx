'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, Clock, FileEdit, CheckCircle2, MessageSquare, Trash2, ArrowRight } from 'lucide-react';
import { USER_REPORTS } from '@/data/items';

export default function MyReportsPage() {
  const [activeTab, setActiveTab] = useState<'Aktif' | 'Draf' | 'Selesai' | 'Klaim'>('Aktif');

  const filteredReports = USER_REPORTS.filter(r => r.status === activeTab);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#123356]">
            Laporan Saya
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Pantau laporan barang hilang, temuan, dan klaim kepemilikanmu.
          </p>
        </div>

        <Link
          href="/lapor"
          className="btn-primary text-xs flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Laporan Baru</span>
        </Link>
      </div>

      {/* 4 Summary Cards (Figma Metrics Row) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        <div
          onClick={() => setActiveTab('Aktif')}
          className={`apple-card p-5 cursor-pointer transition-all ${
            activeTab === 'Aktif' ? 'ring-2 ring-[#123356] bg-white' : 'bg-white/80'
          }`}
        >
          <span className="text-3xl font-black text-[#123356] block">2</span>
          <span className="text-xs font-bold text-slate-800 mt-1 block">Aktif</span>
          <span className="text-[11px] text-slate-400 block mt-0.5">Sedang ditangani</span>
        </div>

        <div
          onClick={() => setActiveTab('Draf')}
          className={`apple-card p-5 cursor-pointer transition-all ${
            activeTab === 'Draf' ? 'ring-2 ring-[#123356] bg-white' : 'bg-white/80'
          }`}
        >
          <span className="text-3xl font-black text-amber-600 block">1</span>
          <span className="text-xs font-bold text-slate-800 mt-1 block">Draf</span>
          <span className="text-[11px] text-slate-400 block mt-0.5">Belum dikirim</span>
        </div>

        <div
          onClick={() => setActiveTab('Selesai')}
          className={`apple-card p-5 cursor-pointer transition-all ${
            activeTab === 'Selesai' ? 'ring-2 ring-[#123356] bg-white' : 'bg-white/80'
          }`}
        >
          <span className="text-3xl font-black text-emerald-600 block">3</span>
          <span className="text-xs font-bold text-slate-800 mt-1 block">Selesai</span>
          <span className="text-[11px] text-slate-400 block mt-0.5">90 hari terakhir</span>
        </div>

        <div
          onClick={() => setActiveTab('Klaim')}
          className={`apple-card p-5 cursor-pointer transition-all ${
            activeTab === 'Klaim' ? 'ring-2 ring-[#123356] bg-white' : 'bg-white/80'
          }`}
        >
          <span className="text-3xl font-black text-sky-600 block">1</span>
          <span className="text-xs font-bold text-slate-800 mt-1 block">Klaim</span>
          <span className="text-[11px] text-slate-400 block mt-0.5">Menunggu review</span>
        </div>

      </div>

      {/* macOS Segmented Tab Bar */}
      <div className="segmented-control p-1 bg-slate-200/60 rounded-xl">
        <button
          onClick={() => setActiveTab('Aktif')}
          className={`segmented-control-btn ${activeTab === 'Aktif' ? 'active' : ''}`}
        >
          Aktif 2
        </button>
        <button
          onClick={() => setActiveTab('Draf')}
          className={`segmented-control-btn ${activeTab === 'Draf' ? 'active' : ''}`}
        >
          Draf 1
        </button>
        <button
          onClick={() => setActiveTab('Selesai')}
          className={`segmented-control-btn ${activeTab === 'Selesai' ? 'active' : ''}`}
        >
          Selesai 3
        </button>
        <button
          onClick={() => setActiveTab('Klaim')}
          className={`segmented-control-btn ${activeTab === 'Klaim' ? 'active' : ''}`}
        >
          Klaim 1
        </button>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {filteredReports.length > 0 ? (
          filteredReports.map((report) => (
            <div
              key={report.id}
              className="apple-card p-5 sm:p-6 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
            >
              {/* Left Item Details */}
              <div className="flex items-start gap-4">
                {report.image ? (
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                    <Image
                      src={report.image}
                      alt={report.itemTitle}
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0 border border-slate-200">
                    <FileEdit className="w-8 h-8" />
                  </div>
                )}

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-bold text-[#123356]">
                      {report.itemTitle}
                    </h3>
                    <span className="text-xs text-slate-400 font-medium">
                      {report.reportCode} · {report.type === 'hilang' ? 'Laporan barang hilang' : 'Barang temuan'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed max-w-xl">
                    {report.statusText}
                  </p>

                  <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
                    <span>{report.updatedAt}</span>
                    <span>·</span>
                    <span>{report.officer}</span>
                  </div>
                </div>
              </div>

              {/* Right Status Badge & Actions */}
              <div className="flex flex-col sm:items-end gap-3 w-full sm:w-auto shrink-0">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider self-start sm:self-auto ${
                    report.badgeType === 'DITEMUKAN'
                      ? 'bg-emerald-100 text-emerald-800'
                      : report.badgeType === 'DRAF'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {report.badgeType}
                </span>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {report.status === 'Aktif' && (
                    <>
                      <Link
                        href="/lacak"
                        className="btn-primary text-xs py-2 px-3 flex-1 sm:flex-initial"
                      >
                        Lihat &amp; Klaim
                      </Link>
                      <button
                        onClick={() => alert('Menghubungi petugas penanggung jawab...')}
                        className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Petugas</span>
                      </button>
                    </>
                  )}

                  {report.status === 'Draf' && (
                    <>
                      <Link
                        href="/lapor"
                        className="btn-primary text-xs py-2 px-3 flex-1 sm:flex-initial"
                      >
                        Lanjutkan Draf
                      </Link>
                      <button
                        onClick={() => alert('Draf laporan dihapus.')}
                        className="btn-secondary text-xs py-2 px-3 text-rose-600 hover:text-rose-700"
                        title="Hapus draf"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}

                  {report.status === 'Selesai' && (
                    <Link
                      href={`/barang/4`}
                      className="btn-primary text-xs py-2 px-4"
                    >
                      Lihat Ringkasan
                    </Link>
                  )}
                </div>
              </div>

            </div>
          ))
        ) : (
          <div className="apple-card p-12 text-center text-slate-500 text-xs">
            Belum ada laporan di tab ini.
          </div>
        )}
      </div>

    </div>
  );
}
