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
  FileText,
  Tag,
  MapPin,
  User,
  ShieldCheck,
  MessageCircle,
} from 'lucide-react';
import { toast } from 'sonner';

import { createClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { formatDate } from '@/lib/supabase/reports';
import type { Claim, FilterStatus, LostReport, FilterReportStatus } from '@/types/claims';
import { STATUS_LABELS, REPORT_STATUS_LABELS, REPORT_STATUS_COLORS } from '@/types/claims';
import { fetchLostReportsAction, updateReportStatusAction } from '@/app/admin/actions';
import { useClaims, useClaimStats, useUpdateClaim, useBulkUpdateClaims } from '@/hooks/useClaims';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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

  // Reject with reason modal state (prevents missclick)
  const [rejectingClaim, setRejectingClaim] = useState<Claim | null>(null);
  const [rejectReason, setRejectReason] = useState('Ciri rahasia yang diberikan belum sesuai dengan barang temuan.');

  // Active Tab
  const [activeTab, setActiveTab] = useState<'klaim' | 'laporan-hilang'>('klaim');

  // Lost Reports State
  const [reportStatusFilter, setReportStatusFilter] = useState<FilterReportStatus>('semua');
  const [viewingReport, setViewingReport] = useState<LostReport | null>(null);
  const [isUpdatingReport, setIsUpdatingReport] = useState(false);

  // Chain-of-custody & Found Report Modal State
  const [markingFoundReport, setMarkingFoundReport] = useState<LostReport | null>(null);
  const [finderName, setFinderName] = useState('');
  const [foundLocation, setFoundLocation] = useState('');
  const [storageLocation, setStorageLocation] = useState('Pos Satpam Gerbang Utama');
  const [foundNote, setFoundNote] = useState('');

  // Complete Handover Confirmation Modal State
  const [completingReport, setCompletingReport] = useState<LostReport | null>(null);

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

  const handleOpenRejectModal = (claim: Claim) => {
    setRejectingClaim(claim);
    setRejectReason('Ciri rahasia yang diberikan belum sesuai dengan barang temuan.');
  };

  const handleConfirmReject = () => {
    if (!rejectingClaim) return;
    updateClaimMutation.mutate(
      {
        claimId: rejectingClaim.id,
        status: 'ditolak',
        rejectReason: rejectReason.trim() || undefined,
      },
      {
        onSuccess: () => {
          setRejectingClaim(null);
          if (viewingClaim?.id === rejectingClaim.id) {
            setViewingClaim((prev) => (prev ? { ...prev, status: 'ditolak' } : null));
          }
        },
      }
    );
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

  const queryClient = useQueryClient();

  // Lost Reports Query using TanStack Query
  const {
    data: lostReportsData,
    isLoading: isReportsLoading,
    isFetching: isReportsFetching,
    error: reportsQueryError,
    refetch: refetchLostReports,
  } = useQuery({
    queryKey: ['lostReports', reportStatusFilter, debouncedSearch],
    queryFn: async () => {
      const res = await fetchLostReportsAction(undefined, 50, reportStatusFilter, debouncedSearch);
      if (!res.success) {
        throw new Error(res.error || 'Gagal memuat laporan');
      }
      return res.data;
    },
    enabled: isStaff === true && activeTab === 'laporan-hilang',
  });

  const lostReports = useMemo(() => lostReportsData?.reports || [], [lostReportsData]);
  const reportsError = reportsQueryError ? (reportsQueryError as Error).message : null;

  const getWhatsAppVerificationUrl = (report: LostReport) => {
    if (!report.contact_phone) return null;
    const phone = report.contact_phone.replace(/^0/, '62').replace(/[^0-9]/g, '');
    const reporterName = report.reporter?.full_name || 'Pelapor';
    const text = `Halo Sdr/i ${reporterName},\nKami dari Petugas Keamanan Kampus menginfokan bahwa barang yang sesuai dengan laporan kehilangan Anda ("${report.item_title}", No. Laporan: ${report.report_code}) telah ditemukan dan diamankan di posko.\n\nSilakan datang ke Pos Keamanan dengan membawa kartu identitas (KTM/KTP) dan bersiap menyebutkan/membuktikan ciri kepemilikan barang untuk proses serah terima.\n\nTerima kasih.`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  };

  const handleOpenMarkFound = (report: LostReport) => {
    setMarkingFoundReport(report);
    setFinderName('');
    setFoundLocation(report.location || '');
    setStorageLocation('Pos Satpam Gerbang Utama');
    setFoundNote('');
  };

  const handleConfirmMarkFound = async () => {
    if (!markingFoundReport) return;
    setIsUpdatingReport(true);
    try {
      const res = await updateReportStatusAction({
        reportId: markingFoundReport.id,
        status: 'ditemukan',
        finderName: finderName.trim() || undefined,
        foundLocation: foundLocation.trim() || undefined,
        storageLocation: storageLocation.trim() || undefined,
        note: foundNote.trim() || undefined,
      });
      if (res.success) {
        toast.success('Barang berhasil dicatat & status diubah ke "Ditemukan"');
        if (viewingReport && viewingReport.id === markingFoundReport.id) {
          setViewingReport((prev) => (prev ? { ...prev, status: 'ditemukan' } : null));
        }
        setMarkingFoundReport(null);
        queryClient.invalidateQueries({ queryKey: ['lostReports'] });
      } else {
        toast.error(res.error || 'Gagal mengubah status laporan');
      }
    } catch {
      toast.error('Terjadi kesalahan mengubah status');
    } finally {
      setIsUpdatingReport(false);
    }
  };

  const handleConfirmCompleteReport = async () => {
    if (!completingReport) return;
    setIsUpdatingReport(true);
    try {
      const res = await updateReportStatusAction({
        reportId: completingReport.id,
        status: 'selesai',
        note: 'Verifikasi identitas dan ciri kepemilikan berhasil. Barang telah diserahkan kembali kepada pemilik.',
      });
      if (res.success) {
        toast.success('Serah terima selesai! Status laporan diperbarui.');
        if (viewingReport && viewingReport.id === completingReport.id) {
          setViewingReport((prev) => (prev ? { ...prev, status: 'selesai' } : null));
        }
        setCompletingReport(null);
        queryClient.invalidateQueries({ queryKey: ['lostReports'] });
      } else {
        toast.error(res.error || 'Gagal menyelesaikan laporan');
      }
    } catch {
      toast.error('Terjadi kesalahan menyelesaikan laporan');
    } finally {
      setIsUpdatingReport(false);
    }
  };

  const handleRefresh = () => {
    if (activeTab === 'klaim') {
      refetchClaims();
      refetchStats();
      toast.info('Memperbarui data klaim...');
    } else {
      refetchLostReports();
      toast.info('Memperbarui data laporan kehilangan...');
    }
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
            {activeTab === 'klaim' ? 'Verifikasi Klaim Barang' : 'Daftar Laporan Barang Hilang'}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {activeTab === 'klaim'
              ? 'Cocokkan ciri rahasia dari pemohon sebelum menyetujui serah terima barang temuan.'
              : 'Pantau dan kelola laporan kehilangan yang diajukan mahasiswa dan sivitas kampus.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            loading={isClaimsFetching || isReportsFetching}
            className="min-h-[44px]"
          >
            <RefreshCw className={`w-4 h-4 ${isClaimsFetching || isReportsLoading ? 'animate-spin' : ''}`} />
            <span>Muat Ulang</span>
          </Button>
        </div>
      </header>

      {/* Primary Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('klaim')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'klaim'
              ? 'bg-[#123356] text-white shadow-sm'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <span>Klaim Barang Temuan</span>
          {stats?.pending ? (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500 text-white font-extrabold">
              {stats.pending}
            </span>
          ) : null}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('laporan-hilang')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'laporan-hilang'
              ? 'bg-[#123356] text-white shadow-sm'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <span>Laporan Barang Hilang</span>
          {lostReports.filter((r) => r.status === 'aktif').length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500 text-white font-extrabold">
              {lostReports.filter((r) => r.status === 'aktif').length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'klaim' && (
      <>
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
                          onClick={() => handleOpenRejectModal(claim)}
                          loading={updateClaimMutation.isPending}
                          className="text-rose-700 border-rose-200 hover:bg-rose-50 text-xs min-h-[44px]"
                        >
                          <X className="w-4 h-4" />
                          Tolak
                        </Button>
                      </>
                    )}

                    {claim.status === 'ditolak' && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleSingleUpdate(claim.id, 'ditinjau')}
                        loading={updateClaimMutation.isPending}
                        className="text-sky-700 border-sky-300 hover:bg-sky-50 text-xs min-h-[44px]"
                        title="Buka kembali klaim untuk peninjauan ulang jika terjadi missclick atau pemohon melengkapi bukti"
                      >
                        <RefreshCw className="w-3.5 h-3.5 mr-1" />
                        Tinjau Kembali
                      </Button>
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
      </>
      )}

      {/* LOST REPORTS TAB VIEW */}
      {activeTab === 'laporan-hilang' && (
        <div className="space-y-6">
          {/* Filter and Search Controls for Lost Reports */}
          <section aria-label="Pencarian Laporan Hilang" className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari kode tiket, nama barang, pelapor, atau lokasi..."
                className="form-input form-input-icon-left w-full text-xs sm:text-sm min-h-[44px]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 mr-1">Status:</span>
              {(['semua', 'aktif', 'ditemukan', 'selesai'] as FilterReportStatus[]).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setReportStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    reportStatusFilter === status
                      ? 'bg-[#123356] text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {REPORT_STATUS_LABELS[status]}
                </button>
              ))}
            </div>
          </section>

          {/* Counter info */}
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Menampilkan {lostReports.length} laporan kehilangan</span>
            {isReportsLoading && <span>Memuat data...</span>}
          </div>

          {/* Error State */}
          {reportsError && (
            <div className="apple-card bg-rose-50 border border-rose-200 p-8 text-center">
              <AlertCircle className="mx-auto h-10 w-10 text-rose-400" />
              <h2 className="mt-3 text-base font-bold text-rose-800">Gagal memuat laporan kehilangan</h2>
              <p className="mt-1 text-xs text-rose-700 max-w-sm mx-auto">{reportsError}</p>
              <div className="mt-4">
                <Button variant="outline" size="sm" onClick={() => refetchLostReports()} className="text-xs border-rose-300 text-rose-700 hover:bg-rose-100">
                  Coba Lagi
                </Button>
              </div>
            </div>
          )}

          {/* Loading Skeletons */}
          {isReportsLoading && (
            <div className="grid gap-4">
              <ClaimCardSkeleton />
              <ClaimCardSkeleton />
              <ClaimCardSkeleton />
            </div>
          )}

          {/* Empty State */}
          {!isReportsLoading && lostReports.length === 0 && !reportsError && (
            <div className="apple-card bg-white p-12 text-center">
              <Clock3 className="mx-auto h-10 w-10 text-slate-400" />
              <h2 className="mt-3 text-base font-bold text-[#123356]">
                {searchQuery
                  ? `Tidak ada laporan yang cocok dengan "${searchQuery}"`
                  : reportStatusFilter !== 'semua'
                  ? `Tidak ada laporan berstatus ${REPORT_STATUS_LABELS[reportStatusFilter]}`
                  : 'Belum ada laporan barang hilang yang diajukan'}
              </h2>
              <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                Laporan kehilangan yang dikirim oleh mahasiswa atau warga kampus akan muncul di sini.
              </p>
            </div>
          )}

          {/* Lost Reports Cards Grid */}
          {!isReportsLoading && lostReports.length > 0 && (
            <div className="grid gap-4">
              {lostReports.map((report) => {
                const statusColor = REPORT_STATUS_COLORS[report.status];
                return (
                  <article
                    key={report.id}
                    className="apple-card bg-white p-5 transition-shadow hover:shadow-md border border-slate-200/90"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Left: Info */}
                      <div className="space-y-3 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleCopyTicket(report.report_code)}
                            className="inline-flex items-center gap-1 font-mono text-xs font-bold text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 px-2.5 py-1 rounded-md transition-colors"
                            title="Salin nomor laporan"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>{report.report_code}</span>
                            {copiedTicket === report.report_code ? (
                              <CheckCheck className="w-3 h-3 text-emerald-600 ml-0.5" />
                            ) : (
                              <Copy className="w-3 h-3 text-slate-400 ml-0.5" />
                            )}
                          </button>

                          <Badge variant="outline" className={`${statusColor.bg} ${statusColor.text} ${statusColor.border}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusColor.dot} mr-1.5`} />
                            {REPORT_STATUS_LABELS[report.status]}
                          </Badge>

                          <span className="text-xs text-slate-400">
                            Dilaporkan {formatDate(report.created_at)}
                          </span>
                        </div>

                        <div>
                          <h3 className="text-lg font-bold text-[#123356]">
                            {report.item_title}
                          </h3>
                          <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                            {report.public_description}
                          </p>
                        </div>

                        {/* Metadata badges */}
                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            Lokasi hilang: <strong>{report.location}</strong>
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5 text-slate-400" />
                            Kategori: <strong>{report.category}</strong>
                          </span>
                          <span className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            Pelapor: <strong>{report.reporter?.full_name || 'Pengguna Kampus'}</strong>
                            {report.reporter?.student_number && ` (${report.reporter.student_number})`}
                          </span>
                          {report.contact_phone && (
                            <a
                              href={`https://wa.me/${report.contact_phone.replace(/^0/, '62').replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-semibold"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              {report.contact_phone}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>

                        {/* Secret Description Preview Notice */}
                        {report.private_description && (
                          <div className="mt-2 rounded-lg bg-amber-50/70 border border-amber-200/80 p-2.5 text-xs text-amber-900 flex items-start gap-2">
                            <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                            <div>
                              <strong className="block text-amber-950">Ciri Rahasia / Spesifik (Privat):</strong>
                              <span className="line-clamp-1 text-amber-800">{report.private_description}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right: Actions */}
                      <div className="flex shrink-0 flex-wrap lg:flex-col items-end gap-2 pt-2 lg:pt-0">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => setViewingReport(report)}
                          className="text-xs min-h-[40px]"
                        >
                          <Eye className="w-4 h-4 text-sky-800" />
                          Detail & Verifikasi
                        </Button>

                        {report.status === 'aktif' && (
                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            onClick={() => handleOpenMarkFound(report)}
                            loading={isUpdatingReport}
                            className="bg-sky-700 hover:bg-sky-800 text-xs min-h-[40px]"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Tandai Ditemukan
                          </Button>
                        )}

                        {report.status === 'ditemukan' && (
                          <div className="flex flex-wrap items-center gap-2">
                            {report.contact_phone && (
                              <a
                                href={getWhatsAppVerificationUrl(report) || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 min-h-[40px] transition-colors"
                                title="Kirim pesan verifikasi WhatsApp"
                              >
                                <MessageCircle className="w-4 h-4 text-emerald-600" />
                                <span>Hubungi WA</span>
                              </a>
                            )}
                            <Button
                              type="button"
                              variant="primary"
                              size="sm"
                              onClick={() => setCompletingReport(report)}
                              loading={isUpdatingReport}
                              className="bg-emerald-700 hover:bg-emerald-800 text-xs min-h-[40px]"
                            >
                              <Check className="w-4 h-4" />
                              Serah Terima
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
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

              {viewingClaim.status === 'ditolak' && (
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => {
                    handleSingleUpdate(viewingClaim.id, 'ditinjau');
                    setViewingClaim((prev) => (prev ? { ...prev, status: 'ditinjau' } : null));
                  }}
                  loading={updateClaimMutation.isPending}
                  className="text-sky-700 border-sky-300 hover:bg-sky-50"
                >
                  <RefreshCw className="w-4 h-4 mr-1.5" />
                  Tinjau Kembali Klaim Ini
                </Button>
              )}

              {viewingClaim.status !== 'ditolak' && viewingClaim.status !== 'disetujui' && (
                <>
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => handleOpenRejectModal(viewingClaim)}
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

      {/* Reject Confirmation Modal with Reason */}
      {rejectingClaim && (
        <Modal
          open={Boolean(rejectingClaim)}
          onOpenChange={(open) => !open && setRejectingClaim(null)}
          title="Konfirmasi Penolakan Klaim"
          description={`Tiket: ${rejectingClaim.ticket_code} · Pemohon: ${rejectingClaim.claimant?.full_name || 'Pengguna Kampus'}`}
          size="md"
        >
          <div className="space-y-4">
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 leading-relaxed">
              Penolakan klaim akan mencatat status ditolak di linimasa pemohon. Anda tetap dapat memulihkan status ke &quot;Ditinjau&quot; jika terjadi salah klik (missclick) atau pemohon membawa bukti baru.
            </div>

            <div>
              <label htmlFor="reject-reason" className="text-xs font-bold text-slate-700 block mb-1">
                Alasan Penolakan
              </label>
              <textarea
                id="reject-reason"
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Tuliskan alasan penolakan agar tercatat di audit linimasa..."
                className="form-input w-full text-xs sm:text-sm"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button
                variant="secondary"
                onClick={() => setRejectingClaim(null)}
                disabled={updateClaimMutation.isPending}
              >
                Batal
              </Button>
              <Button
                variant="outline"
                onClick={handleConfirmReject}
                loading={updateClaimMutation.isPending}
                className="bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100"
              >
                <X className="w-4 h-4 mr-1" />
                Konfirmasi Tolak Klaim
              </Button>
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

      {/* Lost Report Detail Modal */}
      {viewingReport && (
        <Modal
          open={Boolean(viewingReport)}
          onOpenChange={(open) => !open && setViewingReport(null)}
          title="Detail Laporan Barang Hilang"
          description={`Nomor Laporan: ${viewingReport.report_code} · Tanggal Lapor: ${formatDate(viewingReport.created_at)}`}
          size="lg"
        >
          <div className="space-y-6">
            {/* Header / Item overview */}
            <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-700 uppercase tracking-wider">{viewingReport.category}</span>
                <Badge variant="outline" className={`${REPORT_STATUS_COLORS[viewingReport.status].bg} ${REPORT_STATUS_COLORS[viewingReport.status].text}`}>
                  {REPORT_STATUS_LABELS[viewingReport.status]}
                </Badge>
              </div>
              <h3 className="text-xl font-extrabold text-[#123356]">{viewingReport.item_title}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                <p><strong>Lokasi Kejadian:</strong> {viewingReport.location}</p>
                <p><strong>Waktu Kejadian:</strong> {formatDate(viewingReport.incident_at)}</p>
              </div>
            </div>

            {/* Public Description */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Deskripsi Publik</h4>
              <p className="text-sm text-slate-700 bg-white p-3 rounded-xl border border-slate-200 leading-relaxed">
                {viewingReport.public_description}
              </p>
            </div>

            {/* Private Description (Secret details) */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                  Ciri Rahasia / Khusus (Kunci Verifikasi Petugas)
                </h4>
              </div>
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-950 leading-relaxed font-medium">
                {viewingReport.private_description || 'Pelapor tidak menyertakan ciri rahasia tambahan.'}
              </div>
            </div>

            {/* Blind Verification SOP Checklist for Satpam */}
            <div className="rounded-xl border border-sky-200 bg-sky-50/70 p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-sky-900 font-bold text-xs uppercase tracking-wide">
                <ShieldCheck className="w-4 h-4 text-sky-700" />
                <span>SOP Verifikasi Pemilik (Blind Verification)</span>
              </div>
              <ul className="text-xs text-sky-950 space-y-2 pl-1">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-sky-200 text-sky-900 font-bold flex items-center justify-center shrink-0 text-[10px]">1</span>
                  <span><strong>Uji lisan ciri rahasia:</strong> Jangan menyebutkan ciri khusus di atas. Minta pelapor menjelaskan sendiri detail privat barangnya.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-sky-200 text-sky-900 font-bold flex items-center justify-center shrink-0 text-[10px]">2</span>
                  <span><strong>Uji akses perangkat:</strong> Jika barang berupa ponsel/laptop, minta pelapor membuka sandi/pola/biometrik di hadapan petugas.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-sky-200 text-sky-900 font-bold flex items-center justify-center shrink-0 text-[10px]">3</span>
                  <span><strong>Periksa identitas resmi:</strong> Pastikan nama pada KTM atau KTP sesuai dengan data pelapor: <em>{viewingReport.reporter?.full_name || 'Pelapor'}</em>.</span>
                </li>
              </ul>
            </div>

            {/* Reporter Profile */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Kontak Pelapor</h4>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
                <p><strong>Nama:</strong> {viewingReport.reporter?.full_name || 'Pengguna Kampus'}</p>
                {viewingReport.reporter?.student_number && <p><strong>NIM:</strong> {viewingReport.reporter.student_number}</p>}
                {viewingReport.reporter?.faculty && <p><strong>Fakultas / Prodi:</strong> {[viewingReport.reporter.faculty, viewingReport.reporter.study_program].filter(Boolean).join(' - ')}</p>}
                <p>
                  <strong>No. HP / WhatsApp:</strong>{' '}
                  <a
                    href={`https://wa.me/${viewingReport.contact_phone.replace(/^0/, '62').replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-700 font-semibold hover:underline"
                  >
                    {viewingReport.contact_phone}
                  </a>
                </p>
              </div>
            </div>

            {/* Actions in modal */}
            <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <Button variant="secondary" onClick={() => setViewingReport(null)}>
                Tutup
              </Button>
              {viewingReport.status === 'aktif' && (
                <Button
                  variant="primary"
                  onClick={() => {
                    handleOpenMarkFound(viewingReport);
                  }}
                  className="bg-sky-700 hover:bg-sky-800"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Tandai Barang Ditemukan
                </Button>
              )}
              {viewingReport.status === 'ditemukan' && (
                <>
                  {viewingReport.contact_phone && (
                    <a
                      href={getWhatsAppVerificationUrl(viewingReport) || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors min-h-[44px]"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Hubungi Pelapor via WA
                    </a>
                  )}
                  <Button
                    variant="primary"
                    onClick={() => {
                      setCompletingReport(viewingReport);
                    }}
                    className="bg-emerald-700 hover:bg-emerald-800"
                  >
                    <Check className="w-4 h-4" />
                    Verifikasi Selesai & Serahkan
                  </Button>
                </>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Mark Found Modal (Record finder & custody location) */}
      {markingFoundReport && (
        <Modal
          open={Boolean(markingFoundReport)}
          onOpenChange={(open) => !open && setMarkingFoundReport(null)}
          title="Catat Penemuan & Posko Penyimpanan"
          description={`Laporan: ${markingFoundReport.item_title} (${markingFoundReport.report_code})`}
          size="md"
        >
          <div className="space-y-4">
            <div className="rounded-xl bg-sky-50 border border-sky-100 p-3.5 text-xs text-sky-900 leading-relaxed">
              Lengkapi data orang yang menyerahkan barang dan lokasi penyimpanan fisik agar riwayat rantai penanganan (chain of custody) tercatat di linimasa pelapor.
            </div>

            <div>
              <label htmlFor="finder-name" className="text-xs font-bold text-slate-700 block mb-1">
                Nama / Identitas Penemu Barang
              </label>
              <input
                id="finder-name"
                type="text"
                value={finderName}
                onChange={(e) => setFinderName(e.target.value)}
                placeholder="Contoh: Budi Santoso (Mahasiswa FT) / Petugas Kebersihan"
                className="form-input w-full text-xs sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="found-location" className="text-xs font-bold text-slate-700 block mb-1">
                Lokasi Ditemukan
              </label>
              <input
                id="found-location"
                type="text"
                value={foundLocation}
                onChange={(e) => setFoundLocation(e.target.value)}
                placeholder="Contoh: Meja sudut Lantai 2 Perpustakaan"
                className="form-input w-full text-xs sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="storage-location" className="text-xs font-bold text-slate-700 block mb-1">
                Pos Satpam Tempat Barang Diamankan
              </label>
              <input
                id="storage-location"
                type="text"
                value={storageLocation}
                onChange={(e) => setStorageLocation(e.target.value)}
                placeholder="Contoh: Pos Satpam Gerbang Utama"
                className="form-input w-full text-xs sm:text-sm"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {QUICK_LOCATIONS.map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => setStorageLocation(loc)}
                    className={`text-[11px] px-2.5 py-1 rounded-md border transition-colors ${
                      storageLocation === loc
                        ? 'bg-[#123356] text-white border-[#123356]'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="found-note" className="text-xs font-bold text-slate-700 block mb-1">
                Catatan Kondisi Barang (Opsional)
              </label>
              <textarea
                id="found-note"
                rows={2}
                value={foundNote}
                onChange={(e) => setFoundNote(e.target.value)}
                placeholder="Contoh: Kondisi layar mulus, baterai habis, disimpan di loker posko."
                className="form-input w-full text-xs sm:text-sm"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button
                variant="secondary"
                onClick={() => setMarkingFoundReport(null)}
                disabled={isUpdatingReport}
              >
                Batal
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmMarkFound}
                loading={isUpdatingReport}
                className="bg-sky-700 hover:bg-sky-800"
              >
                <CheckCircle2 className="w-4 h-4" />
                Simpan & Tandai Ditemukan
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Complete Handover Confirm Modal */}
      {completingReport && (
        <ConfirmModal
          open={Boolean(completingReport)}
          onOpenChange={(open) => !open && setCompletingReport(null)}
          title="Konfirmasi Penyerahan Barang"
          message={`Pastikan Anda telah melakukan verifikasi identitas (KTM/KTP) dan pengujian ciri rahasia kepada pemilik sebelum menyerahkan barang "${completingReport.item_title}". Laporan akan ditandai Selesai.`}
          confirmText="Selesaikan Serah Terima"
          cancelText="Batal"
          variant="primary"
          loading={isUpdatingReport}
          onConfirm={handleConfirmCompleteReport}
        />
      )}
    </div>
  );
}

