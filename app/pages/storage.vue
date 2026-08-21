<script setup lang="ts">
import { CATEGORY_LABELS } from '~/data/categoryFormFields';
import type { ItemRecord } from '~/composables/useItems';

const { listItems } = useItems();
const { fetchPrimaryPhotos } = usePrimaryPhotos();
const route = useRoute();

const UNASSIGNED = '__UNASSIGNED__';
const UNASSIGNED_PARAM = 'unassigned';

const items = ref<ItemRecord[]>([]);
const loading = ref(true);
const loadError = ref('');
const primaryPhotoByItem = ref<Record<string, string>>({});

async function load() {
  loading.value = true;
  loadError.value = '';
  try {
    items.value = await listItems();
  } catch (e: any) {
    loadError.value = e?.message ?? 'Failed to load items.';
    loading.value = false;
    return;
  }

  try {
    primaryPhotoByItem.value = await fetchPrimaryPhotos(items.value.map((i) => i.id));
  } catch {
    primaryPhotoByItem.value = {};
  }

  loading.value = false;
}

onMounted(load);

const selectedLocation = computed(() => {
  const raw = route.query.location;
  if (!raw || typeof raw !== 'string') return null;
  return raw === UNASSIGNED_PARAM ? UNASSIGNED : raw;
});

function binHref(key: string): string {
  const param = key === UNASSIGNED ? UNASSIGNED_PARAM : key;
  return `/storage?location=${encodeURIComponent(param)}`;
}

const bins = computed(() => {
  const groups = new Map<string, ItemRecord[]>();
  for (const it of items.value) {
    const key = it.storage_location ?? UNASSIGNED;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(it);
  }
  const named = Array.from(groups.keys()).filter((k) => k !== UNASSIGNED).sort();
  const keys = groups.has(UNASSIGNED) ? [...named, UNASSIGNED] : named;
  return keys.map((key) => {
    const binItems = groups.get(key)!;
    const sorted = [...binItems].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    const tags = Array.from(new Set(binItems.map((it) => CATEGORY_LABELS[it.category]?.toUpperCase() ?? it.category.toUpperCase())));
    return {
      key,
      label: key === UNASSIGNED ? 'Unassigned' : key,
      count: binItems.length,
      sample: sorted.slice(0, 3).map((it) => it.name),
      tags,
    };
  });
});

const selectedItems = computed(() => {
  if (!selectedLocation.value) return [];
  return items.value.filter((it) => (it.storage_location ?? UNASSIGNED) === selectedLocation.value);
});

const selectedLabel = computed(() => (selectedLocation.value === UNASSIGNED ? 'Unassigned' : selectedLocation.value));
</script>

<template>
  <main style="max-width: 1440px; margin: 0 auto; padding: 24px 28px 64px">
    <div v-if="loading" style="font: 500 12px 'JetBrains Mono', monospace; color: rgba(22,34,76,0.6)">Loading…</div>
    <p v-else-if="loadError" style="color: var(--color-rust)">{{ loadError }}</p>

    <div v-else-if="items.length === 0" style="border: 1px dashed rgba(22,34,76,0.4); padding: 48px; text-align: center; font: 500 12px 'JetBrains Mono', monospace; letter-spacing: 0.08em; color: rgba(22,34,76,0.6)">
      ADD YOUR FIRST ITEM TO SEE IT HERE
    </div>

    <template v-else-if="selectedLocation">
      <div style="border-bottom: 3px solid var(--color-navy); padding-bottom: 10px; margin-bottom: 18px">
        <NuxtLink to="/storage" style="font: 500 10px 'JetBrains Mono', monospace; letter-spacing: 0.1em; color: var(--color-rust); text-decoration: none">← BACK TO ALL BINS</NuxtLink>
        <h1 style="margin: 8px 0 0; font: 400 28px 'Archivo Black', sans-serif; letter-spacing: -0.01em; text-transform: uppercase">{{ selectedLabel }}</h1>
        <div style="font: 500 11px 'JetBrains Mono', monospace; letter-spacing: 0.08em; color: rgba(22,34,76,0.65); margin-top: 5px">{{ selectedItems.length }} ITEM{{ selectedItems.length === 1 ? '' : 'S' }}</div>
      </div>
      <div v-if="selectedItems.length === 0" style="border: 1px dashed rgba(22,34,76,0.4); padding: 48px; text-align: center; font: 500 12px 'JetBrains Mono', monospace; letter-spacing: 0.08em; color: rgba(22,34,76,0.6)">
        NO ITEMS IN THIS BIN
      </div>
      <div v-else style="display: grid; grid-template-columns: repeat(auto-fill, minmax(236px, 1fr)); gap: 16px">
        <ItemCard
          v-for="it in selectedItems"
          :key="it.id"
          :item="it"
          :photo-url="primaryPhotoByItem[it.id] ?? null"
          @click="navigateTo(`/items/${it.id}`)"
        />
      </div>
    </template>

    <template v-else>
      <div style="border-bottom: 3px solid var(--color-navy); padding-bottom: 10px; margin-bottom: 18px">
        <h1 style="margin: 0; font: 400 28px 'Archivo Black', sans-serif; letter-spacing: -0.01em; text-transform: uppercase">Where everything lives</h1>
        <div style="font: 500 11px 'JetBrains Mono', monospace; letter-spacing: 0.08em; color: rgba(22,34,76,0.65); margin-top: 5px">{{ bins.length }} BIN{{ bins.length === 1 ? '' : 'S' }}</div>
      </div>
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px">
        <div
          v-for="bin in bins"
          :key="bin.key"
          style="background: #fff; border: 1px solid var(--color-navy); cursor: pointer; display: flex; flex-direction: column"
          @click="navigateTo(binHref(bin.key))"
        >
          <div style="background: var(--color-paper); border-bottom: 1px solid var(--color-navy); padding: 9px 12px; display: flex; justify-content: space-between; align-items: baseline">
            <span style="font: 400 16px 'Archivo Black', sans-serif; letter-spacing: 0.02em; text-transform: uppercase">{{ bin.label }}</span>
            <span style="font: 700 10px 'JetBrains Mono', monospace; color: var(--color-rust)">{{ bin.count }}</span>
          </div>
          <div style="padding: 11px 12px; display: flex; flex-direction: column; gap: 9px; flex: 1">
            <div style="display: flex; flex-direction: column; gap: 3px">
              <div v-for="name in bin.sample" :key="name" style="font-size: 12px; color: rgba(22,34,76,0.9); white-space: nowrap; overflow: hidden; text-overflow: ellipsis">· {{ name }}</div>
            </div>
            <div style="margin-top: auto; display: flex; gap: 4px; flex-wrap: wrap">
              <span v-for="tag in bin.tags" :key="tag" style="background: var(--color-paper); border: 1px solid rgba(22,34,76,0.35); padding: 3px 6px; font: 500 9px 'JetBrains Mono', monospace; letter-spacing: 0.06em">{{ tag }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </main>
</template>
