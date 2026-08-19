<script setup lang="ts">
import { CATEGORY_FORM_FIELDS, CATEGORY_LABELS } from '~/data/categoryFormFields';

const route = useRoute();
const itemId = route.params.id as string;

const { getItem, categoryDetail } = useItems();
const { updateItem } = useUpdateItem();
const client = useNeonClient();

const item = ref<any>(null);
const photos = ref<{ id: string; r2_key: string; url: string; sort_order: number; is_primary: boolean }[]>([]);
const loading = ref(true);
const loadError = ref('');

async function loadItem() {
  loading.value = true;
  loadError.value = '';
  try {
    const result = await getItem(itemId);
    if (!result) {
      loadError.value = 'Item not found.';
      return;
    }
    item.value = result;

    const { data: photoRows, error: photoError } = await client
      .from('item_photos')
      .select('id, r2_key, url, sort_order, is_primary')
      .eq('item_id', itemId)
      .order('sort_order', { ascending: true });
    if (photoError) throw photoError;
    photos.value = (photoRows ?? []) as typeof photos.value;
  } catch (e: any) {
    loadError.value = e?.message ?? 'Failed to load item.';
  } finally {
    loading.value = false;
  }
}

const primaryPhoto = computed(() => photos.value.find((p) => p.is_primary) ?? photos.value[0] ?? null);

const detailFields = computed(() => {
  if (!item.value) return [];
  const detail = categoryDetail(item.value);
  if (!detail) return [];
  const config = CATEGORY_FORM_FIELDS[item.value.category] ?? [];
  return config
    .map((f) => {
      const columnKey = f.key.replace(/^p_/, '');
      let value = detail[columnKey];
      if (value === 'Other' && f.otherKey) {
        const otherColumnKey = f.otherKey.replace(/^p_/, '');
        value = detail[otherColumnKey] || 'Other';
      }
      return { label: f.label, value };
    })
    .filter((f) => f.value !== null && f.value !== undefined && f.value !== '');
});

// --- Edit mode ---

const editing = ref(false);
const saving = ref(false);
const saveError = ref('');

const editName = ref('');
const editManufacturerOrClub = ref('');
const editStorageLocation = ref('');
const editApproxValueUsd = ref('');
const editValueEstimatedAt = ref('');
const editNotes = ref('');
const editCategoryValues = ref<Record<string, string>>({});
const editOtherValues = ref<Record<string, string>>({});

function startEdit() {
  if (!item.value) return;
  editName.value = item.value.name ?? '';
  editManufacturerOrClub.value = item.value.manufacturer_or_club ?? '';
  editStorageLocation.value = item.value.storage_location ?? '';
  editApproxValueUsd.value = item.value.approx_value_usd ?? '';
  editValueEstimatedAt.value = item.value.value_estimated_at ?? '';
  editNotes.value = item.value.notes ?? '';

  const detail = categoryDetail(item.value);
  const config = CATEGORY_FORM_FIELDS[item.value.category] ?? [];
  const values: Record<string, string> = {};
  const others: Record<string, string> = {};
  for (const f of config) {
    const columnKey = f.key.replace(/^p_/, '');
    values[f.key] = detail?.[columnKey] != null ? String(detail[columnKey]) : '';
    if (f.otherKey) {
      const otherColumnKey = f.otherKey.replace(/^p_/, '');
      others[f.otherKey] = detail?.[otherColumnKey] ?? '';
    }
  }
  editCategoryValues.value = values;
  editOtherValues.value = others;

  saveError.value = '';
  editing.value = true;
}

function cancelEdit() {
  editing.value = false;
  saveError.value = '';
}

