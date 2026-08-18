<script setup lang="ts">
import { CATEGORY_FORM_FIELDS, CATEGORY_LABELS } from '~/data/categoryFormFields';

const { createItem } = useCreateItem();
const { uploadPhoto } = useUploadPhoto();

const name = ref('');
const manufacturerOrClub = ref('');
const storageLocation = ref('');
const approxValueUsd = ref('');
const valueEstimatedAt = ref('');
const notes = ref('');

const stagedPhotos = ref<{ key: string; publicUrl: string; previewName: string }[]>([]);
const uploading = ref(false);

const selectedCategory = ref<string | null>(null);
const categoryValues = reactive<Record<string, string>>({});
const otherValues = reactive<Record<string, string>>({});

const error = ref('');
const saving = ref(false);

const categories = Object.keys(CATEGORY_LABELS);
const currentFields = computed(() => (selectedCategory.value ? CATEGORY_FORM_FIELDS[selectedCategory.value] : []));

function selectCategory(cat: string) {
  selectedCategory.value = cat;
  Object.keys(categoryValues).forEach((k) => delete categoryValues[k]);
  Object.keys(otherValues).forEach((k) => delete otherValues[k]);
}

async function handleFileInput(e: Event) {
  const input = e.target as HTMLInputElement;
  const files = input.files ? Array.from(input.files) : [];
  if (!files.length) return;
  uploading.value = true;
  error.value = '';
  try {
    for (const file of files) {
      const uploaded = await uploadPhoto(file);
      stagedPhotos.value.push({ ...uploaded, previewName: file.name });
    }
  } catch (e: any) {
    error.value = e?.message ?? 'Photo upload failed.';
  } finally {
    uploading.value = false;
    input.value = '';
  }
}

function buildCategoryFieldPayload(): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  for (const field of currentFields.value) {
    let value: unknown = categoryValues[field.key] ?? null;
    if (field.type === 'number') {
      value = value === '' || value === null || value === undefined ? null : Number(value);
    } else if (value === '') {
      value = null;
    }
    payload[field.key] = value;
    if (field.otherKey) {
      payload[field.otherKey] = value === 'Other' ? (otherValues[field.otherKey] || null) : null;
    }
  }
  return payload;
}

function resetForm() {
  name.value = '';
  manufacturerOrClub.value = '';
  storageLocation.value = '';
  approxValueUsd.value = '';
  valueEstimatedAt.value = '';
  notes.value = '';
  stagedPhotos.value = [];
  selectedCategory.value = null;
  Object.keys(categoryValues).forEach((k) => delete categoryValues[k]);
  Object.keys(otherValues).forEach((k) => delete otherValues[k]);
}

