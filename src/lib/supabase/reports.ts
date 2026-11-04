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
  image_urls: string[] | null;
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
  pickup_location: string | null;
  pickup_at: string | null;
  created_at: string;
  updated_at: string;
  item?: {
    id?: string;
    title: string;
    location: string;
    image_url: string | null;
    status?: string | null;
  } | null;
};

export type ClaimItemRow = {
  id: string;
  title: string;
  location: string;
  status: string;
};

export async function fetchUserReports() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { user: null, reports: [], claims: [] as ClaimRow[] };

  const [{ data: reports, error: reportsError }, { data: claims, error: claimsError }] = await Promise.all([
    supabase
      .from('reports')
      .select('id, report_code, type, item_title, category, location, incident_at, public_description, image_url, image_urls, status, created_at, updated_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('claims')
      .select('id, report_id, item_id, status, ticket_code, pickup_location, pickup_at, created_at, updated_at, item:items!item_id(id, title, location, image_url, status)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
  ]);

  if (reportsError) throw reportsError;
  if (claimsError) throw claimsError;

  const mappedClaims: ClaimRow[] = ((claims || []) as unknown as Array<{
    id: string;
    report_id: string | null;
    item_id: string;
    status: 'diajukan' | 'ditinjau' | 'disetujui' | 'ditolak';
    ticket_code: string;
    pickup_location: string | null;
    pickup_at: string | null;
    created_at: string;
    updated_at: string;
    item: { id?: string; title: string; location: string; image_url: string | null; status: string } | Array<{ id?: string; title: string; location: string; image_url: string | null; status: string }> | null;
  }>).map((c) => ({
    id: c.id,
    report_id: c.report_id,
    item_id: c.item_id,
    status: c.status,
    ticket_code: c.ticket_code,
    pickup_location: c.pickup_location,
    pickup_at: c.pickup_at,
    created_at: c.created_at,
    updated_at: c.updated_at,
    item: Array.isArray(c.item) ? c.item[0] || null : c.item,
  }));

  return { user, reports: (reports || []) as UserReportRow[], claims: mappedClaims };
}

function selectLatestUserReport(reports: UserReportRow[], claims: ClaimRow[], reportId?: string, ticketCode?: string) {
  if (ticketCode) {
    const ticketClaim = claims.find((item) => item.ticket_code.toLowerCase() === ticketCode.toLowerCase()) || null;
    if (ticketClaim) return { report: null, claim: ticketClaim };
  }

  const directClaim = !reportId ? claims.find((item) => !item.report_id) : null;
  if (directClaim) return { report: null, claim: directClaim };

  const report = (reportId ? reports.find((item) => item.id === reportId) : reports[0]) || null;
  const claim = report
    ? claims.filter((item) => item.report_id === report.id)[0] || null
    : claims[0] || null;

  return { report, claim };
}

export async function fetchLatestUserReport(reportId?: string, ticketCode?: string) {
  const { user, reports, claims } = await fetchUserReports();
  const { report, claim } = selectLatestUserReport(reports, claims, reportId, ticketCode);

  if (!report) {
    if (!claim) return { user, reports, claims, report: null, events: [] as ReportEventRow[], claim: null, claimItem: null };
    const { data: claimItem } = await createClient().from('items').select('id, title, location, status').eq('id', claim.item_id).maybeSingle();
    return { user, reports, claims, report: null, events: [] as ReportEventRow[], claim, claimItem: (claimItem || null) as ClaimItemRow | null };
  }

  const supabase = createClient();
  const { data: events, error: eventsError } = await supabase
    .from('report_events')
    .select('id, title, description, created_at')
    .eq('report_id', report.id)
    .order('created_at', { ascending: true });

  if (eventsError) throw eventsError;

  return { user, reports, claims, report, events: (events || []) as ReportEventRow[], claim: claim || null, claimItem: null };
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