function buildEditCategoryPayload(): Record<string, unknown> {
  const config = CATEGORY_FORM_FIELDS[item.value.category] ?? [];
  const payload: Record<string, unknown> = {};
  for (const field of config) {
    let value: unknown = editCategoryValues.value[field.key] ?? null;
    if (field.type === 'number') {
      value = value === '' || value === null || value === undefined ? null : Number(value);
    } else if (value === '') {
      value = null;
    }
    payload[field.key] = value;
    if (field.otherKey) {
      payload[field.otherKey] = value === 'Other' ? (editOtherValues.value[field.otherKey] || null) : null;
    }
  }
  return payload;
}

async function saveEdit() {
  if (!item.value) return;
  if (!editName.value.trim()) {
    saveError.value = 'Item name is required.';
    return;
  }
  saving.value = true;
  saveError.value = '';
  try {
    await updateItem(
      itemId,
      item.value.category,
      {
        name: editName.value.trim(),
        manufacturerOrClub: editManufacturerOrClub.value || null,
        storageLocation: editStorageLocation.value || null,
        approxValueUsd: editApproxValueUsd.value ? Number(editApproxValueUsd.value) : null,
        valueEstimatedAt: editValueEstimatedAt.value || null,
        notes: editNotes.value || null,
      },
      buildEditCategoryPayload(),
    );
    await loadItem();
    editing.value = false;
  } catch (e: any) {
    saveError.value = e?.message ?? 'Failed to save changes.';
  } finally {
    saving.value = false;
  }
}

onMounted(loadItem);
</script>

