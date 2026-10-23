'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Check, Clock3, Eye, ShieldAlert, X } from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/client';
import { formatDate } from '@/lib/supabase/reports';

type ClaimStatus = 'diajukan' | 'ditinjau' | 'disetujui' | 'ditolak';
type FilterStatus = ClaimStatus | 'semua';

type Claim = {
  id: string;
  item_id: string;
  user_id: string;
  private_answers: string;
  contact_phone: string;
  status: ClaimStatus;
  ticket_code: string;
  pickup_location: string | null;
  pickup_at: string | null;
  created_at: string;
  item?: { title: string; location: string; image_url: string | null };
  claimant?: { full_name: string; student_number: string | null; faculty: string | null; study_program: string | null };
};

const statusLabels: Record<FilterStatus, string> = {
  semua: 'Semua',
  diajukan: 'Diajukan',
  ditinjau: 'Ditinjau',
  disetujui: 'Disetujui',
  ditolak: 'Ditolak',
};

export default function AdminPage() {
  const router = useRouter();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [filter, setFilter] = useState<FilterStatus>('diajukan');
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isStaff, setIsStaff] = useState(false);
  const [pickupLocation, setPickupLocation] = useState('');

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setError('Supabase belum dikonfigurasi.');
      setIsLoading(false);
      return;
    }

    const loadClaims = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/masuk?next=/admin');
        return;
      }

      const { data: profile, error: profileError } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (profileError || !profile || profile.role !== 'satpam') {
        router.replace('/dashboard');
        return;
      }
      setIsStaff(true);

      const { data: claimRows, error: claimsError } = await supabase
        .from('claims')
        .select('id, item_id, user_id, private_answers, contact_phone, status, ticket_code, pickup_location, pickup_at, created_at')
        .order('created_at', { ascending: false });
      if (claimsError) throw claimsError;

      const rows = claimRows || [];
      const itemIds = [...new Set(rows.map((claim) => claim.item_id))];
      const userIds = [...new Set(rows.map((claim) => claim.user_id))];
      const [{ data: items }, { data: profiles }] = await Promise.all([
        supabase.from('items').select('id, title, location, image_url').in('id', itemIds),
        supabase.from('profiles').select('id, full_name, student_number, faculty, study_program').in('id', userIds),
      ]);

      const itemMap = new Map((items || []).map((item) => [item.id, item]));
      const profileMap = new Map((profiles || []).map((profile) => [profile.id, profile]));
      setClaims(rows.map((claim) => ({ ...claim, item: itemMap.get(claim.item_id), claimant: profileMap.get(claim.user_id) })) as Claim[]);
    };

    loadClaims().catch(() => setError('Data klaim belum dapat dimuat.')).finally(() => setIsLoading(false));
  }, [router]);

  const visibleClaims = useMemo(() => filter === 'semua' ? claims : claims.filter((claim) => claim.status === filter), [claims, filter]);

  const updateClaim = async (claim: Claim, status: ClaimStatus) => {
    const { error: updateError } = await createClient().from('claims').update({
      status,
      pickup_location: status === 'disetujui' ? pickupLocation || claim.pickup_location : claim.pickup_location,
    }).eq('id', claim.id);
    if (updateError) {
      setError('Status klaim belum dapat diperbarui. Jalankan schema terbaru dan coba lagi.');
      return;
    }
    setClaims((current) => current.map((item) => item.id === claim.id ? { ...item, status, pickup_location: pickupLocation || item.pickup_location } : item));
    setSelectedClaim((current) => current ? { ...current, status, pickup_location: pickupLocation || current.pickup_location } : null);
  };

  if (isLoading) return <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-500">Memuat ruang kerja petugas...</div>;
  if (!isStaff) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <header className="flex flex-col gap-2 border-b border-slate-200 pb-5"><div className="flex items-center gap-2 text-sky-700"><ShieldAlert className="w-5 h-5" /><span className="text-xs font-bold uppercase tracking-widest">Ruang kerja petugas</span></div><h1 className="text-3xl font-extrabold text-[#123356]">Klaim barang</h1><p className="text-sm text-slate-500">Periksa ciri privat sebelum menyetujui serah terima barang.</p></header>
      {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800">{error}</div>}
      <div className="flex flex-wrap gap-2">{(['diajukan', 'ditinjau', 'disetujui', 'ditolak', 'semua'] as FilterStatus[]).map((status) => <button key={status} type="button" onClick={() => setFilter(status)} className={`min-h-11 rounded-xl border px-4 text-xs font-semibold ${filter === status ? 'border-[#123356] bg-[#123356] text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}>{statusLabels[status]} {status === 'semua' ? claims.length : claims.filter((claim) => claim.status === status).length}</button>)}</div>

      {visibleClaims.length === 0 ? <div className="apple-card bg-white p-12 text-center"><Clock3 className="mx-auto h-8 w-8 text-slate-400" /><h2 className="mt-3 text-base font-bold text-[#123356]">Tidak ada klaim di status ini</h2><p className="mt-1 text-sm text-slate-500">Klaim baru akan muncul setelah pengguna mengirim verifikasi.</p></div> : <div className="grid gap-4">{visibleClaims.map((claim) => <article key={claim.id} className="apple-card bg-white p-5 sm:p-6"><div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between"><div className="flex min-w-0 items-start gap-4">{claim.item?.image_url ? <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100"><Image src={claim.item.image_url} alt={claim.item.title} fill sizes="80px" className="object-cover" /></div> : <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400"><Eye className="h-6 w-6" /></div>}<div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="font-bold text-[#123356]">{claim.item?.title || 'Barang tidak tersedia'}</h2><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase text-slate-700">{statusLabels[claim.status]}</span></div><p className="mt-1 text-xs text-slate-500">Tiket {claim.ticket_code} · {formatDate(claim.created_at)}</p><p className="mt-2 text-xs text-slate-600">Pemohon: <strong>{claim.claimant?.full_name || 'Profil tidak tersedia'}</strong>{claim.claimant?.student_number ? ` · NIM ${claim.claimant.student_number}` : ''}</p><p className="text-xs text-slate-500">{claim.item?.location || 'Lokasi tidak tersedia'} · {claim.contact_phone}</p></div></div><div className="flex shrink-0 flex-wrap gap-2"><button type="button" onClick={() => setSelectedClaim(claim)} className="btn-secondary text-xs"><Eye className="h-4 w-4" /> Lihat Verifikasi</button>{claim.status !== 'disetujui' && <button type="button" onClick={() => updateClaim(claim, 'disetujui')} className="btn-primary bg-emerald-700 text-xs"><Check className="h-4 w-4" /> Setujui</button>}{claim.status !== 'ditolak' && <button type="button" onClick={() => updateClaim(claim, 'ditolak')} className="btn-secondary text-xs text-rose-700"><X className="h-4 w-4" /> Tolak</button>}</div></div></article>)}</div>}

      {selectedClaim && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-label="Detail verifikasi klaim"><div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><span className="text-xs font-bold uppercase tracking-widest text-sky-700">Verifikasi privat</span><h2 className="mt-1 text-xl font-extrabold text-[#123356]">{selectedClaim.item?.title}</h2></div><button type="button" onClick={() => setSelectedClaim(null)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Tutup"><X className="h-5 w-5" /></button></div><div className="mt-5 space-y-4"><div><span className="text-xs font-semibold text-slate-500">Ciri dan jawaban pemohon</span><p className="mt-1 whitespace-pre-line rounded-xl bg-slate-50 p-4 text-sm text-slate-800">{selectedClaim.private_answers}</p></div><div><span className="text-xs font-semibold text-slate-500">Profil</span><p className="mt-1 text-sm text-slate-700">{selectedClaim.claimant?.full_name} · {selectedClaim.claimant?.student_number || 'NIM belum diisi'}</p><p className="text-xs text-slate-500">{selectedClaim.claimant?.faculty || 'Fakultas belum diisi'} · {selectedClaim.claimant?.study_program || 'Program studi belum diisi'}</p></div><label className="text-xs font-semibold text-slate-600">Lokasi pengambilan<input value={pickupLocation} onChange={(event) => setPickupLocation(event.target.value)} className="form-input mt-1 w-full" placeholder="Pos Keamanan Gedung B" /></label><p className="text-xs text-slate-500">Tanggal dan jam pengambilan akan dipilih oleh claimant setelah klaim disetujui.</p><div className="flex justify-end gap-2"><button type="button" onClick={() => updateClaim(selectedClaim, 'ditolak')} className="btn-secondary text-xs text-rose-700">Tolak</button><button type="button" onClick={() => updateClaim(selectedClaim, 'disetujui')} className="btn-primary text-xs bg-emerald-700">Setujui Klaim</button></div></div></div></div>}
    </div>
  );
}
