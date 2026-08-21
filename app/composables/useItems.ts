export interface ItemRecord {
  id: string;
  category: string;
  name: string;
  manufacturer_or_club: string | null;
  storage_location: string | null;
  storage_note: string | null;
  reference_code: string | null;
  approx_value_usd: string | null;
  value_estimated_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

export const CATEGORY_TABLE: Record<string, string> = {
  motor: 'rocket_motors',
  kit: 'model_rocket_kits',
  plane: 'model_airplanes',
  part: 'model_rocket_parts',
  print: 'printed_materials',
  other: 'other_collectables',
};

const EMBED_SELECT =
  '*, rocket_motors(*), model_rocket_kits(*), model_airplanes(*), model_rocket_parts(*), printed_materials(*), other_collectables(*)';

export function useItems() {
  const client = useNeonClient();

  function categoryDetail(item: ItemRecord): Record<string, any> | null {
    const table = CATEGORY_TABLE[item.category];
    if (!table) return null;
    const raw = (item as any)[table];
    if (!raw) return null;
    return Array.isArray(raw) ? (raw[0] ?? null) : raw;
  }

  async function listItems(): Promise<ItemRecord[]> {
    const { data, error } = await client
      .from('items')
      .select(EMBED_SELECT)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as ItemRecord[];
  }

  async function getItem(id: string): Promise<ItemRecord | null> {
    const { data, error } = await client
      .from('items')
      .select(EMBED_SELECT)
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data as ItemRecord | null;
  }

  return { listItems, getItem, categoryDetail };
}
