import { computeFallbackName } from '~/data/computeFallbackName';

export interface SharedItemFields {
  name: string;
  manufacturerOrClub: string | null;
  storageLocation: string | null;
  storageNote: string | null;
  approxValueUsd: number | null;
  valueEstimatedAt: string | null;
  notes: string | null;
}

export interface StagedPhoto {
  key: string;
  publicUrl: string;
}

const RPC_BY_CATEGORY: Record<string, string> = {
  motor: 'create_rocket_motor_item',
  kit: 'create_model_rocket_kit_item',
  plane: 'create_model_airplane_item',
  part: 'create_model_rocket_part_item',
  print: 'create_printed_material_item',
  other: 'create_other_collectable_item',
};

export function useCreateItem() {
  const client = useNeonClient();

  async function createItem(
    category: string,
    shared: SharedItemFields,
    categoryFields: Record<string, unknown>,
    photos: StagedPhoto[] = [],
  ): Promise<string> {
    const fnName = RPC_BY_CATEGORY[category];
    if (!fnName) throw new Error(`Unknown category: ${category}`);

    const name = shared.name.trim() || computeFallbackName(category, shared, categoryFields);

    const { data: itemId, error } = await client.rpc(fnName, {
      p_name: name,
      p_manufacturer_or_club: shared.manufacturerOrClub,
      p_storage_location: shared.storageLocation,
      p_storage_note: shared.storageNote,
      p_approx_value_usd: shared.approxValueUsd,
      p_value_estimated_at: shared.valueEstimatedAt,
      p_notes: shared.notes,
      ...categoryFields,
    });

    if (error) throw error;
    if (!itemId || typeof itemId !== 'string') {
      throw new Error('Item creation did not return a valid id');
    }

    if (photos.length > 0) {
      const { error: photoError } = await client.from('item_photos').insert(
        photos.map((p, i) => ({
          item_id: itemId,
          r2_key: p.key,
          url: p.publicUrl,
          sort_order: i,
          is_primary: i === 0,
        })),
      );
      if (photoError) throw photoError;
    }

    return itemId;
  }

  return { createItem };
}
