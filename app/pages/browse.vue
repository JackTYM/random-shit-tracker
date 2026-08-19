<script setup lang="ts">
import { CATEGORY_LABELS } from '~/data/categoryFormFields';
import { CATEGORY_CARD_FIELDS } from '~/data/categoryCardFields';

const { listItems, categoryDetail } = useItems();
const client = useNeonClient();

const items = ref<any[]>([]);
const loading = ref(true);
const loadError = ref('');
const primaryPhotoByItem = ref<Record<string, string>>({});

async function load() {
  loading.value = true;
  loadError.value = '';
  try {
    items.value = await listItems();
    const ids = items.value.map((i) => i.id);
    if (ids.length > 0) {
      const { data, error } = await client
        .from('item_photos')
        .select('item_id, url')
        .in('item_id', ids)
        .eq('is_primary', true);
      if (error) throw error;
      const map: Record<string, string> = {};
      for (const row of data ?? []) map[(row as any).item_id] = (row as any).url;
      primaryPhotoByItem.value = map;
    }
  } catch (e: any) {
    loadError.value = e?.message ?? 'Failed to load items.';
  } finally {
    loading.value = false;
  }
}

onMounted(load);

const selectedCategories = ref<Set<string>>(new Set());
const selectedManufacturers = ref<Set<string>>(new Set());
const selectedStorages = ref<Set<string>>(new Set());
const sortBy = ref<'newest' | 'name' | 'value'>('newest');

function toggle(set: Set<string>, value: string) {
  if (set.has(value)) set.delete(value);
  else set.add(value);
}

const categoryOptions = computed(() => {
  const counts: Record<string, number> = {};
  for (const it of items.value) counts[it.category] = (counts[it.category] ?? 0) + 1;
  return Object.keys(CATEGORY_LABELS)
    .map((cat) => ({ value: cat, label: CATEGORY_LABELS[cat], count: counts[cat] ?? 0 }))
    .filter((o) => o.count > 0);
});

const manufacturerOptions = computed(() => {
  const counts: Record<string, number> = {};
  for (const it of items.value) {
    if (it.manufacturer_or_club) counts[it.manufacturer_or_club] = (counts[it.manufacturer_or_club] ?? 0) + 1;
  }
  return Object.keys(counts).sort().map((m) => ({ value: m, label: m, count: counts[m] }));
});

const storageOptions = computed(() => {
  const counts: Record<string, number> = {};
  for (const it of items.value) {
    if (it.storage_location) counts[it.storage_location] = (counts[it.storage_location] ?? 0) + 1;
  }
  return Object.keys(counts).sort().map((s) => ({ value: s, label: s, count: counts[s] }));
});

const sortOptions = [
  { value: 'newest', label: 'Newest' },
  { value: 'name', label: 'Name' },
  { value: 'value', label: 'Value' },
] as const;

