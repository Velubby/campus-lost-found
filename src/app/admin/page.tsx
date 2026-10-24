'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ShieldAlert,
  Search,
  RefreshCw,
  Check,
  X,
  Eye,
  Clock3,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Phone,
  Copy,
  CheckCheck,
  Building2,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';

import { createClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { formatDate } from '@/lib/supabase/reports';
import type { Claim, FilterStatus } from '@/types/claims';
import { STATUS_LABELS } from '@/types/claims';
import { useClaims, useClaimStats, useUpdateClaim, useBulkUpdateClaims } from '@/hooks/useClaims';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Checkbox } from '@/components/ui/Checkbox';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { ActionMenu, StatusFilter } from '@/components/ui/DropdownMenu';
import { ClaimCardSkeleton, StatsCardSkeleton } from '@/components/ui/Skeleton';

const QUICK_LOCATIONS = [
  'Pos Satpam Gerbang Utama',
  'Pos Keamanan Gedung Rektorat',
  'Pos Satpam Perpustakaan Pusat',
  'Pos Keamanan Gedung B',
];

export default function AdminPage() {
  const router = useRouter();

  // Authentication & Role Check
  const [isStaff, setIsStaff] = useState<boolean | null>(() => (isSupabaseConfigured ? null : false));

  // Filter & Search State
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Selection for Batch Actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals State
  const [viewingClaim, setViewingClaim] = useState<Claim | null>(null);
  const [pickupLocation, setPickupLocation] = useState('');
  const [isBulkApproveOpen, setIsBulkApproveOpen] = useState(false);
  const [bulkPickupLocation, setBulkPickupLocation] = useState('');
  const [isBulkRejectOpen, setIsBulkRejectOpen] = useState(false);

  // Copy Ticket Feedback
  const [copiedTicket, setCopiedTicket] = useState<string | null>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Verify staff role
  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    const checkRole = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/masuk?next=/admin');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile || profile.role !== 'satpam') {
        toast.error('Akses ditolak: halaman ini khusus petugas keamanan (satpam).');
        router.replace('/dashboard');
        return;
      }

      setIsStaff(true);
    };

    checkRole();
  }, [router]);

  // Queries & Mutations
  const {
    data: claimsData,
    isLoading: isClaimsLoading,
    isFetching: isClaimsFetching,
    error: claimsError,
    refetch: refetchClaims,
  } = useClaims(
    { status: statusFilter, search: debouncedSearch, limit: 50 },
    { enabled: isStaff === true }
  );

  const {
    data: stats,
    isLoading: isStatsLoading,
    refetch: refetchStats,
  } = useClaimStats({ enabled: isStaff === true });

  const updateClaimMutation = useUpdateClaim({
    onSuccess: () => {
      toast.success('Status klaim berhasil diperbarui');
      setViewingClaim(null);
      setPickupLocation('');
    },
    onError: (err) => {
      toast.error(err.message || 'Gagal memperbarui status klaim');
    },
  });

  const bulkUpdateMutation = useBulkUpdateClaims({
    onSuccess: (res) => {
      toast.success(`${res.data.updated} klaim berhasil diperbarui`);
      setSelectedIds([]);
      setIsBulkApproveOpen(false);
      setIsBulkRejectOpen(false);
      setBulkPickupLocation('');
    },
    onError: (err) => {
      toast.error(err.message || 'Gagal memperbarui klaim secara massal');
    },
  });

  const claims = useMemo(() => claimsData?.claims || [], [claimsData]);

  // List of claims that can still be processed (diajukan or ditinjau)
  const processableVisibleClaims = useMemo(() => {
    return claims.filter((c) => c.status === 'diajukan' || c.status === 'ditinjau');
  }, [claims]);

  const allProcessableSelected =
    processableVisibleClaims.length > 0 &&
    processableVisibleClaims.every((c) => selectedIds.includes(c.id));

  const toggleSelectAll = () => {
    if (allProcessableSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(processableVisibleClaims.map((c) => c.id));
    }
  };

  const toggleSelectClaim = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleCopyTicket = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedTicket(code);
    toast.success(`Kode tiket ${code} disalin`);
    setTimeout(() => setCopiedTicket(null), 2000);
  };

  const handleOpenDetail = (claim: Claim) => {
    setViewingClaim(claim);
    setPickupLocation(claim.pickup_location || 'Pos Satpam Gerbang Utama');
  };

  const handleSingleUpdate = (claimId: string, status: 'ditinjau' | 'disetujui' | 'ditolak', location?: string) => {
    updateClaimMutation.mutate({
      claimId,
      status,
      pickupLocation: status === 'disetujui' ? location || pickupLocation || 'Pos Satpam Gerbang Utama' : undefined,
    });
  };

  const handleBulkApprove = () => {
    if (!bulkPickupLocation.trim()) {
      toast.error('Tentukan lokasi pengambilan barang terlebih dahulu');
      return;
    }
    bulkUpdateMutation.mutate({
      claimIds: selectedIds,
      status: 'disetujui',
      pickupLocation: bulkPickupLocation.trim(),
    });
  };

  const handleBulkReject = () => {
    bulkUpdateMutation.mutate({
      claimIds: selectedIds,
      status: 'ditolak',
    });
  };

  const handleBulkMarkReview = () => {
    bulkUpdateMutation.mutate({
      claimIds: selectedIds,
      status: 'ditinjau',
    });
  };

  const handleRefresh = () => {
    refetchClaims();
    refetchStats();
    toast.info('Memperbarui data klaim...');
  };

  if (isStaff === null) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-500">
        Memeriksa hak akses petugas keamanan...
      </div>
    );
  }

  if (isStaff === false) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 text-sky-800">
            <ShieldAlert className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Ruang Kerja Petugas Keamanan
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#123356] mt-1">
            Verifikasi Klaim Barang
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Cocokkan ciri rahasia dari pemohon sebelum menyetujui serah terima barang temuan.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            loading={isClaimsFetching}
            className="min-h-[44px]"
          >
            <RefreshCw className={`w-4 h-4 ${isClaimsFetching ? 'animate-spin' : ''}`} />
            <span>Muat Ulang</span>
          </Button>
        </div>
      </header>

      {/* Stats Cards */}
      <section aria-label="Statistik Klaim" className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {isStatsLoading ? (
          <>
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setStatusFilter('semua')}
              className={`apple-card p-4 sm:p-5 text-left transition-all cursor-pointer ${
                statusFilter === 'semua' ? 'ring-2 ring-[#123356] border-[#123356]' : 'hover:border-slate-300'
              }`}
            >
              <span className="text-xs font-semibold text-slate-500 block">Total Klaim</span>
              <span className="text-2xl sm:text-3xl font-black text-[#123356] mt-1 block">
                {stats?.total ?? 0}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('diajukan')}
              className={`apple-card p-4 sm:p-5 text-left transition-all cursor-pointer ${
                statusFilter === 'diajukan' ? 'ring-2 ring-amber-500 border-amber-500' : 'hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-xs font-semibold text-slate-500">Menunggu</span>
              </div>
              <span className="text-2xl sm:text-3xl font-black text-amber-800 mt-1 block">
                {stats?.pending ?? 0}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('ditinjau')}
              className={`apple-card p-4 sm:p-5 text-left transition-all cursor-pointer ${
                statusFilter === 'ditinjau' ? 'ring-2 ring-sky-600 border-sky-600' : 'hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-500" />
                <span className="text-xs font-semibold text-slate-500">Ditinjau</span>
              </div>
              <span className="text-2xl sm:text-3xl font-black text-sky-800 mt-1 block">
                {stats?.underReview ?? 0}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('disetujui')}
              className={`apple-card p-4 sm:p-5 text-left transition-all cursor-pointer ${
                statusFilter === 'disetujui' ? 'ring-2 ring-emerald-600 border-emerald-600' : 'hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-semibold text-slate-500">Disetujui</span>
              </div>
              <span className="text-2xl sm:text-3xl font-black text-emerald-800 mt-1 block">
                {stats?.approved ?? 0}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('ditolak')}
              className={`apple-card p-4 sm:p-5 text-left transition-all cursor-pointer col-span-2 lg:col-span-1 ${
                statusFilter === 'ditolak' ? 'ring-2 ring-rose-500 border-rose-500' : 'hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span className="text-xs font-semibold text-slate-500">Ditolak</span>
              </div>
              <span className="text-2xl sm:text-3xl font-black text-rose-800 mt-1 block">
                {stats?.rejected ?? 0}
              </span>
            </button>
          </>
        )}
      </section>

      {/* Filter and Search Controls */}
      <section aria-label="Pencarian dan Filter" className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari tiket, nama pemohon, NIM, atau barang..."
            className="form-input form-input-icon-left w-full text-xs sm:text-sm min-h-[44px]"
            aria-label="Cari klaim"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-md"
              aria-label="Hapus kata kunci pencarian"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Filter for Mobile */}
        <div className="sm:hidden">
          <StatusFilter value={statusFilter} onChange={setStatusFilter} className="w-full justify-between" />
        </div>

        {/* Status Filter Buttons for Tablet & Desktop */}
        <div className="hidden sm:flex flex-wrap gap-1.5 bg-black/4 p-1 rounded-xl border border-black/5">
          {(['semua', 'diajukan', 'ditinjau', 'disetujui', 'ditolak'] as FilterStatus[]).map((status) => {
            const count =
              status === 'semua'
                ? stats?.total
                : status === 'diajukan'
                ? stats?.pending
                : status === 'ditinjau'
                ? stats?.underReview
                : status === 'disetujui'
                ? stats?.approved
                : stats?.rejected;

            return (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  statusFilter === status
                    ? 'bg-[#123356] text-white shadow-sm'
                    : 'text-slate-700 hover:bg-white/60'
                }`}
              >
                <span>{STATUS_LABELS[status]}</span>
                {count !== undefined && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      statusFilter === status
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Floating / Sticky Batch Actions Bar */}
      {selectedIds.length > 0 && (
        <aside
          aria-label="Aksi Massal"
          className="sticky top-20 z-30 bg-[#123356] text-white p-4 rounded-2xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-sky-400 animate-pulse" />
            <span className="text-sm font-bold">
              {selectedIds.length} klaim dipilih
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleBulkMarkReview}
              loading={bulkUpdateMutation.isPending}
              className="text-xs bg-white/10 hover:bg-white/20 text-white border-white/20 min-h-[40px]"
            >
              <Eye className="w-3.5 h-3.5" />
              Tandai Ditinjau
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setBulkPickupLocation('Pos Satpam Gerbang Utama');
                setIsBulkApproveOpen(true);
              }}
              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white border-transparent min-h-[40px]"
            >
              <Check className="w-3.5 h-3.5" />
              Setujui Terpilih
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsBulkRejectOpen(true)}
              className="text-xs min-h-[40px]"
            >
              <X className="w-3.5 h-3.5" />
              Tolak Terpilih
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds([])}
              className="text-xs text-slate-300 hover:text-white hover:bg-white/10 min-h-[40px]"
            >
              Batal
            </Button>
          </div>
        </aside>
      )}

      {/* Error State */}
      {claimsError && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <div className="flex-1">
            <p className="font-bold">Gagal memuat daftar klaim</p>
            <p className="mt-0.5">{claimsError.message}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetchClaims()} className="text-xs min-h-[36px]">
            Coba Lagi
          </Button>
        </div>
      )}

      {/* Claims List Header with Select All */}
      {claims.length > 0 && processableVisibleClaims.length > 0 && (
        <div className="flex items-center justify-between text-xs text-slate-500 px-2">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <Checkbox
              checked={allProcessableSelected}
              onCheckedChange={toggleSelectAll}
              aria-label="Pilih semua klaim yang belum diproses"
            />
            <span className="font-medium text-slate-700">
              Pilih semua klaim aktif ({processableVisibleClaims.length})
            </span>
          </label>
          <span>Menampilkan {claims.length} klaim</span>
        </div>
      )}

      {/* Error State */}
      {claimsError && (
        <div className="apple-card bg-rose-50 border border-rose-200 p-8 text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-rose-400" />
          <h2 className="mt-3 text-base font-bold text-rose-800">Gagal memuat daftar klaim</h2>
          <p className="mt-1 text-xs text-rose-700 max-w-sm mx-auto">
            {claimsError.message || 'Terjadi kesalahan saat memuat data. Periksa koneksi dan coba lagi.'}
          </p>
          <div className="mt-4">
            <Button variant="outline" size="sm" onClick={handleRefresh} className="text-xs border-rose-300 text-rose-700 hover:bg-rose-100">
              Coba Lagi
            </Button>
          </div>
        </div>
      )}

      {/* Loading Skeletons */}
      {isClaimsLoading && (
        <div className="grid gap-4">
          <ClaimCardSkeleton />
          <ClaimCardSkeleton />
          <ClaimCardSkeleton />
        </div>
      )}

      {/* Empty State */}
      {!isClaimsLoading && claims.length === 0 && (
        <div className="apple-card bg-white p-12 text-center">
          <Clock3 className="mx-auto h-10 w-10 text-slate-400" />
          <h2 className="mt-3 text-base font-bold text-[#123356]">
            {searchQuery
              ? `Tidak ada hasil pencarian untuk "${searchQuery}"`
              : statusFilter !== 'semua'
              ? `Tidak ada klaim berstatus ${STATUS_LABELS[statusFilter]}`
              : 'Belum ada pengajuan klaim'}
          </h2>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery
              ? 'Periksa kembali ejaan tiket, nama mahasiswa, atau gunakan kata kunci lain.'
              : 'Klaim baru dari pemilik barang akan otomatis tercatat di halaman ini.'}
          </p>
          {(searchQuery || statusFilter !== 'semua') && (
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('semua');
                }}
                className="text-xs"
              >
                Tampilkan Semua Klaim
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Claims Cards */}
      {!isClaimsLoading && claims.length > 0 && (
        <div className="grid gap-4">
          {claims.map((claim) => {
            const isProcessable = claim.status === 'diajukan' || claim.status === 'ditinjau';
            const isSelected = selectedIds.includes(claim.id);

            return (
              <article
                key={claim.id}
                className={`apple-card bg-white p-5 sm:p-6 transition-all ${
                  isSelected ? 'border-sky-500 bg-sky-50/20 shadow-md' : ''
                }`}
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  {/* Left: Checkbox + Thumbnail + Details */}
                  <div className="flex min-w-0 items-start gap-4">
                    {/* Checkbox (only if claim can be processed) */}
                    <div className="pt-1">
                      {isProcessable ? (
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelectClaim(claim.id)}
                          aria-label={`Pilih klaim tiket ${claim.ticket_code}`}
                        />
                      ) : (
                        <div className="w-5 h-5 flex items-center justify-center text-slate-300">
                          {claim.status === 'disetujui' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-rose-500" />
                          )}
                        </div>
                      )}
                    </div>

                    {/* Item Image */}
                    {claim.item?.image_url ? (
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100 border border-slate-200">
                        <Image
                          src={claim.item.image_url}
                          alt={claim.item.title}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-slate-100 border border-slate-200 text-slate-400">
                        <Eye className="h-6 w-6" />
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-bold text-base text-[#123356] leading-snug">
                          {claim.item?.title || 'Barang temuan'}
                        </h2>
                        <Badge variant="status" status={claim.status} dot>
                          {STATUS_LABELS[claim.status]}
                        </Badge>
                      </div>

                      {/* Ticket Code Tag */}
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => handleCopyTicket(claim.ticket_code)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono font-bold transition-colors"
                          title="Klik untuk menyalin kode tiket"
                        >
                          <span>Tiket {claim.ticket_code}</span>
                          {copiedTicket === claim.ticket_code ? (
                            <CheckCheck className="w-3.5 h-3.5 text-emerald-700" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-slate-400" />
                          )}
                        </button>
                        <span className="text-slate-400">·</span>
                        <span className="text-slate-500">{formatDate(claim.created_at)}</span>
                      </div>

                      {/* Claimant Identity */}
                      <div className="text-xs text-slate-700 pt-0.5">
                        <p>
                          Pemohon:{' '}
                          <strong className="text-slate-900">
                            {claim.claimant?.full_name || 'Nama belum diisi'}
                          </strong>
                          {claim.claimant?.student_number && (
                            <span className="text-slate-500"> (NIM {claim.claimant.student_number})</span>
                          )}
                        </p>
                        {(claim.claimant?.faculty || claim.claimant?.study_program) && (
                          <p className="text-slate-500">
                            {[claim.claimant.faculty, claim.claimant.study_program].filter(Boolean).join(', ')}
                          </p>
                        )}
                      </div>

                      {/* Location & Contact Phone */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
                        <span className="flex items-center gap-1 text-slate-600">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          Lokasi temuan: {claim.item?.location || 'Tidak tercatat'}
                        </span>
                        {claim.contact_phone && (
                          <a
                            href={`https://wa.me/${claim.contact_phone.replace(/^0/, '62').replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-semibold"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            {claim.contact_phone}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>

                      {/* Pickup Info if Approved */}
                      {claim.status === 'disetujui' && claim.pickup_location && (
                        <div className="mt-2 rounded-lg bg-emerald-50 border border-emerald-200 p-2 text-xs text-emerald-900">
                          <strong>Pos Pengambilan:</strong> {claim.pickup_location}
                          {claim.pickup_at && (
                            <span className="block text-emerald-700 mt-0.5">
                              Jadwal serah terima: {formatDate(claim.pickup_at)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Quick Action Buttons on Desktop, ActionMenu on Mobile */}
                  <div className="hidden sm:flex shrink-0 flex-wrap items-center gap-2 pt-2 lg:pt-0">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => handleOpenDetail(claim)}
                      className="text-xs min-h-[44px]"
                    >
                      <Eye className="w-4 h-4 text-sky-800" />
                      Lihat Verifikasi
                    </Button>

                    {claim.status === 'diajukan' && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleSingleUpdate(claim.id, 'ditinjau')}
                        loading={updateClaimMutation.isPending}
                        className="text-xs min-h-[44px]"
                      >
                        Mulai Tinjau
                      </Button>
                    )}

                    {isProcessable && (
                      <>
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={() => handleOpenDetail(claim)}
                          className="bg-emerald-700 hover:bg-emerald-800 text-xs min-h-[44px]"
                        >
                          <Check className="w-4 h-4" />
                          Setujui
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleSingleUpdate(claim.id, 'ditolak')}
                          loading={updateClaimMutation.isPending}
                          className="text-rose-700 border-rose-200 hover:bg-rose-50 text-xs min-h-[44px]"
                        >
                          <X className="w-4 h-4" />
                          Tolak
                        </Button>
                      </>
                    )}
                  </div>

                  <div className="sm:hidden pt-2 flex items-center justify-end">
                    <ActionMenu
                      claimId={claim.id}
                      currentStatus={claim.status}
                      onView={() => handleOpenDetail(claim)}
                      onUpdate={(id, status) => {
                        if (status === 'disetujui') {
                          handleOpenDetail(claim);
                        } else {
                          handleSingleUpdate(id, status);
                        }
                      }}
                      disabled={updateClaimMutation.isPending}
                    />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Detail & Single Approval Modal */}
      {viewingClaim && (
        <Modal
          open={Boolean(viewingClaim)}
          onOpenChange={(open) => !open && setViewingClaim(null)}
          title="Verifikasi Bukti Kepemilikan"
          description={`Tiket ${viewingClaim.ticket_code} · Diajukan pada ${formatDate(viewingClaim.created_at)}`}
          size="lg"
        >
          <div className="space-y-6">
            {/* Claimant Confidential Answers */}
            <div className="rounded-xl bg-amber-50/70 border border-amber-200 p-4">
              <span className="text-xs font-bold text-amber-900 uppercase tracking-wide block">
                Ciri privat yang dijelaskan pemohon:
              </span>
              <p className="mt-2 whitespace-pre-line text-sm text-slate-800 leading-relaxed font-medium">
                {viewingClaim.private_answers}
              </p>
            </div>

            {/* Profile & Item Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="rounded-xl border border-slate-200 p-3.5 space-y-1">
                <span className="text-slate-500 font-semibold uppercase tracking-wider block">
                  Data Pemohon
                </span>
                <p className="text-sm font-bold text-slate-900">
                  {viewingClaim.claimant?.full_name}
                </p>
                <p className="text-slate-600">
                  NIM: {viewingClaim.claimant?.student_number || 'Belum diisi'}
                </p>
                <p className="text-slate-600">
                  Fakultas: {viewingClaim.claimant?.faculty || 'Belum diisi'}
                </p>
                <p className="text-slate-600">
                  Program Studi: {viewingClaim.claimant?.study_program || 'Belum diisi'}
                </p>
                {viewingClaim.contact_phone && (
                  <p className="text-slate-600">
                    No. Telepon: {viewingClaim.contact_phone}
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 p-3.5 space-y-1">
                <span className="text-slate-500 font-semibold uppercase tracking-wider block">
                  Informasi Barang Temuan
                </span>
                <p className="text-sm font-bold text-slate-900">
                  {viewingClaim.item?.title}
                </p>
                <p className="text-slate-600">
                  Lokasi: {viewingClaim.item?.location}
                </p>
                <p className="text-slate-600">
                  Status saat ini: {STATUS_LABELS[viewingClaim.status]}
                </p>
              </div>
            </div>

            {/* Pickup Location Configuration */}
            {viewingClaim.status !== 'ditolak' && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label htmlFor="pickup-input" className="text-xs font-bold text-slate-700 block">
                  Tentukan Pos Keamanan untuk Pengambilan Barang
                </label>
                <input
                  id="pickup-input"
                  type="text"
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                  placeholder="Contoh: Pos Satpam Gerbang Utama"
                  className="form-input w-full text-sm"
                />

                {/* Quick Chips */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-slate-500 mr-1">Pilihan cepat:</span>
                  {QUICK_LOCATIONS.map((loc) => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => setPickupLocation(loc)}
                      className={`text-[11px] px-2.5 py-1 rounded-md border transition-colors ${
                        pickupLocation === loc
                          ? 'bg-[#123356] text-white border-[#123356]'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Setelah disetujui, pemohon dapat melihat lokasi ini dan memilih jam pengambilan pada tiket mereka.
                </p>
              </div>
            )}

            {/* Action Buttons in Modal */}
            <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setViewingClaim(null)}
                disabled={updateClaimMutation.isPending}
              >
                Tutup
              </Button>

              {viewingClaim.status !== 'ditolak' && viewingClaim.status !== 'disetujui' && (
                <>
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => handleSingleUpdate(viewingClaim.id, 'ditolak')}
                    loading={updateClaimMutation.isPending}
                    className="text-rose-700 border-rose-200 hover:bg-rose-50"
                  >
                    <X className="w-4 h-4" />
                    Tolak Klaim
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => handleSingleUpdate(viewingClaim.id, 'disetujui', pickupLocation)}
                    loading={updateClaimMutation.isPending}
                    className="bg-emerald-700 hover:bg-emerald-800"
                  >
                    <Check className="w-4 h-4" />
                    Setujui Klaim
                  </Button>
                </>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Bulk Approval Modal */}
      <Modal
        open={isBulkApproveOpen}
        onOpenChange={setIsBulkApproveOpen}
        title="Setujui Klaim Terpilih"
        description={`Anda akan menyetujui ${selectedIds.length} klaim sekaligus.`}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="bulk-pickup" className="text-xs font-bold text-slate-700 block mb-1">
              Lokasi Pengambilan Barang untuk Klaim Terpilih
            </label>
            <input
              id="bulk-pickup"
              type="text"
              value={bulkPickupLocation}
              onChange={(e) => setBulkPickupLocation(e.target.value)}
              placeholder="Contoh: Pos Satpam Gerbang Utama"
              className="form-input w-full text-sm"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {QUICK_LOCATIONS.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => setBulkPickupLocation(loc)}
                  className={`text-[11px] px-2.5 py-1 rounded-md border transition-colors ${
                    bulkPickupLocation === loc
                      ? 'bg-[#123356] text-white border-[#123356]'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              variant="secondary"
              onClick={() => setIsBulkApproveOpen(false)}
              disabled={bulkUpdateMutation.isPending}
            >
              Batal
            </Button>
            <Button
              variant="primary"
              onClick={handleBulkApprove}
              loading={bulkUpdateMutation.isPending}
              className="bg-emerald-700 hover:bg-emerald-800"
            >
              Setujui {selectedIds.length} Klaim
            </Button>
          </div>
        </div>
      </Modal>

      {/* Bulk Rejection Modal */}
      <ConfirmModal
        open={isBulkRejectOpen}
        onOpenChange={setIsBulkRejectOpen}
        title="Tolak Klaim Terpilih"
        message={`Apakah Anda yakin ingin menolak ${selectedIds.length} klaim sekaligus? Tindakan ini tidak dapat dibatalkan.`}
        confirmText={`Tolak ${selectedIds.length} Klaim`}
        cancelText="Batal"
        variant="destructive"
        loading={bulkUpdateMutation.isPending}
        onConfirm={handleBulkReject}
      />
    </div>
  );
}