async function save(andAddAnother: boolean) {
  error.value = '';
  if (!name.value.trim()) {
    error.value = 'Item name is required.';
    return;
  }
  if (!selectedCategory.value) {
    error.value = 'Pick a category.';
    return;
  }
  saving.value = true;
  try {
    await createItem(
      selectedCategory.value,
      {
        name: name.value.trim(),
        manufacturerOrClub: manufacturerOrClub.value || null,
        storageLocation: storageLocation.value || null,
        approxValueUsd: approxValueUsd.value ? Number(approxValueUsd.value) : null,
        valueEstimatedAt: valueEstimatedAt.value || null,
        notes: notes.value || null,
      },
      buildCategoryFieldPayload(),
      stagedPhotos.value,
    );

    if (andAddAnother) {
      resetForm();
    } else {
      await navigateTo('/');
    }
  } catch (e: any) {
    error.value = e?.message ?? 'Failed to save item.';
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <main style="max-width: 1000px; margin: 0 auto; padding: 28px 28px 80px">
    <div style="border-bottom: 3px solid var(--color-navy); padding-bottom: 10px; margin-bottom: 24px">
      <h1 style="margin: 0; font: 400 30px 'Archivo Black', sans-serif; text-transform: uppercase; letter-spacing: -0.01em">Add to collection</h1>
      <div style="font: 500 11px 'JetBrains Mono', monospace; letter-spacing: 0.08em; color: rgba(22,34,76,0.65); margin-top: 5px">
        GENERAL DETAILS FIRST, THEN THE FIELDS FOR THIS CATEGORY
      </div>
    </div>

    <!-- Section 1: General -->
    <div style="background: #fff; border: 1px solid var(--color-navy)">
      <div style="background: var(--color-navy); color: var(--color-paper); padding: 9px 16px; display: flex; align-items: center; gap: 10px">
        <span style="background: var(--color-orange); color: var(--color-navy); width: 19px; height: 19px; display: flex; align-items: center; justify-content: center; font: 400 11px 'Archivo Black', sans-serif">1</span>
        <span style="font: 400 11px 'Archivo Black', sans-serif; letter-spacing: 0.12em">GENERAL</span>
      </div>
      <div style="padding: 18px 20px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px">
        <div style="grid-column: span 2; display: flex; flex-direction: column; gap: 5px">
          <label style="font: 500 9.5px 'JetBrains Mono', monospace; letter-spacing: 0.12em; color: rgba(22,34,76,0.65)">ITEM NAME</label>
          <input v-model="name" placeholder="e.g. Defender Space Probe" style="padding: 9px 11px; border: 1px solid var(--color-navy); background: var(--color-paper); font-size: 13.5px; color: var(--color-navy)" />
        </div>
        <div style="display: flex; flex-direction: column; gap: 5px">
          <label style="font: 500 9.5px 'JetBrains Mono', monospace; letter-spacing: 0.12em; color: rgba(22,34,76,0.65)">MANUFACTURER / CLUB</label>
          <input v-model="manufacturerOrClub" style="padding: 9px 11px; border: 1px solid var(--color-navy); background: var(--color-paper); font-size: 13.5px; color: var(--color-navy)" />
        </div>
        <div style="display: flex; flex-direction: column; gap: 5px">
          <label style="font: 500 9.5px 'JetBrains Mono', monospace; letter-spacing: 0.12em; color: rgba(22,34,76,0.65)">STORAGE LOCATION</label>
          <input v-model="storageLocation" placeholder="SHELF A · BIN 03" style="padding: 9px 11px; border: 1px solid var(--color-navy); background: var(--color-paper); font-size: 13.5px; color: var(--color-navy)" />
        </div>
        <div style="display: flex; flex-direction: column; gap: 5px">
          <label style="font: 500 9.5px 'JetBrains Mono', monospace; letter-spacing: 0.12em; color: rgba(22,34,76,0.65)">APPROX. VALUE (USD)</label>
          <input v-model="approxValueUsd" type="number" step="0.01" placeholder="0.00" style="padding: 9px 11px; border: 1px solid var(--color-navy); background: var(--color-paper); font-size: 13.5px; color: var(--color-navy)" />
        </div>
        <div style="display: flex; flex-direction: column; gap: 5px">
          <label style="font: 500 9.5px 'JetBrains Mono', monospace; letter-spacing: 0.12em; color: rgba(22,34,76,0.65)">DATE OF ESTIMATE</label>
          <input v-model="valueEstimatedAt" type="date" style="padding: 9px 11px; border: 1px solid var(--color-navy); background: var(--color-paper); font-size: 13.5px; color: var(--color-navy)" />
        </div>
        <div style="grid-column: span 3; display: flex; flex-direction: column; gap: 5px">
          <label style="font: 500 9.5px 'JetBrains Mono', monospace; letter-spacing: 0.12em; color: rgba(22,34,76,0.65)">NOTES</label>
          <textarea v-model="notes" rows="3" placeholder="Condition, provenance, missing parts, who I got it from…" style="padding: 9px 11px; border: 1px solid var(--color-navy); background: var(--color-paper); font-size: 13.5px; color: var(--color-navy); resize: vertical" />
        </div>
        <div style="grid-column: span 3; display: flex; gap: 10px; align-items: center; border: 1px dashed rgba(22,34,76,0.45); padding: 12px 14px">
          <span style="font: 500 10px 'JetBrains Mono', monospace; letter-spacing: 0.1em; color: rgba(22,34,76,0.7)">PHOTOS</span>
          <span style="flex: 1; font-size: 12.5px; color: rgba(22,34,76,0.65)">
            {{ uploading ? 'Uploading…' : stagedPhotos.length ? `${stagedPhotos.length} photo(s) attached — first becomes the card photo.` : 'First photo becomes the card photo.' }}
          </span>
          <label style="border: 1px solid var(--color-navy); background: transparent; cursor: pointer; padding: 7px 12px; font: 600 10.5px 'Archivo', sans-serif; letter-spacing: 0.08em; text-transform: uppercase">
            Browse files
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple :disabled="uploading" style="display: none" @change="handleFileInput" />
          </label>
        </div>
      </div>
    </div>

    <!-- Section 2: Category -->
    <div style="background: #fff; border: 1px solid var(--color-navy); border-top: 0">
      <div style="background: var(--color-navy); color: var(--color-paper); padding: 9px 16px; display: flex; align-items: center; gap: 10px">
        <span style="background: var(--color-orange); color: var(--color-navy); width: 19px; height: 19px; display: flex; align-items: center; justify-content: center; font: 400 11px 'Archivo Black', sans-serif">2</span>
        <span style="font: 400 11px 'Archivo Black', sans-serif; letter-spacing: 0.12em">CATEGORY</span>
      </div>
      <div style="padding: 16px 20px; display: flex; flex-wrap: wrap; gap: 8px">
        <button
          v-for="cat in categories"
          :key="cat"
          type="button"
          :style="{
            border: '1px solid var(--color-navy)',
            background: selectedCategory === cat ? 'var(--color-navy)' : 'transparent',
            color: selectedCategory === cat ? 'var(--color-paper)' : 'var(--color-navy)',
            cursor: 'pointer',
            padding: '9px 14px',
            font: `600 11.5px 'Archivo', sans-serif`,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }"
          @click="selectCategory(cat)"
        >
          {{ CATEGORY_LABELS[cat] }}
        </button>
      </div>
    </div>

    <!-- Section 3: Category-specific -->
    <div v-if="selectedCategory" style="background: #fff; border: 1px solid var(--color-navy); border-top: 0">
      <div style="background: var(--color-orange); color: var(--color-navy); padding: 9px 16px; display: flex; align-items: center; gap: 10px">
        <span style="background: var(--color-navy); color: var(--color-paper); width: 19px; height: 19px; display: flex; align-items: center; justify-content: center; font: 400 11px 'Archivo Black', sans-serif">3</span>
        <span style="font: 400 11px 'Archivo Black', sans-serif; letter-spacing: 0.12em">{{ CATEGORY_LABELS[selectedCategory].toUpperCase() }} DETAILS</span>
      </div>
      <div style="padding: 18px 20px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px">
        <div v-for="field in currentFields" :key="field.key" style="display: flex; flex-direction: column; gap: 5px">
          <label style="font: 500 9.5px 'JetBrains Mono', monospace; letter-spacing: 0.12em; color: rgba(22,34,76,0.65)">{{ field.label.toUpperCase() }}</label>
          <select
            v-if="field.type === 'select'"
            v-model="categoryValues[field.key]"
            style="padding: 9px 11px; border: 1px solid var(--color-navy); background: var(--color-paper); font-size: 13.5px; color: var(--color-navy)"
          >
            <option value="" disabled>Select…</option>
            <option v-for="opt in field.options" :key="opt" :value="opt">{{ opt }}</option>
          </select>
          <input
            v-else-if="field.type === 'number'"
            v-model="categoryValues[field.key]"
            type="number"
            step="any"
            style="padding: 9px 11px; border: 1px solid var(--color-navy); background: var(--color-paper); font-size: 13.5px; color: var(--color-navy)"
          />
          <textarea
            v-else-if="field.type === 'textarea'"
            v-model="categoryValues[field.key]"
            rows="3"
            style="padding: 9px 11px; border: 1px solid var(--color-navy); background: var(--color-paper); font-size: 13.5px; color: var(--color-navy); resize: vertical"
          />
          <input
            v-else
            v-model="categoryValues[field.key]"
            type="text"
            style="padding: 9px 11px; border: 1px solid var(--color-navy); background: var(--color-paper); font-size: 13.5px; color: var(--color-navy)"
          />
          <input
            v-if="field.otherKey && categoryValues[field.key] === 'Other'"
            v-model="otherValues[field.otherKey]"
            type="text"
            placeholder="Specify…"
            style="padding: 9px 11px; border: 1px dashed rgba(22,34,76,0.5); background: var(--color-paper); font-size: 13.5px; color: var(--color-navy)"
          />
        </div>
      </div>
      <div style="border-top: 1px dashed rgba(22,34,76,0.35); padding: 14px 20px; display: flex; gap: 10px; align-items: center">
        <button
          type="button"
          :disabled="saving"
          style="border: 0; cursor: pointer; background: var(--color-navy); color: var(--color-paper); padding: 11px 18px; font: 400 12px 'Archivo Black', sans-serif; letter-spacing: 0.08em"
          @click="save(false)"
        >
          SAVE ENTRY
        </button>
        <button
          type="button"
          :disabled="saving"
          style="border: 1px solid var(--color-navy); cursor: pointer; background: transparent; padding: 11px 18px; font: 600 11.5px 'Archivo', sans-serif; letter-spacing: 0.08em; text-transform: uppercase; color: var(--color-navy)"
          @click="save(true)"
        >
          Save &amp; add another
        </button>
        <span v-if="error" style="color: var(--color-rust); font-size: 12.5px">{{ error }}</span>
      </div>
    </div>
  </main>
</template>
