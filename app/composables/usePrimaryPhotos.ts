export function usePrimaryPhotos() {
  const client = useNeonClient();

  async function fetchPrimaryPhotos(itemIds: string[]): Promise<Record<string, string>> {
    if (itemIds.length === 0) return {};
    const { data, error } = await client
      .from('item_photos')
      .select('item_id, url')
      .in('item_id', itemIds)
      .eq('is_primary', true);
    if (error) throw error;
    const map: Record<string, string> = {};
    for (const row of data ?? []) map[row.item_id] = row.url;
    return map;
  }

  return { fetchPrimaryPhotos };
}
