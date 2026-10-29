'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import { createClient } from '@/lib/supabase/client';
import { checkIsStaff } from '@/lib/supabase/auth';
import type { Claim, FilterStatus, LostReport, FilterReportStatus } from '@/types/claims';
import { fetchLostReportsAction, updateReportStatusAction } from '@/app/admin/actions';
import { useClaims, useClaimStats, useUpdateClaim, useBulkUpdateClaims } from '@/hooks/useClaims';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Modal, ConfirmModal } from '@/components/ui/Modal';

import { AdminStatsOverview } from './components/AdminStatsOverview';
import { AdminClaimsView } from './components/AdminClaimsView';
import { AdminReportsView } from './components/AdminReportsView';
import { ClaimDetailModal } from './components/ClaimDetailModal';
import { RejectClaimModal } from './components/RejectClaimModal';
import { CustodyChainModal } from './components/CustodyChainModal';
import { LostReportDetailModal } from './components/LostReportDetailModal';

const QUICK_LOCATIONS = [
  'Pos Satpam Gerbang Utama',
  'Pos Keamanan Gedung Rektorat',
  'Pos Satpam Perpustakaan Pusat',
  'Pos Keamanan Gedung B',
];

export default function AdminPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Authentication & Role Check
  const [isStaff, setIsStaff] = useState<boolean | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'klaim' | 'laporan-hilang'>('klaim');

  // Filter & Search State
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('semua');
  const [reportStatusFilter, setReportStatusFilter] = useState<FilterReportStatus>('semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Selection for Batch Actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals State
  const [viewingClaim, setViewingClaim] = useState<Claim | null>(null);
  const [rejectingClaim, setRejectingClaim] = useState<Claim | null>(null);
  const [isBulkApproveOpen, setIsBulkApproveOpen] = useState(false);
  const [bulkPickupLocation, setBulkPickupLocation] = useState('Pos Satpam Gerbang Utama');
  const [isBulkRejectOpen, setIsBulkRejectOpen] = useState(false);

  // Report Modals State
  const [viewingReport, setViewingReport] = useState<LostReport | null>(null);
  const [markingFoundReport, setMarkingFoundReport] = useState<LostReport | null>(null);
  const [completingReport, setCompletingReport] = useState<LostReport | null>(null);
  const [isUpdatingReport, setIsUpdatingReport] = useState(false);

  // Copy Feedback
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
    const checkRole = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/masuk?next=/admin');
        return;
      }

      const isAuthorized = await checkIsStaff(user.id);
      if (!isAuthorized) {
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
      setBulkPickupLocation('Pos Satpam Gerbang Utama');
    },
    onError: (err) => {
      toast.error(err.message || 'Gagal memperbarui klaim secara massal');
    },
  });

  const claims = useMemo(() => claimsData?.claims || [], [claimsData]);

  // Lost Reports Query
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

  // Processable claims selection
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

  const handleSingleUpdate = (claimId: string, status: 'ditinjau' | 'disetujui' | 'ditolak', location?: string) => {
    updateClaimMutation.mutate({
      claimId,
      status,
      pickupLocation: status === 'disetujui' ? location || 'Pos Satpam Gerbang Utama' : undefined,
    });
  };

  const handleConfirmReject = (claim: Claim, reason: string) => {
    updateClaimMutation.mutate(
      {
        claimId: claim.id,
        status: 'ditolak',
        rejectReason: reason || undefined,
      },
      {
        onSuccess: () => {
          setRejectingClaim(null);
          if (viewingClaim?.id === claim.id) {
            setViewingClaim((prev) => (prev ? { ...prev, status: 'ditolak' } : null));
          }
        },
      }
    );
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

  const handleConfirmMarkFound = async (data: {
    finderName: string;
    foundLocation: string;
    storageLocation: string;
    note: string;
  }) => {
    if (!markingFoundReport) return;
    setIsUpdatingReport(true);
    try {
      const res = await updateReportStatusAction({
        reportId: markingFoundReport.id,
        status: 'ditemukan',
        finderName: data.finderName || undefined,
        foundLocation: data.foundLocation || undefined,
        storageLocation: data.storageLocation || undefined,
        note: data.note || undefined,
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

  const getWhatsAppVerificationUrl = (report: LostReport) => {
    if (!report.contact_phone) return null;
    const phone = report.contact_phone.replace(/^0/, '62').replace(/[^0-9]/g, '');
    const reporterName = report.reporter?.full_name || 'Pelapor';
    const text = `Halo Sdr/i ${reporterName},\nKami dari Petugas Keamanan Kampus menginfokan bahwa barang yang sesuai dengan laporan kehilangan Anda ("${report.item_title}", No. Laporan: ${report.report_code}) telah ditemukan dan diamankan di posko.\n\nSilakan datang ke Pos Keamanan dengan membawa kartu identitas (KTM/KTP) dan bersiap menyebutkan/membuktikan ciri kepemilikan barang untuk proses serah terima.\n\nTerima kasih.`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
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

      {/* TAB 1: KLAIM */}
      {activeTab === 'klaim' && (
        <div className="space-y-6">
          <AdminStatsOverview
            stats={stats}
            statusFilter={statusFilter}
            onSelectFilter={setStatusFilter}
            isLoading={isStatsLoading}
          />

          <AdminClaimsView
            claims={claims}
            isLoading={isClaimsLoading}
            claimsError={claimsError}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            stats={stats}
            selectedIds={selectedIds}
            onToggleSelectClaim={toggleSelectClaim}
            onToggleSelectAll={toggleSelectAll}
            allProcessableSelected={allProcessableSelected}
            processableVisibleCount={processableVisibleClaims.length}
            onOpenDetail={setViewingClaim}
            onOpenRejectModal={setRejectingClaim}
            onSingleUpdate={handleSingleUpdate}
            onCopyTicket={handleCopyTicket}
            copiedTicket={copiedTicket}
            onBulkMarkReview={handleBulkMarkReview}
            onBulkApproveOpen={() => setIsBulkApproveOpen(true)}
            onBulkRejectOpen={() => setIsBulkRejectOpen(true)}
            onClearSelection={() => setSelectedIds([])}
            isBulkUpdating={bulkUpdateMutation.isPending}
            isUpdatingSingle={updateClaimMutation.isPending}
            onRetry={handleRefresh}
          />
        </div>
      )}

      {/* TAB 2: LAPORAN HILANG */}
      {activeTab === 'laporan-hilang' && (
        <AdminReportsView
          lostReports={lostReports}
          isLoading={isReportsLoading}
          reportsError={reportsError}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={reportStatusFilter}
          onStatusFilterChange={setReportStatusFilter}
          onSelectReport={setViewingReport}
          onOpenMarkFound={setMarkingFoundReport}
          onOpenCompleteHandover={setCompletingReport}
          onCopyTicket={handleCopyTicket}
          copiedTicket={copiedTicket}
          getWhatsAppVerificationUrl={getWhatsAppVerificationUrl}
          isUpdatingReport={isUpdatingReport}
          onRetry={handleRefresh}
        />
      )}

      {/* MODALS */}
      <ClaimDetailModal
        key={viewingClaim?.id || 'claim-detail-modal'}
        claim={viewingClaim}
        onClose={() => setViewingClaim(null)}
        onApprove={(claimId, location) => handleSingleUpdate(claimId, 'disetujui', location)}
        onRejectModalOpen={setRejectingClaim}
        onReopenReview={(claimId) => {
          handleSingleUpdate(claimId, 'ditinjau');
          setViewingClaim((prev) => (prev ? { ...prev, status: 'ditinjau' } : null));
        }}
        isPending={updateClaimMutation.isPending}
        quickLocations={QUICK_LOCATIONS}
      />

      <RejectClaimModal
        key={rejectingClaim?.id || 'reject-claim-modal'}
        claim={rejectingClaim}
        onClose={() => setRejectingClaim(null)}
        onConfirm={handleConfirmReject}
        isPending={updateClaimMutation.isPending}
      />

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

      <LostReportDetailModal
        report={viewingReport}
        onClose={() => setViewingReport(null)}
        onOpenMarkFound={setMarkingFoundReport}
        onOpenCompleteHandover={setCompletingReport}
        getWhatsAppVerificationUrl={getWhatsAppVerificationUrl}
      />

      <CustodyChainModal
        key={markingFoundReport?.id || 'custody-chain-modal'}
        report={markingFoundReport}
        onClose={() => setMarkingFoundReport(null)}
        onConfirm={handleConfirmMarkFound}
        isPending={isUpdatingReport}
        quickLocations={QUICK_LOCATIONS}
      />

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