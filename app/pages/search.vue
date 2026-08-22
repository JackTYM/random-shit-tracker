<script setup lang="ts">
import { CATEGORY_LABELS } from '~/data/categoryFormFields';
import type { SearchResultDetailed } from '~/composables/useSearchItems';

const route = useRoute();
const { searchItemsDetailed } = useSearchItems();
const { fetchPrimaryPhotos } = usePrimaryPhotos();

const query = computed(() => {
  const raw = route.query.q;
  return typeof raw === 'string' ? raw.trim() : '';
});

const results = ref<SearchResultDetailed[]>([]);
const loading = ref(!!route.query.q);
const loadError = ref('');
const primaryPhotoByItem = ref<Record<string, string>>({});

async function runSearch(q: string) {
  if (import.meta.server) return;

  if (!q) {
    results.value = [];
    primaryPhotoByItem.value = {};
    loadError.value = '';
    loading.value = false;
    await nextTick();
    document.getElementById('header-search-input')?.focus();
    return;
  }

  loading.value = true;
  loadError.value = '';
  let found: SearchResultDetailed[];
  try {
    found = await searchItemsDetailed(q);
  } catch (e: any) {
    if (q !== query.value) return;
    loadError.value = e?.message ?? 'Search failed.';
    loading.value = false;
    return;
  }
  if (q !== query.value) return;
  results.value = found;

  try {
    const photos = await fetchPrimaryPhotos(found.map((r) => r.id));
    if (q === query.value) primaryPhotoByItem.value = photos;
  } catch {
    if (q === query.value) primaryPhotoByItem.value = {};
  }
  if (q === query.value) loading.value = false;
}

watch(query, (q) => runSearch(q), { immediate: true });

const groupOrder = Object.keys(CATEGORY_LABELS);

const groups = computed(() => {
  return groupOrder
    .map((cat) => ({
      cat,
      label: CATEGORY_LABELS[cat],
      rows: results.value.filter((r) => r.category === cat),
    }))
    .filter((g) => g.rows.length > 0);
});

function metaLine(r: SearchResultDetailed): string {
  const parts = [r.manufacturer_or_club, r.reference_code, r.value_estimated_at ? `EST. ${r.value_estimated_at}` : null].filter(Boolean);
  return parts.join(' · ');
}
</script>

<template>
  <main style="max-width: 1100px; margin: 0 auto; padding: 24px 28px 64px">
    <div style="border-bottom: 3px solid var(--color-navy); padding-bottom: 10px; margin-bottom: 18px">
      <h1 style="margin: 0; font: 400 28px 'Archivo Black', sans-serif; letter-spacing: -0.01em; text-transform: uppercase">Search results</h1>
      <div v-if="query" style="font: 500 11px 'JetBrains Mono', monospace; letter-spacing: 0.08em; color: rgba(22,34,76,0.65); margin-top: 5px">
        {{ results.length }} RESULT{{ results.length === 1 ? '' : 'S' }} FOR "{{ query.toUpperCase() }}"
      </div>
    </div>

    <div v-if="!query" style="border: 1px dashed rgba(22,34,76,0.4); padding: 48px; text-align: center; font: 500 12px 'JetBrains Mono', monospace; letter-spacing: 0.08em; color: rgba(22,34,76,0.6)">
      SEARCH YOUR COLLECTION USING THE BOX ABOVE
    </div>

    <div v-else-if="loading" style="font: 500 12px 'JetBrains Mono', monospace; color: rgba(22,34,76,0.6)">Loading…</div>
    <p v-else-if="loadError" style="color: var(--color-rust)">{{ loadError }}</p>

    <div v-else-if="results.length === 0" style="border: 1px dashed rgba(22,34,76,0.4); padding: 48px; text-align: center; font: 500 12px 'JetBrains Mono', monospace; letter-spacing: 0.08em; color: rgba(22,34,76,0.6)">
      NO RESULTS FOR "{{ query.toUpperCase() }}"
    </div>

    <template v-else>
      <div v-for="g in groups" :key="g.cat" style="margin-bottom: 26px">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px">
          <span style="background: var(--color-orange); color: var(--color-navy); font: 700 9px 'JetBrains Mono', monospace; letter-spacing: 0.12em; padding: 5px 8px">{{ g.label.toUpperCase() }}</span>
          <div style="flex: 1; height: 1px; background: rgba(22,34,76,0.3)" />
          <span style="font: 500 10px 'JetBrains Mono', monospace; color: rgba(22,34,76,0.6)">{{ g.rows.length }} {{ g.rows.length === 1 ? 'RESULT' : 'RESULTS' }}</span>
        </div>
        <div style="background: #fff; border: 1px solid var(--color-navy)">
          <div
            v-for="r in g.rows"
            :key="r.id"
            style="display: flex; align-items: center; gap: 14px; padding: 11px 14px; border-bottom: 1px dotted rgba(22,34,76,0.3); cursor: pointer"
            @click="navigateTo(`/items/${r.id}`)"
          >
            <img v-if="primaryPhotoByItem[r.id]" :src="primaryPhotoByItem[r.id]" :alt="r.name" style="width: 46px; height: 46px; flex: none; object-fit: cover; border: 1px solid rgba(22,34,76,0.45)" />
            <div v-else style="width: 46px; height: 46px; flex: none; border: 1px solid rgba(22,34,76,0.45); background: repeating-linear-gradient(135deg, #EAE4D5 0 5px, var(--color-paper) 5px 10px)" />
            <div style="flex: 1; min-width: 0">
              <div style="font: 400 14px 'Archivo Black', sans-serif; text-transform: uppercase">{{ r.name }}</div>
              <div v-if="metaLine(r)" style="font: 400 10.5px 'JetBrains Mono', monospace; color: rgba(22,34,76,0.65); margin-top: 3px">{{ metaLine(r) }}</div>
            </div>
            <span style="font: 500 10.5px 'JetBrains Mono', monospace; letter-spacing: 0.06em; color: var(--color-navy)">▪ {{ r.storage_location || '—' }}</span>
            <span v-if="r.approx_value_usd" style="width: 70px; text-align: right; font: 400 15px 'Archivo Black', sans-serif; color: var(--color-rust)">${{ Number(r.approx_value_usd).toFixed(2) }}</span>
          </div>
        </div>
      </div>
    </template>
  </main>
</template>