<template>
  <main style="max-width: 1440px; margin: 0 auto; padding: 20px 28px 64px">
    <div style="display: flex; align-items: center; gap: 8px; font: 500 10.5px 'JetBrains Mono', monospace; letter-spacing: 0.08em; color: rgba(22,34,76,0.6); margin-bottom: 16px">
      <button type="button" style="border: 0; background: transparent; cursor: pointer; font: 500 10.5px 'JetBrains Mono', monospace; letter-spacing: 0.08em; color: var(--color-rust); padding: 0" @click="navigateTo('/browse')">← BROWSE</button>
      <template v-if="item">
        <span>/</span><span>{{ CATEGORY_LABELS[item.category]?.toUpperCase() }}</span><span>/</span><span style="color: var(--color-navy)">{{ item.name }}</span>
      </template>
    </div>

    <div v-if="loading" style="font: 500 12px 'JetBrains Mono', monospace; color: rgba(22,34,76,0.6)">Loading…</div>
    <p v-else-if="loadError" style="color: var(--color-rust)">{{ loadError }}</p>

    <div v-else-if="item" style="display: grid; grid-template-columns: 0.9fr 1.1fr; gap: 28px; align-items: start">
      <div>
        <div style="border: 1px solid var(--color-navy); background: #fff; height: 520px; overflow: hidden">
          <img v-if="primaryPhoto" :src="primaryPhoto.url" :alt="item.name" style="width: 100%; height: 100%; object-fit: contain; display: block; background: var(--color-paper)" />
          <div v-else style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: repeating-linear-gradient(135deg, #EAE4D5 0 6px, var(--color-paper) 6px 12px)">
            <span style="font: 500 11px 'JetBrains Mono', monospace; letter-spacing: 0.1em; color: rgba(22,34,76,0.5)">NO PHOTO YET</span>
          </div>
        </div>
        <div v-if="photos.length > 1" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 8px">
          <img
            v-for="p in photos.slice(0, 4)"
            :key="p.id"
            :src="p.url"
            :alt="item.name"
            style="height: 64px; width: 100%; object-fit: cover; border: 1px solid rgba(22,34,76,0.5)"
          />
        </div>
      </div>

      <div>
        <span style="display: inline-block; background: var(--color-orange); color: var(--color-navy); font: 700 9.5px 'JetBrains Mono', monospace; letter-spacing: 0.12em; padding: 5px 9px">{{ CATEGORY_LABELS[item.category]?.toUpperCase() }}</span>
        <h1 style="margin: 12px 0 4px; font: 400 44px 'Archivo Black', sans-serif; line-height: 0.98; letter-spacing: -0.02em; text-transform: uppercase">{{ item.name }}</h1>
        <div style="font: 500 12px 'JetBrains Mono', monospace; letter-spacing: 0.1em; color: rgba(22,34,76,0.7)">{{ item.manufacturer_or_club }}</div>

        <div v-if="!editing" style="display: flex; gap: 8px; margin-top: 18px">
          <button type="button" style="border: 0; cursor: pointer; background: var(--color-navy); color: var(--color-paper); padding: 10px 15px; font: 400 11px 'Archivo Black', sans-serif; letter-spacing: 0.08em" @click="startEdit">EDIT ENTRY</button>
          <!-- Task 8 adds Add photo / Duplicate buttons here -->
        </div>

        <template v-if="!editing">
          <div style="background: #fff; border: 1px solid var(--color-navy); margin-top: 20px">
            <div style="background: var(--color-navy); color: var(--color-paper); padding: 8px 14px; font: 400 11px 'Archivo Black', sans-serif; letter-spacing: 0.12em">SPECIFICATIONS</div>
            <div style="padding: 14px 16px; display: flex; flex-direction: column; gap: 6px">
              <div v-for="f in detailFields" :key="f.label" style="display: flex; align-items: baseline; gap: 6px; font: 400 12.5px 'JetBrains Mono', monospace; color: rgba(22,34,76,0.8)">
                <span style="letter-spacing: 0.04em">{{ f.label }}</span>
                <span style="flex: 1; border-bottom: 1px dotted rgba(22,34,76,0.45); transform: translateY(-4px)" />
                <span style="font-weight: 700; color: var(--color-navy)">{{ f.value }}</span>
              </div>
              <div v-if="detailFields.length === 0" style="font-size: 12.5px; color: rgba(22,34,76,0.5)">No specifications recorded yet.</div>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 14px">
            <div v-if="item.approx_value_usd" style="background: var(--color-orange); border: 1px solid var(--color-navy); padding: 14px 16px">
              <div style="font: 500 10px 'JetBrains Mono', monospace; letter-spacing: 0.12em; color: rgba(22,34,76,0.75)">APPROX. VALUE</div>
              <div style="font: 400 38px 'Archivo Black', sans-serif; line-height: 1.05; margin-top: 4px">${{ Number(item.approx_value_usd).toFixed(2) }}</div>
              <div v-if="item.value_estimated_at" style="font: 400 10.5px 'JetBrains Mono', monospace; color: rgba(22,34,76,0.8); margin-top: 4px">EST. {{ item.value_estimated_at }}</div>
            </div>
            <div style="background: #fff; border: 1px solid var(--color-navy); padding: 14px 16px">
              <div style="font: 500 10px 'JetBrains Mono', monospace; letter-spacing: 0.12em; color: rgba(22,34,76,0.6)">STORAGE LOCATION</div>
              <div style="font: 400 24px 'Archivo Black', sans-serif; line-height: 1.1; margin-top: 6px">{{ item.storage_location || '—' }}</div>
            </div>
          </div>

          <div v-if="item.notes" style="background: #fff; border: 1px solid var(--color-navy); margin-top: 14px; padding: 14px 16px">
            <div style="font: 500 10px 'JetBrains Mono', monospace; letter-spacing: 0.12em; color: rgba(22,34,76,0.6); margin-bottom: 7px">NOTES</div>
            <p style="margin: 0; font-size: 13.5px; line-height: 1.55; color: rgba(22,34,76,0.9)">{{ item.notes }}</p>
          </div>
        </template>

        <template v-else>
          <div style="background: #fff; border: 1px solid var(--color-navy); margin-top: 20px; padding: 18px 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 16px">
            <div style="grid-column: span 2; display: flex; flex-direction: column; gap: 5px">
              <label style="font: 500 9.5px 'JetBrains Mono', monospace; letter-spacing: 0.12em; color: rgba(22,34,76,0.65)">ITEM NAME</label>
              <input v-model="editName" style="padding: 9px 11px; border: 1px solid var(--color-navy); background: var(--color-paper); font-size: 13.5px; color: var(--color-navy)" />
            </div>
            <div style="display: flex; flex-direction: column; gap: 5px">
              <label style="font: 500 9.5px 'JetBrains Mono', monospace; letter-spacing: 0.12em; color: rgba(22,34,76,0.65)">MANUFACTURER / CLUB</label>
              <input v-model="editManufacturerOrClub" style="padding: 9px 11px; border: 1px solid var(--color-navy); background: var(--color-paper); font-size: 13.5px; color: var(--color-navy)" />
            </div>
            <div style="display: flex; flex-direction: column; gap: 5px">
              <label style="font: 500 9.5px 'JetBrains Mono', monospace; letter-spacing: 0.12em; color: rgba(22,34,76,0.65)">STORAGE LOCATION</label>
              <input v-model="editStorageLocation" style="padding: 9px 11px; border: 1px solid var(--color-navy); background: var(--color-paper); font-size: 13.5px; color: var(--color-navy)" />
            </div>
            <div style="display: flex; flex-direction: column; gap: 5px">
              <label style="font: 500 9.5px 'JetBrains Mono', monospace; letter-spacing: 0.12em; color: rgba(22,34,76,0.65)">APPROX. VALUE (USD)</label>
              <input v-model="editApproxValueUsd" type="number" step="0.01" style="padding: 9px 11px; border: 1px solid var(--color-navy); background: var(--color-paper); font-size: 13.5px; color: var(--color-navy)" />
            </div>
            <div style="display: flex; flex-direction: column; gap: 5px">
              <label style="font: 500 9.5px 'JetBrains Mono', monospace; letter-spacing: 0.12em; color: rgba(22,34,76,0.65)">DATE OF ESTIMATE</label>
              <input v-model="editValueEstimatedAt" type="date" style="padding: 9px 11px; border: 1px solid var(--color-navy); background: var(--color-paper); font-size: 13.5px; color: var(--color-navy)" />
            </div>
            <div style="grid-column: span 2; display: flex; flex-direction: column; gap: 5px">
              <label style="font: 500 9.5px 'JetBrains Mono', monospace; letter-spacing: 0.12em; color: rgba(22,34,76,0.65)">NOTES</label>
              <textarea v-model="editNotes" rows="3" style="padding: 9px 11px; border: 1px solid var(--color-navy); background: var(--color-paper); font-size: 13.5px; color: var(--color-navy); resize: vertical" />
            </div>
          </div>

          <div style="background: #fff; border: 1px solid var(--color-navy); border-top: 0; padding: 18px 20px">
            <CategoryFieldsForm
              :category="item.category"
              v-model:values="editCategoryValues"
              v-model:other-values="editOtherValues"
            />
          </div>

          <div style="border-top: 1px dashed rgba(22,34,76,0.35); padding: 14px 0; display: flex; gap: 10px; align-items: center">
            <button type="button" :disabled="saving" style="border: 0; cursor: pointer; background: var(--color-navy); color: var(--color-paper); padding: 11px 18px; font: 400 12px 'Archivo Black', sans-serif; letter-spacing: 0.08em" @click="saveEdit">SAVE CHANGES</button>
            <button type="button" :disabled="saving" style="border: 1px solid var(--color-navy); cursor: pointer; background: transparent; padding: 11px 18px; font: 600 11.5px 'Archivo', sans-serif; letter-spacing: 0.08em; text-transform: uppercase; color: var(--color-navy)" @click="cancelEdit">Cancel</button>
            <span v-if="saveError" style="color: var(--color-rust); font-size: 12.5px">{{ saveError }}</span>
          </div>
        </template>
      </div>
    </div>
  </main>
</template>
