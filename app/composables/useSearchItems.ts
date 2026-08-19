export interface HeaderSearchResult {
  id: string;
  name: string;
  category: string;
}

export function useSearchItems() {
  const client = useNeonClient();

  async function searchItems(query: string): Promise<HeaderSearchResult[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];
    // PostgREST's or() filter grammar treats , . ( ) as syntax, so a term containing
    // one (e.g. a manufacturer name like "Acme, Inc.") would break parsing unless the
    // value is quoted. Wrap it in double quotes, escaping backslashes/quotes first.
    const escaped = trimmed.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const { data, error } = await client
      .from('items')
      .select('id, name, category')
      .or(`name.ilike."%${escaped}%",manufacturer_or_club.ilike."%${escaped}%"`)
      .limit(10);
    if (error) throw error;
    return (data ?? []) as HeaderSearchResult[];
  }

  return { searchItems };
}
