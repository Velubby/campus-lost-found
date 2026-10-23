import { createClient } from '@/lib/supabase/client';

export type ReportStatus = 'draf' | 'aktif' | 'ditemukan' | 'klaim' | 'selesai';

export type UserReportRow = {
  id: string;
  report_code: string;
  type: 'hilang' | 'temuan';
  item_title: string;
  category: string;
  location: string;
  incident_at: string;
  public_description: string;
  image_url: string | null;
  status: ReportStatus;
  created_at: string;
  updated_at: string;
};

export type ReportEventRow = {
  id: string;
  title: string;
  description: string;
  created_at: string;
};

export type ClaimRow = {
  id: string;
  report_id: string | null;
  item_id: string;
  status: 'diajukan' | 'ditinjau' | 'disetujui' | 'ditolak';
  ticket_code: string;
  created_at: string;
};

export type ClaimItemRow = {
  id: string;
  title: string;
  location: string;
};

export async function fetchUserReports() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { user: null, reports: [], claims: [] as ClaimRow[] };

  const [{ data: reports, error: reportsError }, { data: claims, error: claimsError }] = await Promise.all([
    supabase.from('reports').select('id, report_code, type, item_title, category, location, incident_at, public_description, image_url, status, created_at, updated_at').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('claims').select('id, report_id, item_id, status, ticket_code, created_at').eq('user_id', user.id).order('created_at', { ascending: false }),
  ]);

  if (reportsError) throw reportsError;
  if (claimsError) throw claimsError;

  return { user, reports: (reports || []) as UserReportRow[], claims: (claims || []) as ClaimRow[] };
}

export async function fetchLatestUserReport(reportId?: string) {
  const { user, reports, claims } = await fetchUserReports();
  const report = (reportId ? reports.find((item) => item.id === reportId) : reports[0]) || null;
  if (!report) {
    const claim = claims[0] || null;
    if (!claim) return { user, reports, report: null, events: [] as ReportEventRow[], claim: null, claimItem: null };
    const { data: claimItem } = await createClient().from('items').select('id, title, location').eq('id', claim.item_id).maybeSingle();
    return { user, reports, report: null, events: [] as ReportEventRow[], claim, claimItem: (claimItem || null) as ClaimItemRow | null };
  }

  const supabase = createClient();
  const [{ data: events, error: eventsError }, { data: reportClaims, error: claimsError }] = await Promise.all([
    supabase.from('report_events').select('id, title, description, created_at').eq('report_id', report.id).order('created_at', { ascending: true }),
    Promise.resolve({ data: claims.filter((claim) => claim.report_id === report.id), error: null }),
  ]);

  if (eventsError) throw eventsError;
  if (claimsError) throw claimsError;

  return { user, reports, report, events: (events || []) as ReportEventRow[], claim: reportClaims?.[0] || null, claimItem: null };
}

export function formatDate(value: string) {
  return new Date(value).toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
