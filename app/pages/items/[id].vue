<script setup lang="ts">
import { CATEGORY_FORM_FIELDS, CATEGORY_LABELS } from '~/data/categoryFormFields';
import { formatItemDetailAge } from '~/data/valueAge';

const NAME_REQUIRED_CATEGORIES = new Set(['plane', 'kit', 'print']);
const DIAMETER_AUX_KEYS = new Set(['p_diameter_type', 'p_diameter_unit', 'p_diameter_code']);

const route = useRoute();
const itemId = route.params.id as string;

const { getItem, categoryDetail } = useItems();
const { updateItem } = useUpdateItem();
const client = useNeonClient();
const { createItem } = useCreateItem();
const { uploadPhoto } = useUploadPhoto();
const { uploadDocument } = useUploadDocument();
const { listLinks, createLink, searchItems } = useItemLinks();

const item = ref<any>(null);
const photos = ref<{ id: string; r2_key: string; url: string; sort_order: number; is_primary: boolean }[]>([]);
const documents = ref<{ id: string; r2_key: string; url: string; filename: string; created_at: string }[]>([]);
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

    const { data: documentRows, error: documentError } = await client
      .from('item_documents')
      .select('id, r2_key, url, filename, created_at')
      .eq('item_id', itemId)
      .order('created_at', { ascending: true });
    if (documentError) throw documentError;
    documents.value = (documentRows ?? []) as typeof documents.value;
  } catch (e: any) {
    loadError.value = e?.message ?? 'Failed to load item.';
  } finally {
    loading.value = false;
  }
}

const primaryPhoto = computed(() => photos.value.find((p) => p.is_primary) ?? photos.value[0] ?? null);

const itemSubline = computed(() => {
  const parts = [item.value?.manufacturer_or_club, item.value?.reference_code].filter(Boolean);
  return parts.join(' · ');
});

