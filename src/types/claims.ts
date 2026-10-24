/**
 * Shared types for claims management (admin/satpam)
 * Used across server actions, hooks, and components
 */

export type ClaimStatus = 'diajukan' | 'ditinjau' | 'disetujui' | 'ditolak';
export type FilterStatus = ClaimStatus | 'semua';

export interface ClaimItem {
  id: string;
  title: string;
  location: string;
  image_url: string | null;
}

export interface Claimant {
  id: string;
  full_name: string;
  student_number: string | null;
  faculty: string | null;
  study_program: string | null;
  phone: string | null;
}

export interface Claim {
  id: string;
  item_id: string;
  report_id?: string | null;
  user_id: string;
  private_answers: string;
  contact_phone: string;
  status: ClaimStatus;
  ticket_code: string;
  pickup_location: string | null;
  pickup_at: string | null;
  created_at: string;
  updated_at: string;
  item?: ClaimItem | null;
  claimant?: Claimant | null;
}

export interface ClaimsResponse {
  claims: Claim[];
  total: number;
  hasMore: boolean;
  nextCursor: string | null;
}

export interface UpdateClaimInput {
  claimId: string;
  status: Exclude<ClaimStatus, 'diajukan'>;
  pickupLocation?: string;
}

export interface BulkUpdateInput {
  claimIds: string[];
  status: Exclude<ClaimStatus, 'diajukan'>;
  pickupLocation?: string;
}

export interface ClaimStats {
  total: number;
  pending: number;
  underReview: number;
  approved: number;
  rejected: number;
}

export const STATUS_LABELS: Record<FilterStatus, string> = {
  semua: 'Semua',
  diajukan: 'Diajukan',
  ditinjau: 'Ditinjau',
  disetujui: 'Disetujui',
  ditolak: 'Ditolak',
};

export const STATUS_COLORS: Record<ClaimStatus, { bg: string; text: string; dot: string; border: string }> = {
  diajukan: { bg: 'bg-amber-50', text: 'text-amber-800', dot: 'bg-amber-500', border: 'border-amber-200' },
  ditinjau: { bg: 'bg-sky-50', text: 'text-sky-800', dot: 'bg-sky-500', border: 'border-sky-200' },
  disetujui: { bg: 'bg-emerald-50', text: 'text-emerald-800', dot: 'bg-emerald-500', border: 'border-emerald-200' },
  ditolak: { bg: 'bg-rose-50', text: 'text-rose-800', dot: 'bg-rose-500', border: 'border-rose-200' },
};