const filteredItems = computed(() => {
  let result = items.value;
  if (selectedCategories.value.size > 0) {
    result = result.filter((it) => selectedCategories.value.has(it.category));
  }
  if (selectedManufacturers.value.size > 0) {
    result = result.filter((it) => it.manufacturer_or_club && selectedManufacturers.value.has(it.manufacturer_or_club));
  }
  if (selectedStorages.value.size > 0) {
    result = result.filter((it) => it.storage_location && selectedStorages.value.has(it.storage_location));
  }

  const sorted = [...result];
  if (sortBy.value === 'name') {
    sorted.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortBy.value === 'value') {
    sorted.sort((a, b) => Number(b.approx_value_usd ?? 0) - Number(a.approx_value_usd ?? 0));
  } else {
    sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
  return sorted;
});

function clearFilters() {
  selectedCategories.value = new Set();
  selectedManufacturers.value = new Set();
  selectedStorages.value = new Set();
}

function cardSpecs(it: any): { k: string; v: string }[] {
  const detail = categoryDetail(it);
  if (!detail) return [];
  const fields = CATEGORY_CARD_FIELDS[it.category] ?? [];
  return fields
    .map((f) => ({ k: f.label, v: detail[f.key] }))
    .filter((s) => s.v !== null && s.v !== undefined && s.v !== '');
}
</script>

<template>
  <main style="max-width: 1440px; margin: 0 auto; padding: 24px 28px 64px; display: flex; gap: 24px; align-items: flex-start">
    <aside style="width: 236px; flex: none; position: sticky; top: 86px">
      <div style="background: var(--color-navy); color: var(--color-paper); padding: 9px 12px; font: 400 11px 'Archivo Black', sans-serif; letter-spacing: 0.1em">FILTERS</div>
      <div style="background: #fff; border: 1px solid var(--color-navy); border-top: 0; padding: 14px 12px">
        <div style="font: 500 10px 'JetBrains Mono', monospace; letter-spacing: 0.1em; color: rgba(22,34,76,0.6); margin-bottom: 8px">CATEGORY</div>
        <div style="display: flex; flex-direction: column; gap: 5px">
          <button
            v-for="opt in categoryOptions"
            :key="opt.value"
            type="button"
            :style="{
              textAlign: 'left', border: '1px solid var(--color-navy)',
              background: selectedCategories.has(opt.value) ? 'var(--color-navy)' : 'transparent',
              color: selectedCategories.has(opt.value) ? 'var(--color-paper)' : 'var(--color-navy)',
              cursor: 'pointer', padding: '7px 9px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              font: `600 11px 'Archivo', sans-serif`, letterSpacing: '0.04em', textTransform: 'uppercase',
            }"
            @click="toggle(selectedCategories, opt.value)"
          >
            <span>{{ opt.label }}</span>
            <span style="font: 400 10px 'JetBrains Mono', monospace; opacity: 0.7">{{ opt.count }}</span>
          </button>
        </div>
        <div style="height: 1px; background: rgba(22,34,76,0.2); margin: 14px 0" />
        <div style="font: 500 10px 'JetBrains Mono', monospace; letter-spacing: 0.1em; color: rgba(22,34,76,0.6); margin-bottom: 8px">MANUFACTURER</div>
        <div style="display: flex; flex-wrap: wrap; gap: 5px">
          <button
            v-for="opt in manufacturerOptions"
            :key="opt.value"
            type="button"
            :style="{
              border: '1px solid var(--color-navy)',
              background: selectedManufacturers.has(opt.value) ? 'var(--color-navy)' : 'transparent',
              color: selectedManufacturers.has(opt.value) ? 'var(--color-paper)' : 'var(--color-navy)',
              cursor: 'pointer', padding: '5px 8px', font: `500 10px 'JetBrains Mono', monospace`, letterSpacing: '0.06em',
            }"
            @click="toggle(selectedManufacturers, opt.value)"
          >
            {{ opt.label }}
          </button>
        </div>
        <div style="height: 1px; background: rgba(22,34,76,0.2); margin: 14px 0" />
        <div style="font: 500 10px 'JetBrains Mono', monospace; letter-spacing: 0.1em; color: rgba(22,34,76,0.6); margin-bottom: 8px">STORAGE</div>
        <div style="display: flex; flex-wrap: wrap; gap: 5px">
          <button
            v-for="opt in storageOptions"
            :key="opt.value"
            type="button"
            :style="{
              border: '1px solid var(--color-navy)',
              background: selectedStorages.has(opt.value) ? 'var(--color-navy)' : 'transparent',
              color: selectedStorages.has(opt.value) ? 'var(--color-paper)' : 'var(--color-navy)',
              cursor: 'pointer', padding: '5px 8px', font: `500 10px 'JetBrains Mono', monospace`, letterSpacing: '0.06em',
            }"
            @click="toggle(selectedStorages, opt.value)"
          >
            {{ opt.label }}
          </button>
        </div>
        <button
          type="button"
          style="width: 100%; margin-top: 16px; border: 1px dashed rgba(22,34,76,0.45); background: transparent; color: var(--color-navy); cursor: pointer; padding: 8px; font: 500 10px 'JetBrains Mono', monospace; letter-spacing: 0.1em"
          @click="clearFilters"
        >
          CLEAR ALL
        </button>
      </div>
    </aside>

    <section style="flex: 1; min-width: 0">
      <div style="display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; border-bottom: 3px solid var(--color-navy); padding-bottom: 10px; margin-bottom: 18px">
        <div>
          <h1 style="margin: 0; font: 400 28px 'Archivo Black', sans-serif; letter-spacing: -0.01em; text-transform: uppercase">Browse collection</h1>
          <div style="font: 500 11px 'JetBrains Mono', monospace; letter-spacing: 0.08em; color: rgba(22,34,76,0.65); margin-top: 5px">{{ filteredItems.length }} ITEM{{ filteredItems.length === 1 ? '' : 'S' }}</div>
        </div>
        <div style="display: flex; align-items: center; gap: 8px">
          <span style="font: 500 10px 'JetBrains Mono', monospace; letter-spacing: 0.08em; color: rgba(22,34,76,0.6)">SORT</span>
          <button
            v-for="opt in sortOptions"
            :key="opt.value"
            type="button"
            :style="{
              border: '1px solid var(--color-navy)',
              background: sortBy === opt.value ? 'var(--color-navy)' : 'transparent',
              color: sortBy === opt.value ? 'var(--color-paper)' : 'var(--color-navy)',
              cursor: 'pointer', padding: '6px 10px', font: `600 10.5px 'Archivo', sans-serif`, letterSpacing: '0.08em', textTransform: 'uppercase',
            }"
            @click="sortBy = opt.value"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>

      <div v-if="loading" style="font: 500 12px 'JetBrains Mono', monospace; color: rgba(22,34,76,0.6)">Loading…</div>
      <p v-else-if="loadError" style="color: var(--color-rust)">{{ loadError }}</p>
      <div v-else style="display: grid; grid-template-columns: repeat(auto-fill, minmax(236px, 1fr)); gap: 16px">
        <div
          v-for="it in filteredItems"
          :key="it.id"
          style="background: #fff; border: 1px solid var(--color-navy); cursor: pointer; display: flex; flex-direction: column"
          @click="navigateTo(`/items/${it.id}`)"
        >
          <div style="position: relative; height: 168px; border-bottom: 1px solid var(--color-navy); overflow: hidden; background: var(--color-paper)">
            <img v-if="primaryPhotoByItem[it.id]" :src="primaryPhotoByItem[it.id]" :alt="it.name" style="width: 100%; height: 100%; object-fit: cover; display: block" />
            <div v-else style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: repeating-linear-gradient(135deg, #EAE4D5 0 6px, var(--color-paper) 6px 12px)">
              <span style="font: 500 10px 'JetBrains Mono', monospace; letter-spacing: 0.1em; color: rgba(22,34,76,0.5); text-align: center; padding: 0 12px">NO PHOTO</span>
            </div>
            <span style="position: absolute; top: 0; left: 0; background: var(--color-orange); color: var(--color-navy); font: 700 9px 'JetBrains Mono', monospace; letter-spacing: 0.1em; padding: 5px 8px">{{ CATEGORY_LABELS[it.category]?.toUpperCase() }}</span>
          </div>
          <div style="padding: 12px 14px 13px; display: flex; flex-direction: column; gap: 9px; flex: 1">
            <div>
              <div style="font: 400 14px 'Archivo Black', sans-serif; line-height: 1.2; text-transform: uppercase">{{ it.name }}</div>
              <div style="font: 500 10px 'JetBrains Mono', monospace; letter-spacing: 0.08em; color: rgba(22,34,76,0.6); margin-top: 4px">{{ it.manufacturer_or_club }}</div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 3px; flex: 1">
              <div v-for="sp in cardSpecs(it)" :key="sp.k" style="display: flex; align-items: baseline; gap: 5px; font: 400 11px 'JetBrains Mono', monospace; color: rgba(22,34,76,0.75)">
                <span>{{ sp.k }}</span>
                <span style="flex: 1; border-bottom: 1px dotted rgba(22,34,76,0.4); transform: translateY(-3px)" />
                <span style="font-weight: 700; color: var(--color-navy)">{{ sp.v }}</span>
              </div>
            </div>
            <div style="border-top: 1px dashed rgba(22,34,76,0.3); padding-top: 9px; display: flex; align-items: center; justify-content: space-between">
              <span style="font: 500 10px 'JetBrains Mono', monospace; letter-spacing: 0.06em; color: var(--color-navy)">▪ {{ it.storage_location || '—' }}</span>
              <span v-if="it.approx_value_usd" style="font: 400 14px 'Archivo Black', sans-serif; color: var(--color-rust)">${{ Number(it.approx_value_usd).toFixed(0) }}</span>
            </div>
          </div>
        </div>
      </div>
      <div v-if="!loading && !loadError && filteredItems.length === 0" style="border: 1px dashed rgba(22,34,76,0.4); padding: 48px; text-align: center; font: 500 12px 'JetBrains Mono', monospace; letter-spacing: 0.08em; color: rgba(22,34,76,0.6)">
        NO ITEMS MATCH THESE FILTERS
      </div>
    </section>
  </main>
</template>