const detailFields = computed(() => {
  if (!item.value) return [];
  const detail = categoryDetail(item.value);
  if (!detail) return [];
  const config = CATEGORY_FORM_FIELDS[item.value.category] ?? [];
  return config
    .filter((f) => !DIAMETER_AUX_KEYS.has(f.key))
    .map((f) => {
      if (f.key === 'p_diameter_value') {
        const value = detail.diameter_type === 'Tube Code'
          ? detail.diameter_code
          : detail.diameter_value != null ? `${detail.diameter_value}${detail.diameter_unit ? ' ' + detail.diameter_unit : ''}` : null;
        return { label: 'Diameter', value };
      }
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
const editStorageNote = ref('');
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
  editStorageNote.value = item.value.storage_note ?? '';
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
    const hidden = !!field.showWhen && editCategoryValues.value[field.showWhen.field] !== field.showWhen.equals;
    let value: unknown = hidden ? null : (editCategoryValues.value[field.key] ?? null);
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
  if (NAME_REQUIRED_CATEGORIES.has(item.value.category) && !editName.value.trim()) {
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
        storageNote: editStorageNote.value || null,
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

// --- Duplicate ---

const duplicating = ref(false);

async function duplicateItem() {
  if (!item.value) return;
  duplicating.value = true;
  saveError.value = '';
  try {
    const detail = categoryDetail(item.value);
    const config = CATEGORY_FORM_FIELDS[item.value.category] ?? [];
    const categoryPayload: Record<string, unknown> = {};
    for (const f of config) {
      const columnKey = f.key.replace(/^p_/, '');
      categoryPayload[f.key] = detail?.[columnKey] ?? null;
      if (f.otherKey) {
        const otherColumnKey = f.otherKey.replace(/^p_/, '');
        categoryPayload[f.otherKey] = detail?.[otherColumnKey] ?? null;
      }
    }

    const newItemId = await createItem(
      item.value.category,
      {
        name: `Copy of ${item.value.name}`,
        manufacturerOrClub: item.value.manufacturer_or_club,
        storageLocation: item.value.storage_location,
        storageNote: item.value.storage_note,
        approxValueUsd: item.value.approx_value_usd != null ? Number(item.value.approx_value_usd) : null,
        valueEstimatedAt: item.value.value_estimated_at,
        notes: item.value.notes,
      },
      categoryPayload,
      [],
    );

    if (photos.value.length > 0) {
      const { error: photoError } = await client.from('item_photos').insert(
        photos.value.map((p) => ({
          item_id: newItemId,
          r2_key: p.r2_key,
          url: p.url,
          sort_order: p.sort_order,
          is_primary: p.is_primary,
        })),
      );
      if (photoError) throw photoError;
    }

    await navigateTo(`/items/${newItemId}`);
  } catch (e: any) {
    saveError.value = e?.message ?? 'Failed to duplicate item.';
  } finally {
    duplicating.value = false;
  }
}

// --- Add photo ---

const addingPhoto = ref(false);

async function handleAddPhoto(e: Event) {
  const input = e.target as HTMLInputElement;
  const files = input.files ? Array.from(input.files) : [];
  if (!files.length || !item.value) return;
  addingPhoto.value = true;
  saveError.value = '';
  try {
    const hadNoPhotos = photos.value.length === 0;
    const startOrder = hadNoPhotos ? 0 : Math.max(...photos.value.map((p) => p.sort_order)) + 1;
    const rows: { item_id: string; r2_key: string; url: string; sort_order: number; is_primary: boolean }[] = [];
    for (let i = 0; i < files.length; i++) {
      const uploaded = await uploadPhoto(files[i]);
      rows.push({
        item_id: itemId,
        r2_key: uploaded.key,
        url: uploaded.publicUrl,
        sort_order: startOrder + i,
        is_primary: hadNoPhotos && i === 0,
      });
    }
    const { error: insertError } = await client.from('item_photos').insert(rows);
    if (insertError) throw insertError;
    await loadItem();
  } catch (e: any) {
    saveError.value = e?.message ?? 'Failed to add photo.';
  } finally {
    addingPhoto.value = false;
    input.value = '';
  }
}

// --- Add document ---

const addingDocument = ref(false);

async function handleAddDocument(e: Event) {
  const input = e.target as HTMLInputElement;
  const files = input.files ? Array.from(input.files) : [];
  if (!files.length || !item.value) return;
  addingDocument.value = true;
  saveError.value = '';
  try {
    const rows: { item_id: string; r2_key: string; url: string; filename: string }[] = [];
    for (const file of files) {
      const uploaded = await uploadDocument(file);
      rows.push({ item_id: itemId, r2_key: uploaded.key, url: uploaded.publicUrl, filename: file.name });
    }
    const { error: insertError } = await client.from('item_documents').insert(rows);
    if (insertError) throw insertError;
    await loadItem();
  } catch (e: any) {
    saveError.value = e?.message ?? 'Failed to add document.';
  } finally {
    addingDocument.value = false;
    input.value = '';
  }
}

async function downloadDocument(doc: { url: string; filename: string }) {
  try {
    const response = await fetch(doc.url);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = doc.filename;
    a.click();
    URL.revokeObjectURL(blobUrl);
  } catch (e: any) {
    saveError.value = e?.message ?? 'Failed to download document.';
  }
}

// --- Linking ---

const links = ref<{ linkId: string; id: string; name: string; category: string; relationshipLabel: string }[]>([]);

async function loadLinks() {
  links.value = await listLinks(itemId);
}

const showLinkPicker = ref(false);
const linkSearchQuery = ref('');
const linkSearchResults = ref<{ id: string; name: string; category: string }[]>([]);
const linkSearching = ref(false);
const pickedItem = ref<{ id: string; name: string; category: string } | null>(null);
const linkLabel = ref('');
const linkError = ref('');
const linking = ref(false);

let searchDebounce: ReturnType<typeof setTimeout> | null = null;
watch(linkSearchQuery, (q) => {
  if (searchDebounce) clearTimeout(searchDebounce);
  searchDebounce = setTimeout(async () => {
    linkSearching.value = true;
    try {
      const results = await searchItems(q, itemId);
      if (q === linkSearchQuery.value) {
        linkSearchResults.value = results;
      }
    } finally {
      linkSearching.value = false;
    }
  }, 250);
});

function openLinkPicker() {
  showLinkPicker.value = true;
  linkSearchQuery.value = '';
  linkSearchResults.value = [];
  pickedItem.value = null;
  linkLabel.value = '';
  linkError.value = '';
}

function closeLinkPicker() {
  showLinkPicker.value = false;
}

function pickItem(result: { id: string; name: string; category: string }) {
  pickedItem.value = result;
}

async function submitLink() {
  if (!pickedItem.value) {
    linkError.value = 'Pick an item first.';
    return;
  }
  if (!linkLabel.value.trim()) {
    linkError.value = 'Describe the relationship.';
    return;
  }
  linking.value = true;
  linkError.value = '';
  try {
    await createLink(itemId, pickedItem.value.id, linkLabel.value.trim());
    await loadLinks();
    closeLinkPicker();
  } catch (e: any) {
    linkError.value = e?.message ?? 'Failed to create link.';
  } finally {
    linking.value = false;
  }
}

onMounted(async () => {
  await loadItem();
  await loadLinks();
});
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

    <template v-else-if="item">
    <div class="rt-detail-grid" style="display: grid; grid-template-columns: 0.9fr 1.1fr; gap: 28px; align-items: start">
      <div>
        <div style="border: 1px solid var(--color-navy); background: #fff; height: 520px; overflow: hidden">
          <img v-if="primaryPhoto" :src="primaryPhoto.url" :alt="item.name" style="width: 100%; height: 100%; object-fit: contain; display: block; background: var(--color-paper)" />
          <div v-else style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: repeating-linear-gradient(135deg, #EAE4D5 0 6px, var(--color-paper) 6px 12px)">
            <span style="font: 500 11px 'JetBrains Mono', monospace; letter-spacing: 0.1em; color: rgba(22,34,76,0.5)">NO PHOTO YET</span>
          </div>
        </div>
        <div v-if="photos.length > 1" class="rt-thumb-grid" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 8px">
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
        <div style="font: 500 12px 'JetBrains Mono', monospace; letter-spacing: 0.1em; color: rgba(22,34,76,0.7)">{{ itemSubline }}</div>

        <div v-if="!editing" style="display: flex; gap: 8px; margin-top: 18px">
          <button type="button" style="border: 0; cursor: pointer; background: var(--color-navy); color: var(--color-paper); padding: 10px 15px; font: 400 11px 'Archivo Black', sans-serif; letter-spacing: 0.08em" @click="startEdit">EDIT ENTRY</button>
          <label style="border: 1px solid var(--color-navy); cursor: pointer; background: transparent; color: var(--color-navy); padding: 10px 15px; font: 600 11px 'Archivo', sans-serif; letter-spacing: 0.08em; text-transform: uppercase">
            {{ addingPhoto ? 'Uploading…' : 'Add photo' }}
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple :disabled="addingPhoto" style="display: none" @change="handleAddPhoto" />
          </label>
          <button type="button" :disabled="duplicating" style="border: 1px solid var(--color-navy); cursor: pointer; background: transparent; color: var(--color-navy); padding: 10px 15px; font: 600 11px 'Archivo', sans-serif; letter-spacing: 0.08em; text-transform: uppercase" @click="duplicateItem">
            {{ duplicating ? 'Duplicating…' : 'Duplicate' }}
          </button>
          <span v-if="saveError" style="color: var(--color-rust); font-size: 12.5px">{{ saveError }}</span>
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

          <div class="rt-value-storage-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 14px">
            <div v-if="item.approx_value_usd" style="background: var(--color-orange); border: 1px solid var(--color-navy); padding: 14px 16px">
              <div style="font: 500 10px 'JetBrains Mono', monospace; letter-spacing: 0.12em; color: rgba(22,34,76,0.75)">APPROX. VALUE</div>
              <div style="font: 400 38px 'Archivo Black', sans-serif; line-height: 1.05; margin-top: 4px">${{ Number(item.approx_value_usd).toFixed(2) }}</div>
              <div v-if="item.value_estimated_at" style="font: 400 10.5px 'JetBrains Mono', monospace; color: rgba(22,34,76,0.8); margin-top: 4px">EST. {{ item.value_estimated_at }} · {{ formatItemDetailAge(item.value_estimated_at) }}</div>
            </div>
            <div style="background: #fff; border: 1px solid var(--color-navy); padding: 14px 16px">
              <div style="font: 500 10px 'JetBrains Mono', monospace; letter-spacing: 0.12em; color: rgba(22,34,76,0.6)">STORAGE LOCATION</div>
              <div style="font: 400 24px 'Archivo Black', sans-serif; line-height: 1.1; margin-top: 6px">{{ item.storage_location || '—' }}</div>
              <div v-if="item.storage_note" style="font: 400 10.5px 'JetBrains Mono', monospace; color: rgba(22,34,76,0.7); margin-top: 4px">{{ item.storage_note }}</div>
            </div>
          </div>

          <div v-if="item.notes" style="background: #fff; border: 1px solid var(--color-navy); margin-top: 14px; padding: 14px 16px">
            <div style="font: 500 10px 'JetBrains Mono', monospace; letter-spacing: 0.12em; color: rgba(22,34,76,0.6); margin-bottom: 7px">NOTES</div>
            <p style="margin: 0; font-size: 13.5px; line-height: 1.55; color: rgba(22,34,76,0.9)">{{ item.notes }}</p>
          </div>

          <div style="background: #fff; border: 1px solid var(--color-navy); margin-top: 14px; padding: 14px 16px">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 7px">
              <div style="font: 500 10px 'JetBrains Mono', monospace; letter-spacing: 0.12em; color: rgba(22,34,76,0.6)">DOCUMENTS</div>
              <label style="border: 1px solid var(--color-navy); cursor: pointer; background: transparent; color: var(--color-navy); padding: 6px 11px; font: 600 10px 'Archivo', sans-serif; letter-spacing: 0.06em; text-transform: uppercase">
                {{ addingDocument ? 'Uploading…' : '+ Add document' }}
                <input type="file" multiple :disabled="addingDocument" style="display: none" @change="handleAddDocument" />
              </label>
            </div>
            <div v-if="documents.length === 0" style="font-size: 12.5px; color: rgba(22,34,76,0.5)">No documents attached yet.</div>
            <div v-for="doc in documents" :key="doc.id" style="display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px dotted rgba(22,34,76,0.3)">
              <span style="flex: 1; font-size: 13px; color: var(--color-navy); overflow: hidden; text-overflow: ellipsis; white-space: nowrap">{{ doc.filename }}</span>
              <span style="font: 400 10px 'JetBrains Mono', monospace; color: rgba(22,34,76,0.5)">{{ doc.created_at.slice(0, 10) }}</span>
              <a :href="doc.url" target="_blank" rel="noopener" style="font: 600 10.5px 'Archivo', sans-serif; letter-spacing: 0.06em; text-transform: uppercase; color: var(--color-navy); text-decoration: underline">Open</a>
              <button type="button" style="border: 0; background: transparent; cursor: pointer; padding: 0; font: 600 10.5px 'Archivo', sans-serif; letter-spacing: 0.06em; text-transform: uppercase; color: var(--color-rust); text-decoration: underline" @click="downloadDocument(doc)">Download</button>
            </div>
          </div>
        </template>

        <template v-else>
          <div class="rt-edit-grid" style="background: #fff; border: 1px solid var(--color-navy); margin-top: 20px; padding: 18px 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 16px">
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
              <label style="font: 500 9.5px 'JetBrains Mono', monospace; letter-spacing: 0.12em; color: rgba(22,34,76,0.65)">STORAGE NOTE</label>
              <input v-model="editStorageNote" style="padding: 9px 11px; border: 1px solid var(--color-navy); background: var(--color-paper); font-size: 13.5px; color: var(--color-navy)" />
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

      <div style="margin-top: 38px; border: 1px solid var(--color-navy); background: #fff">
        <div style="background: var(--color-navy); color: var(--color-paper); padding: 9px 16px; display: flex; justify-content: space-between; align-items: center">
          <span style="font: 400 11px 'Archivo Black', sans-serif; letter-spacing: 0.12em">RELATED IN COLLECTION</span>
          <span style="font: 400 10px 'JetBrains Mono', monospace; color: rgba(245,241,232,0.6)">{{ links.length }} LINK{{ links.length === 1 ? '' : 'S' }}</span>
        </div>
        <div v-if="links.length > 0" style="padding: 26px 20px; display: grid; grid-template-columns: 1fr auto 1fr; gap: 0; align-items: center; background: repeating-linear-gradient(90deg, rgba(22,34,76,0.045) 0 1px, transparent 1px 26px)">
          <div style="display: flex; flex-direction: column; gap: 14px; align-items: flex-end">
            <div v-for="r in links.filter((_, i) => i % 2 === 0)" :key="r.linkId" style="display: flex; align-items: center; gap: 0; width: 100%; justify-content: flex-end">
              <div style="background: var(--color-paper); border: 1px solid var(--color-navy); padding: 10px 13px; cursor: pointer; max-width: 280px; flex: none" @click="navigateTo(`/items/${r.id}`)">
                <div style="font: 700 9px 'JetBrains Mono', monospace; letter-spacing: 0.12em; color: var(--color-rust)">{{ r.relationshipLabel.toUpperCase() }}</div>
                <div style="font: 400 13px 'Archivo Black', sans-serif; text-transform: uppercase; margin-top: 4px">{{ r.name }}</div>
                <div style="font: 400 10px 'JetBrains Mono', monospace; color: rgba(22,34,76,0.65); margin-top: 3px">{{ CATEGORY_LABELS[r.category]?.toUpperCase() }}</div>
              </div>
              <div style="width: 54px; border-top: 1px dashed var(--color-navy); flex: none" />
            </div>
          </div>
          <div style="background: var(--color-orange); border: 1px solid var(--color-navy); padding: 14px 18px; text-align: center; max-width: 230px">
            <div style="font: 700 9px 'JetBrains Mono', monospace; letter-spacing: 0.12em; color: rgba(22,34,76,0.75)">THIS ITEM</div>
            <div style="font: 400 17px 'Archivo Black', sans-serif; text-transform: uppercase; line-height: 1.1; margin-top: 5px">{{ item.name }}</div>
            <div v-if="item.reference_code" style="font: 400 10px 'JetBrains Mono', monospace; margin-top: 4px; color: rgba(22,34,76,0.8)">{{ item.reference_code }}</div>
          </div>
          <div style="display: flex; flex-direction: column; gap: 14px; align-items: flex-start">
            <div v-for="r in links.filter((_, i) => i % 2 === 1)" :key="r.linkId" style="display: flex; align-items: center; width: 100%">
              <div style="width: 54px; border-top: 1px dashed var(--color-navy); flex: none" />
              <div style="background: var(--color-paper); border: 1px solid var(--color-navy); padding: 10px 13px; cursor: pointer; max-width: 280px; flex: none" @click="navigateTo(`/items/${r.id}`)">
                <div style="font: 700 9px 'JetBrains Mono', monospace; letter-spacing: 0.12em; color: var(--color-rust)">{{ r.relationshipLabel.toUpperCase() }}</div>
                <div style="font: 400 13px 'Archivo Black', sans-serif; text-transform: uppercase; margin-top: 4px">{{ r.name }}</div>
                <div style="font: 400 10px 'JetBrains Mono', monospace; color: rgba(22,34,76,0.65); margin-top: 3px">{{ CATEGORY_LABELS[r.category]?.toUpperCase() }}</div>
              </div>
            </div>
          </div>
        </div>
        <div style="border-top: 1px dashed rgba(22,34,76,0.35); padding: 12px 16px; display: flex; gap: 8px; align-items: center">
          <button type="button" style="border: 1px dashed rgba(22,34,76,0.5); background: transparent; cursor: pointer; padding: 8px 12px; font: 500 10px 'JetBrains Mono', monospace; letter-spacing: 0.1em; color: var(--color-navy)" @click="openLinkPicker">+ LINK ANOTHER ITEM</button>
          <span style="font: 400 10.5px 'JetBrains Mono', monospace; color: rgba(22,34,76,0.55)">Links are two-way — plans, catalogs, motors and parts all cross-reference.</span>
        </div>
      </div>

      <div v-if="showLinkPicker" style="position: fixed; inset: 0; background: rgba(22,34,76,0.5); display: flex; align-items: center; justify-content: center; z-index: 50" @click.self="closeLinkPicker">
        <div class="rt-link-modal" style="background: #fff; border: 1px solid var(--color-navy); width: 420px; padding: 20px">
          <div style="font: 400 14px 'Archivo Black', sans-serif; text-transform: uppercase; margin-bottom: 12px">Link another item</div>
          <input
            v-model="linkSearchQuery"
            type="text"
            placeholder="Search your collection by name…"
            style="width: 100%; padding: 9px 11px; border: 1px solid var(--color-navy); background: var(--color-paper); font-size: 13.5px; color: var(--color-navy)"
          />
          <div style="max-height: 180px; overflow-y: auto; margin-top: 8px; display: flex; flex-direction: column; gap: 4px">
            <div v-if="linkSearching" style="font-size: 12px; color: rgba(22,34,76,0.5)">Searching…</div>
            <button
              v-for="r in linkSearchResults"
              :key="r.id"
              type="button"
              :style="{
                textAlign: 'left', border: '1px solid var(--color-navy)',
                background: pickedItem?.id === r.id ? 'var(--color-navy)' : 'transparent',
                color: pickedItem?.id === r.id ? 'var(--color-paper)' : 'var(--color-navy)',
                cursor: 'pointer', padding: '7px 9px', fontSize: '12.5px',
              }"
              @click="pickItem(r)"
            >
              {{ r.name }} <span style="opacity: 0.6">({{ CATEGORY_LABELS[r.category] }})</span>
            </button>
          </div>
          <div style="margin-top: 12px; display: flex; flex-direction: column; gap: 5px">
            <label style="font: 500 9.5px 'JetBrains Mono', monospace; letter-spacing: 0.12em; color: rgba(22,34,76,0.65)">RELATIONSHIP</label>
            <input v-model="linkLabel" type="text" placeholder="e.g. FITS, CAME FROM, PLAN FOR THIS KIT" style="padding: 9px 11px; border: 1px solid var(--color-navy); background: var(--color-paper); font-size: 13.5px; color: var(--color-navy)" />
          </div>
          <div style="margin-top: 14px; display: flex; gap: 8px; align-items: center">
            <button type="button" :disabled="linking" style="border: 0; cursor: pointer; background: var(--color-navy); color: var(--color-paper); padding: 9px 14px; font: 400 11px 'Archivo Black', sans-serif; letter-spacing: 0.08em" @click="submitLink">LINK</button>
            <button type="button" style="border: 1px solid var(--color-navy); cursor: pointer; background: transparent; color: var(--color-navy); padding: 9px 14px; font: 600 10.5px 'Archivo', sans-serif; letter-spacing: 0.08em; text-transform: uppercase" @click="closeLinkPicker">Cancel</button>
            <span v-if="linkError" style="color: var(--color-rust); font-size: 12px">{{ linkError }}</span>
          </div>
        </div>
      </div>
    </template>
  </main>
</template>

<style scoped>
@media (max-width: 768px) {
  /* !important beats the elements' own inline `style` attributes (the app-wide convention —
     see app/assets/css/main.css). */
  .rt-detail-grid,
  .rt-value-storage-grid,
  .rt-edit-grid {
    grid-template-columns: 1fr !important;
  }

  /* .rt-edit-grid has children using grid-column: span 2 (Item Name, Notes) — redefining the
     explicit grid-template-columns alone doesn't stop a spanning child from creating its own
     implicit tracks, which would keep that field multi-column-wide even after collapsing the
     grid to one column. */
  .rt-edit-grid > * {
    grid-column: auto !important;
  }

  .rt-thumb-grid {
    grid-template-columns: repeat(auto-fill, minmax(64px, 1fr)) !important;
  }

  .rt-link-modal {
    width: calc(100vw - 32px) !important;
  }
}
</style>
