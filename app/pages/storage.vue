<script setup lang="ts">
import type { ItemRecord } from '~/composables/useItems';

const { listItems } = useItems();
const { fetchPrimaryPhotos } = usePrimaryPhotos();

const UNASSIGNED = '__UNASSIGNED__';

const items = ref<ItemRecord[]>([]);
const loading = ref(true);
const loadError = ref('');
const primaryPhotoByItem = ref<Record<string, string>>({});
const selectedLocation = ref<string | null>(null);

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

  const locations = new Set(items.value.map((it) => it.storage_location ?? UNASSIGNED));
  const named = Array.from(locations).filter((l) => l !== UNASSIGNED).sort();
  selectedLocation.value = named.length > 0 ? named[0] : (locations.has(UNASSIGNED) ? UNASSIGNED : null);

  loading.value = false;
}

onMounted(load);

const locationOptions = computed(() => {
  const counts: Record<string, number> = {};
  for (const it of items.value) {
    const key = it.storage_location ?? UNASSIGNED;
    counts[key] = (counts[key] ?? 0) + 1;
  }
  const named = Object.keys(counts).filter((k) => k !== UNASSIGNED).sort();
  const result = named.map((k) => ({ value: k, label: k, count: counts[k] }));
  if (counts[UNASSIGNED]) result.push({ value: UNASSIGNED, label: 'UNASSIGNED', count: counts[UNASSIGNED] });
  return result;
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

    <div v-else style="display: flex; gap: 24px; align-items: flex-start">
      <aside style="width: 236px; flex: none; position: sticky; top: 86px">
        <div style="background: var(--color-navy); color: var(--color-paper); padding: 9px 12px; font: 400 11px 'Archivo Black', sans-serif; letter-spacing: 0.1em">LOCATIONS</div>
        <div style="background: #fff; border: 1px solid var(--color-navy); border-top: 0">
          <button
            v-for="opt in locationOptions"
            :key="opt.value"
            type="button"
            :style="{
              display: 'flex', justifyContent: 'space-between', width: '100%', textAlign: 'left', border: 0,
              borderBottom: '1px solid rgba(22,34,76,0.15)',
              background: selectedLocation === opt.value ? 'var(--color-navy)' : 'transparent',
              color: selectedLocation === opt.value ? 'var(--color-paper)' : (opt.value === '__UNASSIGNED__' ? 'rgba(22,34,76,0.55)' : 'var(--color-navy)'),
              cursor: 'pointer', padding: '9px 12px',
              font: `600 11px 'Archivo', sans-serif`, letterSpacing: '0.04em', textTransform: 'uppercase',
            }"
            @click="selectedLocation = opt.value"
          >
            <span>{{ opt.label }}</span>
            <span style="font: 400 10px 'JetBrains Mono', monospace; opacity: 0.7">{{ opt.count }}</span>
          </button>
        </div>
      </aside>

      <section style="flex: 1; min-width: 0">
        <div style="border-bottom: 3px solid var(--color-navy); padding-bottom: 10px; margin-bottom: 18px">
          <h1 style="margin: 0; font: 400 28px 'Archivo Black', sans-serif; letter-spacing: -0.01em; text-transform: uppercase">{{ selectedLabel }}</h1>
          <div style="font: 500 11px 'JetBrains Mono', monospace; letter-spacing: 0.08em; color: rgba(22,34,76,0.65); margin-top: 5px">{{ selectedItems.length }} ITEM{{ selectedItems.length === 1 ? '' : 'S' }}</div>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(236px, 1fr)); gap: 16px">
          <ItemCard
            v-for="it in selectedItems"
            :key="it.id"
            :item="it"
            :photo-url="primaryPhotoByItem[it.id] ?? null"
            @click="navigateTo(`/items/${it.id}`)"
          />
        </div>
      </section>
    </div>
  </main>
</template>
