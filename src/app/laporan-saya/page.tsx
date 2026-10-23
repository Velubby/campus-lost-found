'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Plus, FileEdit, MessageSquare, Trash2 } from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { fetchUserReports, formatDate, type UserReportRow } from '@/lib/supabase/reports';

type ReportTab = 'aktif' | 'draf' | 'selesai' | 'klaim';

const statusLabel: Record<ReportTab, string> = {
  aktif: 'Aktif',
  draf: 'Draf',
  selesai: 'Selesai',
  klaim: 'Klaim',
};

export default function MyReportsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ReportTab>('aktif');
  const [reports, setReports] = useState<UserReportRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setError('Supabase belum dikonfigurasi.');
      setIsLoading(false);
      return;
    }

    fetchUserReports()
      .then(({ user, reports: userReports }) => {
        if (!user) {
          router.replace('/masuk?next=/laporan-saya');
          return;
        }
        setReports(userReports);
      })
      .catch(() => setError('Laporan belum dapat dimuat.'))
      .finally(() => setIsLoading(false));
  }, [router]);

  const counts = useMemo(() => ({
    aktif: reports.filter((report) => ['aktif', 'ditemukan'].includes(report.status)).length,
    draf: reports.filter((report) => report.status === 'draf').length,
    selesai: reports.filter((report) => report.status === 'selesai').length,
    klaim: reports.filter((report) => report.status === 'klaim').length,
  }), [reports]);

  const filteredReports = reports.filter((report) => {
    if (activeTab === 'aktif') return ['aktif', 'ditemukan'].includes(report.status);
    return report.status === activeTab;
  });

  const deleteDraft = async (reportId: string) => {
    const { createClient } = await import('@/lib/supabase/client');
    const { error: deleteError } = await createClient().from('reports').delete().eq('id', reportId);
    if (deleteError) {
      setError('Draf belum dapat dihapus.');
      return;
    }
    setReports((current) => current.filter((report) => report.id !== reportId));
  };

  if (isLoading) return <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-500">Memuat laporan...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4"><div><h1 className="text-2xl sm:text-3xl font-extrabold text-[#123356]">Laporan Saya</h1><p className="text-xs sm:text-sm text-slate-500 mt-1">Pantau laporan yang dibuat dengan akunmu.</p></div><Link href="/lapor" className="btn-primary text-xs flex items-center gap-2 self-start sm:self-auto"><Plus className="w-4 h-4" /><span>Buat Laporan Baru</span></Link></div>
      {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">{error}</div>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">{(['aktif', 'draf', 'selesai', 'klaim'] as ReportTab[]).map((tab) => <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={`apple-card p-5 text-left transition-all ${activeTab === tab ? 'ring-2 ring-[#123356] bg-white' : 'bg-white/80'}`}><span className="text-3xl font-black text-[#123356] block">{counts[tab]}</span><span className="text-xs font-bold text-slate-800 mt-1 block">{statusLabel[tab]}</span></button>)}</div>

      <div className="segmented-control p-1 bg-slate-200/60 rounded-xl">{(['aktif', 'draf', 'selesai', 'klaim'] as ReportTab[]).map((tab) => <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={`segmented-control-btn ${activeTab === tab ? 'active' : ''}`}>{statusLabel[tab]} {counts[tab]}</button>)}</div>

      <div className="space-y-4">{filteredReports.length > 0 ? filteredReports.map((report) => <div key={report.id} className="apple-card p-5 sm:p-6 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"><div className="flex items-start gap-4">{report.image_url ? <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200"><Image src={report.image_url} alt={report.item_title} fill sizes="96px" className="object-cover" /></div> : <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0 border border-slate-200"><FileEdit className="w-8 h-8" /></div>}<div className="space-y-1"><div className="flex items-center gap-2 flex-wrap"><h3 className="text-base sm:text-lg font-bold text-[#123356]">{report.item_title}</h3><span className="text-xs text-slate-400 font-medium">{report.report_code} · {report.type === 'hilang' ? 'Barang hilang' : 'Barang temuan'}</span></div><p className="text-xs text-slate-600 leading-relaxed max-w-xl">{report.public_description}</p><div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400"><span>{formatDate(report.updated_at)}</span><span>·</span><span>{report.location}</span></div></div></div><div className="flex flex-col sm:items-end gap-3 w-full sm:w-auto shrink-0"><span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider self-start sm:self-auto bg-slate-100 text-slate-700">{report.status}</span><div className="flex items-center gap-2 w-full sm:w-auto">{report.status === 'draf' && <button type="button" onClick={() => deleteDraft(report.id)} className="btn-secondary text-xs py-2 px-3 text-rose-600 hover:text-rose-700"><Trash2 className="w-3.5 h-3.5" /></button>}{report.status !== 'draf' && <Link href={`/lacak?report=${report.id}`} className="btn-primary text-xs py-2 px-3 flex-1 sm:flex-initial">Lacak Status</Link>}<a href="mailto:cs-lnf@kampus.ac.id" className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5" /><span>Petugas</span></a></div></div></div>) : <div className="apple-card p-12 text-center text-slate-500 text-xs">Belum ada laporan di tab {statusLabel[activeTab]}.</div>}</div>
    </div>
  );
}
