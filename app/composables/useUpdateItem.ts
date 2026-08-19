import type { SharedItemFields } from './useCreateItem';

export type UpdateSharedFields = SharedItemFields;

const CATEGORY_TABLE: Record<string, string> = {
  motor: 'rocket_motors',
  kit: 'model_rocket_kits',
  plane: 'model_airplanes',
  part: 'model_rocket_parts',
  print: 'printed_materials',
  other: 'other_collectables',
};

export function useUpdateItem() {
  const client = useNeonClient();

  async function updateItem(
    itemId: string,
    category: string,
    shared: UpdateSharedFields,
    categoryFields: Record<string, unknown>,
  ): Promise<void> {
    const table = CATEGORY_TABLE[category];
    if (!table) throw new Error(`Unknown category: ${category}`);

    const { error: itemsError } = await client
      .from('items')
      .update({
        name: shared.name,
        manufacturer_or_club: shared.manufacturerOrClub,
        storage_location: shared.storageLocation,
        approx_value_usd: shared.approxValueUsd,
        value_estimated_at: shared.valueEstimatedAt,
        notes: shared.notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', itemId);
    if (itemsError) throw itemsError;

    // categoryFields keys are p_-prefixed (matching categoryFormFields.ts / the RPC
    // parameter convention from Phase 2a) — strip the prefix to get the real column name.
    const columnValues: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(categoryFields)) {
      columnValues[key.replace(/^p_/, '')] = value;
    }

    const { error: categoryError } = await client
      .from(table)
      .update(columnValues)
      .eq('item_id', itemId);
    if (categoryError) throw categoryError;
  }

  return { updateItem };
}
