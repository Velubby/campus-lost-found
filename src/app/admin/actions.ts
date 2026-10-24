'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { FilterStatus, UpdateClaimInput, BulkUpdateInput, Claim } from '@/types/claims';

const updateClaimSchema = z.object({
  claimId: z.string().uuid(),
  status: z.enum(['ditinjau', 'disetujui', 'ditolak']),
  pickupLocation: z.string().min(1).max(200).optional(),
});

const bulkUpdateSchema = z.object({
  claimIds: z.array(z.string().uuid()).min(1).max(50),
  status: z.enum(['ditinjau', 'disetujui', 'ditolak']),
  pickupLocation: z.string().min(1).max(200).optional(),
});

type ActionResult<T = null> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

async function requireSatpam() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('UNAUTHENTICATED');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || profile.role !== 'satpam') {
    throw new Error('FORBIDDEN');
  }

  return { supabase, user };
}
export async function updateClaimAction(input: UpdateClaimInput): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireSatpam();
    const parsed = updateClaimSchema.parse(input);

    const { data: claim, error: claimError } = await supabase
      .from('claims')
      .select('id, status, item_id, report_id, pickup_location')
      .eq('id', parsed.claimId)
      .single();

    if (claimError || !claim) {
      return { success: false, error: 'Klaim tidak ditemukan', code: 'NOT_FOUND' };
    }

    if (claim.status === 'disetujui' || claim.status === 'ditolak') {
      return { success: false, error: 'Klaim sudah diproses dan tidak dapat diubah', code: 'INVALID_TRANSITION' };
    }

    if (parsed.status === 'disetujui' && !parsed.pickupLocation) {
      return { success: false, error: 'Lokasi pengambilan wajib diisi untuk persetujuan', code: 'MISSING_PICKUP' };
    }

    const updateData: Record<string, unknown> = {
      status: parsed.status,
      updated_at: new Date().toISOString(),
    };

    if (parsed.pickupLocation) {
      updateData.pickup_location = parsed.pickupLocation;
    }

    const { error: updateError } = await supabase
      .from('claims')
      .update(updateData)
      .eq('id', parsed.claimId);

    if (updateError) {
      console.error('Update claim error:', updateError);
      return { success: false, error: 'Gagal memperbarui klaim', code: 'UPDATE_FAILED' };
    }

    if (claim.report_id) {
      await supabase.from('report_events').insert({
        report_id: claim.report_id,
        title: 'Status klaim diperbarui oleh petugas',
        description: `Status berubah dari ${claim.status} menjadi ${parsed.status}${parsed.pickupLocation ? `, lokasi: ${parsed.pickupLocation}` : ''}`,
        created_by: user.id,
      });
    }

    revalidatePath('/admin');
    return { success: true, data: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Data tidak valid', code: 'VALIDATION_ERROR' };
    }
    if (error instanceof Error) {
      if (error.message === 'UNAUTHENTICATED') return { success: false, error: 'Silakan login ulang', code: 'UNAUTHENTICATED' };
      if (error.message === 'FORBIDDEN') return { success: false, error: 'Akses ditolak: hanya untuk petugas', code: 'FORBIDDEN' };
    }
    console.error('updateClaimAction error:', error);
    return { success: false, error: 'Terjadi kesalahan server', code: 'SERVER_ERROR' };
  }
}

export async function bulkUpdateClaimsAction(input: BulkUpdateInput): Promise<ActionResult<{ updated: number }>> {
  try {
    const { supabase, user } = await requireSatpam();
    const parsed = bulkUpdateSchema.parse(input);

    if (parsed.status === 'disetujui' && !parsed.pickupLocation) {
      return { success: false, error: 'Lokasi pengambilan wajib diisi untuk persetujuan massal', code: 'MISSING_PICKUP' };
    }

    const { data: claims, error: fetchError } = await supabase
      .from('claims')
      .select('id, status, item_id, report_id')
      .in('id', parsed.claimIds);

    if (fetchError) {
      return { success: false, error: 'Gagal memuat klaim', code: 'FETCH_FAILED' };
    }

    if (!claims || claims.length === 0) {
      return { success: false, error: 'Tidak ada klaim yang dipilih', code: 'EMPTY_SELECTION' };
    }

    const processableClaims = claims.filter(c => c.status === 'diajukan' || c.status === 'ditinjau');
    
    if (processableClaims.length === 0) {
      return { success: false, error: 'Semua klaim terpilih sudah diproses', code: 'ALREADY_PROCESSED' };
    }

    const updateData: Record<string, unknown> = {
      status: parsed.status,
      updated_at: new Date().toISOString(),
    };

    if (parsed.pickupLocation) {
      updateData.pickup_location = parsed.pickupLocation;
    }

    const { error: updateError } = await supabase
      .from('claims')
      .update(updateData)
      .in('id', processableClaims.map(c => c.id));

    if (updateError) {
      console.error('Bulk update error:', updateError);
      return { success: false, error: 'Gagal memperbarui klaim', code: 'UPDATE_FAILED' };
    }

    const events = processableClaims
      .filter(claim => Boolean(claim.report_id))
      .map(claim => ({
        report_id: claim.report_id as string,
        title: 'Status klaim diperbarui oleh petugas (massal)',
        description: `Status berubah dari ${claim.status} menjadi ${parsed.status}${parsed.pickupLocation ? `, lokasi: ${parsed.pickupLocation}` : ''}`,
        created_by: user.id,
      }));

    if (events.length > 0) {
      await supabase.from('report_events').insert(events);
    }

    revalidatePath('/admin');
    return { success: true, data: { updated: processableClaims.length } };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Data tidak valid', code: 'VALIDATION_ERROR' };
    }
    if (error instanceof Error) {
      if (error.message === 'UNAUTHENTICATED') return { success: false, error: 'Silakan login ulang', code: 'UNAUTHENTICATED' };
      if (error.message === 'FORBIDDEN') return { success: false, error: 'Akses ditolak: hanya untuk petugas', code: 'FORBIDDEN' };
    }
    console.error('bulkUpdateClaimsAction error:', error);
    return { success: false, error: 'Terjadi kesalahan server', code: 'SERVER_ERROR' };
  }
}

