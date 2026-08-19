export interface LinkedItemSummary {
  linkId: string;
  id: string;
  name: string;
  category: string;
  relationshipLabel: string;
}

export interface ItemSearchResult {
  id: string;
  name: string;
  category: string;
}

export function useItemLinks() {
  const client = useNeonClient();

  async function listLinks(itemId: string): Promise<LinkedItemSummary[]> {
    const { data, error } = await client
      .from('item_links')
      .select('id, item_id, related_item_id, relationship_label')
      .or(`item_id.eq.${itemId},related_item_id.eq.${itemId}`);
    if (error) throw error;

    const raw: { linkId: string; otherItemId: string; relationshipLabel: string }[] = (data ?? []).map(
      (row: any) => ({
        linkId: row.id as string,
        otherItemId: (row.item_id === itemId ? row.related_item_id : row.item_id) as string,
        relationshipLabel: row.relationship_label as string,
      })
    );
    if (raw.length === 0) return [];

    const otherIds = raw.map((r) => r.otherItemId);
    const { data: otherItems, error: otherError } = await client
      .from('items')
      .select('id, name, category')
      .in('id', otherIds);
    if (otherError) throw otherError;

    const byId = new Map<string, { id: string; name: string; category: string }>(
      (otherItems ?? []).map((it: any) => [it.id, it])
    );
    const result: LinkedItemSummary[] = [];
    for (const r of raw) {
      const item = byId.get(r.otherItemId);
      if (!item) continue;
      result.push({ linkId: r.linkId, id: item.id, name: item.name, category: item.category, relationshipLabel: r.relationshipLabel });
    }
    return result;
  }

  async function createLink(itemId: string, relatedItemId: string, relationshipLabel: string): Promise<void> {
    const { error } = await client.from('item_links').insert({
      item_id: itemId,
      related_item_id: relatedItemId,
      relationship_label: relationshipLabel,
    });
    if (error) throw error;
  }

  async function searchItems(query: string, excludeId: string): Promise<ItemSearchResult[]> {
    if (!query.trim()) return [];
    const { data, error } = await client
      .from('items')
      .select('id, name, category')
      .ilike('name', `%${query}%`)
      .neq('id', excludeId)
      .limit(10);
    if (error) throw error;
    return (data ?? []) as ItemSearchResult[];
  }

  return { listLinks, createLink, searchItems };
}
