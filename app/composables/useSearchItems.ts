export interface ItemSearchResult {
  id: string;
  name: string;
  category: string;
}

export function useSearchItems() {
  const client = useNeonClient();

  async function searchItems(query: string): Promise<ItemSearchResult[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];
    const { data, error } = await client
      .from('items')
      .select('id, name, category')
      .or(`name.ilike.%${trimmed}%,manufacturer_or_club.ilike.%${trimmed}%`)
      .limit(10);
    if (error) throw error;
    return (data ?? []) as ItemSearchResult[];
  }

  return { searchItems };
}
