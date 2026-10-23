import { createClient } from '@/lib/supabase/client';

export interface CatalogItem {
  id: string;
  title: string;
  category: string;
  categoryTag: string;
  location: string;
  date: string;
  time: string;
  image: string | null;
  description: string;
  status: string;
}

type ItemRow = {
  id: string;
  title: string;
  category: string;
  location: string;
  found_at: string;
  image_url: string | null;
  description: string;
  status: string;
};

export function mapItem(row: ItemRow): CatalogItem {
  const foundAt = new Date(row.found_at);

  return {
    id: row.id,
    title: row.title,
    category: row.category,
    categoryTag: row.category.toUpperCase(),
    location: row.location,
    date: foundAt.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
    time: foundAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    image: row.image_url,
    description: row.description,
    status: row.status,
  };
}

export async function fetchCatalogItems(options?: { withinHours?: number }) {
  let query = createClient()
    .from('items')
    .select('id, title, category, location, found_at, image_url, description, status')
    .order('found_at', { ascending: false });

  if (options?.withinHours) {
    query = query.gte('found_at', new Date(Date.now() - options.withinHours * 60 * 60 * 1000).toISOString());
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data as ItemRow[]).map(mapItem);
}
