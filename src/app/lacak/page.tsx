'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Check, CheckCircle2, MessageSquare } from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { fetchLatestUserReport, formatDate, type ReportEventRow, type UserReportRow, type ClaimRow, type ClaimItemRow } from '@/lib/supabase/reports';

function TrackingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedReportId = searchParams.get('report') || undefined;
  const [report, setReport] = useState<UserReportRow | null>(null);
  const [reports, setReports] = useState<UserReportRow[]>([]);
  const [events, setEvents] = useState<ReportEventRow[]>([]);
  const [claim, setClaim] = useState<ClaimRow | null>(null);
  const [claimItem, setClaimItem] = useState<ClaimItemRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setError('Supabase belum dikonfigurasi.');
      setIsLoading(false);
      return;
    }

    fetchLatestUserReport(requestedReportId)
      .then((result) => {
        if (!result.user) {
          router.replace('/masuk?next=/lacak');
          return;
        }
        setReports(result.reports);
        setReport(result.report);
        setEvents(result.events);
        setClaim(result.claim);
        setClaimItem(result.claimItem);
      })
      .catch(() => setError('Status laporan belum dapat dimuat.'))
      .finally(() => setIsLoading(false));
  }, [router, requestedReportId]);

  if (isLoading) return <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-500">Memuat status laporan...</div>;
  if (error) return <div role="alert" className="max-w-7xl mx-auto px-4 py-16 text-center text-rose-700">{error}</div>;
  if (!report && claim && claimItem) return (
    <div className="max-w-2xl mx-auto px-4 py-16 space-y-6">
      <div className="apple-card bg-white p-6 sm:p-8 space-y-5">
        <div><span className="text-xs font-bold text-sky-700 uppercase tracking-widest">Klaim kepemilikan</span><h1 className="text-2xl font-extrabold text-[#123356] mt-1">{claimItem.title}</h1><p className="text-sm text-slate-500 mt-1">{claimItem.location}</p></div>
        <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3"><p className="text-sm font-bold text-sky-900">Klaim sedang ditinjau</p><p className="text-xs text-sky-700 mt-1">Tiket pengambilan: {claim.ticket_code}</p></div>
        <p className="text-xs text-slate-500">Petugas akan menghubungi nomor telepon di profil akunmu setelah verifikasi selesai.</p>
      </div>
    </div>
  );
  if (!report) return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
      <h1 className="text-2xl font-extrabold text-[#123356]">Belum ada laporan</h1>
      <p className="text-sm text-slate-500">Buat laporan terlebih dahulu untuk melihat proses penanganannya.</p>
      <Link href="/lapor" className="btn-primary inline-flex text-xs">Buat Laporan</Link>
    </div>
  );

  const statusIndex = report.status === 'selesai' ? 5 : report.status === 'klaim' || claim ? 4 : report.status === 'ditemukan' ? 3 : report.status === 'aktif' ? 2 : 0;
  const steps = ['Laporan Dibuat', 'Diverifikasi', 'Dicari', 'Ditemukan', 'Klaim', 'Serah Terima'];
  const statusLabel = claim ? `KLAIM ${claim.status.toUpperCase()}` : report.status.toUpperCase();
  const timeline = events.length > 0 ? events : [{ id: report.id, title: 'Laporan dibuat', description: 'Laporan berhasil diterima sistem.', created_at: report.created_at }];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div><h1 className="text-2xl sm:text-3xl font-extrabold text-[#123356]">Lacak Laporan</h1><p className="text-xs sm:text-sm text-slate-500 mt-1">Pembaruan laporanmu tercatat di sini.</p></div>
        {reports.length > 1 && <label className="text-xs text-slate-600">Pilih laporan<select value={report?.id || ''} onChange={(event) => router.push(`/lacak?report=${event.target.value}`)} className="form-input ml-2 py-2"><option value="" disabled>Pilih laporan</option>{reports.map((item) => <option key={item.id} value={item.id}>{item.report_code} · {item.item_title}</option>)}</select></label>}
        <a href="mailto:cs-lnf@kampus.ac.id" className="btn-secondary text-xs flex items-center gap-2 self-start sm:self-auto"><MessageSquare className="w-4 h-4 text-slate-600" /><span>Hubungi Petugas</span></a>
      </div>

      <div className="apple-card p-6 sm:p-8 space-y-8 bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-slate-100"><div><h2 className="text-2xl font-extrabold text-[#123356]">{report.item_title}</h2><p className="text-xs text-slate-500 mt-0.5">Nomor laporan · {report.report_code}</p></div><span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800 uppercase tracking-wider inline-block">SAAT INI · {statusLabel}</span></div>
        <div className="overflow-x-auto py-2"><div className="min-w-[620px] flex items-center justify-between relative px-4"><div className="absolute top-4 left-10 right-10 h-0.5 bg-slate-200 -z-0" />{steps.map((step, index) => <div key={step} className="flex flex-col items-center gap-2 relative z-10"><div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${index <= statusIndex ? 'bg-[#123356] text-white' : 'bg-white border-2 border-slate-200 text-slate-400'}`}>{index <= statusIndex ? <Check className="w-4 h-4" /> : index + 1}</div><span className={`text-xs whitespace-nowrap ${index === statusIndex ? 'font-bold text-[#123356]' : index < statusIndex ? 'text-slate-700' : 'text-slate-400'}`}>{step}</span></div>)}</div></div>
        <div className="p-4 sm:p-5 rounded-2xl bg-sky-50/80 border border-sky-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"><div className="flex items-start sm:items-center gap-3"><CheckCircle2 className="w-6 h-6 text-sky-600 shrink-0" /><div><h3 className="text-sm font-bold text-sky-900">Status laporan: {statusLabel}</h3><p className="text-xs text-sky-700 mt-0.5">{claim ? `Tiket pengambilan: ${claim.ticket_code}` : 'Pembaruan berikutnya akan muncul setelah petugas menindaklanjuti.'}</p></div></div>{report.status === 'ditemukan' && !claim && <Link href="/cari" className="btn-primary text-xs inline-flex items-center gap-1.5">Cari barang yang cocok <ArrowRight className="w-3.5 h-3.5" /></Link>}</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"><div className="lg:col-span-8 apple-card p-6 sm:p-8 space-y-6"><h3 className="text-base font-bold text-[#123356] pb-3 border-b border-slate-100">Riwayat Aktivitas</h3><div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">{timeline.map((event) => <div key={event.id} className="relative"><div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 border-[#123356] bg-[#123356]" /><div className="flex items-center justify-between gap-2"><h4 className="text-sm font-bold text-slate-900">{event.title}</h4><span className="text-[11px] text-slate-400 shrink-0">{formatDate(event.created_at)}</span></div><p className="text-xs text-slate-500 mt-1 leading-relaxed">{event.description}</p></div>)}</div></div><div className="lg:col-span-4 apple-card p-6 space-y-5"><h3 className="text-base font-bold text-[#123356] pb-3 border-b border-slate-100">Informasi Laporan</h3><div className="space-y-4 text-xs"><div><span className="text-slate-400 block">Lokasi Kejadian</span><span className="font-bold text-slate-800 text-sm">{report.location}</span></div><div><span className="text-slate-400 block">Dilaporkan</span><span className="font-bold text-slate-800">{formatDate(report.created_at)}</span></div><div><span className="text-slate-400 block">Kategori</span><span className="font-bold text-slate-800">{report.category}</span></div></div></div></div>
    </div>
  );
}

export default function TrackingPage() {
  return <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-500">Memuat status laporan...</div>}><TrackingContent /></Suspense>;
}
