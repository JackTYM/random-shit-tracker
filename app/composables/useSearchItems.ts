export interface HeaderSearchResult {
  id: string;
  name: string;
  category: string;
}

export interface SearchResultDetailed {
  id: string;
  name: string;
  category: string;
  manufacturer_or_club: string | null;
  reference_code: string | null;
  value_estimated_at: string | null;
  approx_value_usd: string | null;
  storage_location: string | null;
}

function escapeForOr(value: string): string {
  // PostgREST's or() filter grammar treats , . ( ) as syntax, so a term containing
  // one (e.g. a manufacturer name like "Acme, Inc.") would break parsing unless the
  // value is quoted. Wrap it in double quotes, escaping backslashes/quotes first.
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

export function useSearchItems() {
  const client = useNeonClient();

  async function searchItems(query: string): Promise<HeaderSearchResult[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];
    const escaped = escapeForOr(trimmed);
    const { data, error } = await client
      .from('items')
      .select('id, name, category')
      .or(`name.ilike."%${escaped}%",manufacturer_or_club.ilike."%${escaped}%"`)
      .limit(10);
    if (error) throw error;
    return (data ?? []) as HeaderSearchResult[];
  }

  async function searchItemsDetailed(query: string, limit = 50): Promise<SearchResultDetailed[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];
    const escaped = escapeForOr(trimmed);
    const { data, error } = await client
      .from('items')
      .select('id, name, category, manufacturer_or_club, reference_code, value_estimated_at, approx_value_usd, storage_location')
      .or(`name.ilike."%${escaped}%",manufacturer_or_club.ilike."%${escaped}%"`)
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as SearchResultDetailed[];
  }

  return { searchItems, searchItemsDetailed };
}