export async function fetchClaimsAction(
  cursor?: string,
  limit = 20,
  statusFilter?: FilterStatus,
  searchQuery?: string
): Promise<ActionResult<{ claims: unknown[]; total: number; hasMore: boolean; nextCursor: string | null }>> {
  try {
    await requireSatpam();
    const supabase = await createClient();

    let query = supabase
      .from('claims')
      .select(`
        id,
        item_id,
        report_id,
        user_id,
        private_answers,
        contact_phone,
        status,
        ticket_code,
        pickup_location,
        pickup_at,
        created_at,
        updated_at,
        item:items!item_id(id, title, location, image_url)
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    if (cursor) {
      query = query.lt('created_at', cursor);
    }

    if (statusFilter && statusFilter !== 'semua') {
      query = query.eq('status', statusFilter);
    }

    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.trim();
      query = query.or(`ticket_code.ilike.%${q}%,contact_phone.ilike.%${q}%`);
    }

    query = query.limit(limit + 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Fetch claims error:', error);
      return { success: false, error: 'Gagal memuat data klaim', code: 'FETCH_FAILED' };
    }

    let claims = (data || []) as unknown as Claim[];

    // Fetch profiles separately — claims.user_id FK points to auth.users (cross-schema),
    // so PostgREST cannot auto-join to public.profiles. We do it manually.
    const userIds = [...new Set(claims.map((c) => c.user_id).filter(Boolean))];
    const profileMap: Record<string, { id: string; full_name: string; student_number: string | null; faculty: string | null; study_program: string | null; phone: string | null }> = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, student_number, faculty, study_program, phone')
        .in('id', userIds);
      if (profiles) {
        for (const p of profiles) {
          profileMap[p.id] = p;
        }
      }
    }

    // Merge claimant into each claim
    claims = claims.map((c) => ({
      ...c,
      claimant: profileMap[c.user_id] || null,
    }));

    // If client supplied a search query, also filter in-memory for item title or claimant name/NIM
    if (searchQuery && searchQuery.trim()) {
      const lower = searchQuery.trim().toLowerCase();
      claims = claims.filter((c) => {
        const itemTitle = c.item?.title?.toLowerCase() || '';
        const claimantName = c.claimant?.full_name?.toLowerCase() || '';
        const claimantNim = c.claimant?.student_number?.toLowerCase() || '';
        const ticketCode = c.ticket_code?.toLowerCase() || '';
        return itemTitle.includes(lower) || claimantName.includes(lower) || claimantNim.includes(lower) || ticketCode.includes(lower);
      });
    }

    const hasMore = claims.length > limit;
    const items = hasMore ? claims.slice(0, limit) : claims;
    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1].created_at : null;

    return { success: true, data: { claims: items, total: count || 0, hasMore, nextCursor } };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'UNAUTHENTICATED') return { success: false, error: 'Silakan login ulang', code: 'UNAUTHENTICATED' };
      if (error.message === 'FORBIDDEN') return { success: false, error: 'Akses ditolak: hanya untuk petugas', code: 'FORBIDDEN' };
    }
    console.error('fetchClaimsAction error:', error);
    return { success: false, error: 'Terjadi kesalahan server', code: 'SERVER_ERROR' };
  }
}

export async function getClaimStatsAction(): Promise<ActionResult<{ total: number; pending: number; approved: number; rejected: number; underReview: number }>> {
  try {
    await requireSatpam();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('claims')
      .select('status', { count: 'exact' });

    if (error) {
      return { success: false, error: 'Gagal memuat statistik', code: 'FETCH_FAILED' };
    }

    const claims = data || [];
    const stats = {
      total: claims.length,
      pending: claims.filter(c => c.status === 'diajukan').length,
      underReview: claims.filter(c => c.status === 'ditinjau').length,
      approved: claims.filter(c => c.status === 'disetujui').length,
      rejected: claims.filter(c => c.status === 'ditolak').length,
    };

    return { success: true, data: stats };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'UNAUTHENTICATED') return { success: false, error: 'Silakan login ulang', code: 'UNAUTHENTICATED' };
      if (error.message === 'FORBIDDEN') return { success: false, error: 'Akses ditolak', code: 'FORBIDDEN' };
    }
    return { success: false, error: 'Terjadi kesalahan server', code: 'SERVER_ERROR' };
  }
}