'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Check, CheckCircle2, MessageSquare } from 'lucide-react';
import QRCode from 'react-qr-code';
import { createClient } from '@/lib/supabase/client';
import { fetchLatestUserReport, formatDate, type ReportEventRow, type UserReportRow, type ClaimRow, type ClaimItemRow } from '@/lib/supabase/reports';
import { toast } from 'sonner';

function getReportProgress(report: Pick<UserReportRow, 'type' | 'status'>) {
  const isFoundReport = report.type === 'temuan';
  const steps = isFoundReport
    ? ['Temuan dilaporkan', 'Menunggu pemilik', 'Verifikasi klaim', 'Selesai']
    : ['Laporan dibuat', 'Pencarian', 'Barang ditemukan', 'Verifikasi klaim', 'Selesai'];
  const statusIndex = {
    draf: 0,
    aktif: 1,
    ditemukan: isFoundReport ? 1 : 2,
    klaim: isFoundReport ? 2 : 3,
    selesai: steps.length - 1,
  }[report.status];
  const statusLabel = {
    draf: 'Draf',
    aktif: isFoundReport ? 'Menunggu pemilik' : 'Dalam pencarian',
    ditemukan: isFoundReport ? 'Menunggu pemilik' : 'Barang ditemukan',
    klaim: 'Verifikasi klaim',
    selesai: 'Laporan selesai',
  }[report.status];
  const description = {
    draf: 'Laporan masih berupa draf dan belum masuk proses penanganan.',
    aktif: isFoundReport
      ? 'Temuan sudah dilaporkan. Menunggu pemilik mengajukan klaim kepemilikan.'
      : 'Laporan kehilangan aktif. Barang masih dalam pencarian.',
    ditemukan: isFoundReport
      ? 'Barang temuan menunggu pemilik yang dapat membuktikan kepemilikannya.'
      : 'Barang telah dinyatakan ditemukan. Kepemilikan perlu diverifikasi sebelum pengambilan.',
    klaim: 'Ada klaim kepemilikan yang perlu diverifikasi oleh petugas.',
    selesai: 'Laporan telah ditandai selesai. Lihat riwayat aktivitas untuk rincian penyelesaiannya.',
  }[report.status];

  return { steps, statusIndex, statusLabel, description };
}

function TrackingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedReportId = searchParams.get('report') || undefined;
  const [report, setReport] = useState<UserReportRow | null>(null);
  const [reports, setReports] = useState<UserReportRow[]>([]);
  const [events, setEvents] = useState<ReportEventRow[]>([]);
  const [claim, setClaim] = useState<ClaimRow | null>(null);
  const [claimItem, setClaimItem] = useState<ClaimItemRow | null>(null);
  const [pickupAtInput, setPickupAtInput] = useState('');
  const [scheduleError, setScheduleError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
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

  const schedulePickup = async () => {
    if (!claim || !pickupAtInput) return;
    const pickupAt = new Date(`${pickupAtInput}:00+07:00`).toISOString();
    const { error: scheduleUpdateError } = await createClient().rpc('schedule_claim', {
      claim_id: claim.id,
      requested_pickup_at: pickupAt,
    });
    if (scheduleUpdateError) {
      setScheduleError('Jadwal belum dapat disimpan. Pastikan klaim sudah disetujui petugas.');
      toast.error('Jadwal belum dapat disimpan. Pastikan klaim sudah disetujui petugas.');
      return;
    }
    toast.success('Jadwal pengambilan berhasil dikonfirmasi!');
    window.location.reload();
  };

  if (isLoading) return <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-500">Memuat status laporan...</div>;
  if (error) return <div role="alert" className="max-w-7xl mx-auto px-4 py-16 text-center text-rose-700">{error}</div>;
  if (!report && claim && claimItem) return (
    <div className="max-w-2xl mx-auto px-4 py-16 space-y-6">
      <div className="apple-card bg-white p-6 sm:p-8 space-y-5">
        <div><span className="text-xs font-bold text-sky-700 uppercase tracking-widest">Klaim kepemilikan</span><h1 className="text-2xl font-extrabold text-[#123356] mt-1">{claimItem.title}</h1><p className="text-sm text-slate-500 mt-1">{claimItem.location}</p></div>
        <div className={`rounded-xl border px-4 py-3 ${claim.status === 'ditolak' ? 'border-rose-200 bg-rose-50' : claim.status === 'disetujui' ? 'border-emerald-200 bg-emerald-50' : 'border-sky-200 bg-sky-50'}`}><p className="text-sm font-bold text-slate-900">Status klaim: {claim.status}</p><p className="text-xs text-slate-700 mt-1">Tiket pengambilan: {claim.ticket_code}</p></div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-[1fr_auto] sm:items-center"><div className="space-y-3"><p className="text-xs text-slate-500">Tahapan klaim</p><div className="flex flex-wrap gap-2">{['diajukan', 'ditinjau', 'disetujui'].map((step) => <span key={step} className={`rounded-full px-3 py-1 text-[11px] font-semibold ${claim.status === step || (claim.status === 'disetujui' && step !== 'ditolak') ? 'bg-[#123356] text-white' : 'bg-slate-100 text-slate-500'}`}>{step}</span>)}</div>{claim.status === 'disetujui' && claim.pickup_location && <p className="text-sm font-semibold text-emerald-800">Lokasi pengambilan: {claim.pickup_location}</p>}{claim.status === 'disetujui' && claim.pickup_at ? <p className="text-sm font-semibold text-emerald-800">Jadwal: {formatDate(claim.pickup_at)}</p> : claim.status === 'disetujui' && <div className="space-y-2"><label className="block text-xs font-semibold text-slate-600">Pilih tanggal dan jam pengambilan<input type="datetime-local" value={pickupAtInput} onChange={(event) => setPickupAtInput(event.target.value)} className="form-input mt-1 w-full" /></label><button type="button" onClick={schedulePickup} className="btn-primary text-xs">Konfirmasi Jadwal</button>{scheduleError && <p role="alert" className="text-xs text-rose-700">{scheduleError}</p>}</div>}</div>{claim.status === 'disetujui' && <div className="rounded-xl border border-slate-200 bg-white p-3"><QRCode value={claim.ticket_code} size={112} /><p className="mt-2 text-center text-[10px] font-semibold text-slate-500">Tunjukkan saat pengambilan</p></div>}</div>
        <p className="text-xs text-slate-500">Petugas akan memperbarui status setelah verifikasi dan serah terima barang.</p>
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

  const { steps, statusIndex, statusLabel, description } = getReportProgress(report);
  const timeline = events.length > 0 ? events : [{ id: report.id, title: 'Laporan dibuat', description: 'Laporan berhasil diterima sistem.', created_at: report.created_at }];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div><h1 className="text-2xl sm:text-3xl font-extrabold text-[#123356]">Lacak Laporan {report.type === 'temuan' ? 'Temuan' : 'Kehilangan'}</h1><p className="text-xs sm:text-sm text-slate-500 mt-1">Pembaruan laporanmu tercatat di sini.</p></div>
        {reports.length > 1 && <label className="text-xs text-slate-600 flex items-center gap-2">Pilih laporan<select value={report?.id || ''} onChange={(event) => router.push(`/lacak?report=${event.target.value}`)} className="form-input ml-2 py-1.5 text-sm">{<option value="" disabled>Pilih laporan</option>}{reports.map((item) => <option key={item.id} value={item.id}>{item.report_code} · {item.item_title}</option>)}</select></label>}

        <a href="mailto:cs-lnf@kampus.ac.id" className="btn-secondary text-xs flex items-center gap-2 self-start sm:self-auto"><MessageSquare className="w-4 h-4 text-slate-600" /><span>Hubungi Petugas</span></a>
      </div>

      <div className="apple-card p-6 sm:p-8 space-y-8 bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-slate-100"><div><h2 className="text-2xl font-extrabold text-[#123356]">{report.item_title}</h2><p className="text-xs text-slate-500 mt-0.5">Nomor laporan · {report.report_code}</p></div><span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800 uppercase tracking-wider inline-block">SAAT INI · {statusLabel}</span></div>
        <ol aria-label="Tahapan laporan" className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-2">
          {steps.map((step, index) => {
            const isCurrent = index === statusIndex;
            const isComplete = index < statusIndex || (isCurrent && report.status === 'selesai');

            return (
              <li key={step} aria-current={isCurrent ? 'step' : undefined} className="flex items-center gap-3 sm:flex-1 sm:flex-col sm:gap-2 sm:text-center">
                <span aria-hidden="true" className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${index <= statusIndex ? 'bg-[#123356] text-white' : 'border-2 border-slate-500 bg-white text-slate-600'}`}>
                  {isComplete ? <Check className="h-4 w-4" /> : index + 1}
                </span>
                <span className={`text-xs ${isCurrent ? 'font-bold text-[#123356]' : 'text-slate-600'}`}>
                  {step}
                  <span className="sr-only">{isComplete ? ', selesai' : isCurrent ? ', tahap saat ini' : ', belum dimulai'}</span>
                </span>
              </li>
            );
          })}
        </ol>
        <div className="p-4 sm:p-5 rounded-2xl bg-sky-50/80 border border-sky-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-sky-600 shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-sky-900">Status laporan: {statusLabel}</h3>
              <p className="text-xs text-sky-700 mt-0.5">{description}</p>
              {claim && <p className="text-xs text-sky-700 mt-1">Status klaim: {claim.status} · Tiket pengambilan: {claim.ticket_code}</p>}
            </div>
          </div>
          {report.type === 'hilang' && report.status === 'ditemukan' && !claim && <Link href="/cari" className="btn-primary text-xs inline-flex items-center gap-1.5">Cari barang yang cocok <ArrowRight className="w-3.5 h-3.5" /></Link>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"><div className="lg:col-span-8 apple-card p-6 sm:p-8 space-y-6"><h3 className="text-base font-bold text-[#123356] pb-3 border-b border-slate-100">Riwayat Aktivitas</h3><div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">{timeline.map((event) => <div key={event.id} className="relative"><div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 border-[#123356] bg-[#123356]" /><div className="flex items-center justify-between gap-2"><h4 className="text-sm font-bold text-slate-900">{event.title}</h4><span className="text-[11px] text-slate-400 shrink-0">{formatDate(event.created_at)}</span></div><p className="text-xs text-slate-500 mt-1 leading-relaxed">{event.description}</p></div>)}</div></div><div className="lg:col-span-4 apple-card p-6 space-y-5"><h3 className="text-base font-bold text-[#123356] pb-3 border-b border-slate-100">Informasi Laporan</h3><div className="space-y-4 text-xs"><div><span className="text-slate-400 block">Lokasi Kejadian</span><span className="font-bold text-slate-800 text-sm">{report.location}</span></div><div><span className="text-slate-400 block">Dilaporkan</span><span className="font-bold text-slate-800">{formatDate(report.created_at)}</span></div><div><span className="text-slate-400 block">Kategori</span><span className="font-bold text-slate-800">{report.category}</span></div></div></div></div>
    </div>
  );
}

export default function TrackingPage() {
  return <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-500">Memuat status laporan...</div>}><TrackingContent /></Suspense>;
}
