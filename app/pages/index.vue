<script setup lang="ts">
import { CATEGORY_LABELS } from '~/data/categoryFormFields';
import type { ItemRecord } from '~/composables/useItems';

const { session, signOut } = useAuth();
const { listItems, categoryDetail } = useItems();

const items = ref<ItemRecord[]>([]);
const loading = ref(true);
const loadError = ref('');

async function load() {
  loading.value = true;
  loadError.value = '';
  try {
    items.value = await listItems();
  } catch (e: any) {
    loadError.value = e?.message ?? 'Failed to load items.';
  } finally {
    loading.value = false;
  }
}

onMounted(load);

async function handleSignOut() {
  await signOut();
  await navigateTo('/login');
}

const totalItems = computed(() => items.value.length);
const totalValue = computed(() => items.value.reduce((sum, it) => sum + Number(it.approx_value_usd ?? 0), 0));

const CATEGORY_CODES: Record<string, string> = {
  motor: 'CAT-01',
  kit: 'CAT-02',
  plane: 'CAT-03',
  part: 'CAT-04',
  print: 'CAT-05',
  other: 'CAT-06',
};

const categoryBreakdown = computed(() => {
  const counts: Record<string, number> = {};
  for (const it of items.value) counts[it.category] = (counts[it.category] ?? 0) + 1;
  return Object.keys(CATEGORY_LABELS).map((cat) => ({
    value: cat,
    label: CATEGORY_LABELS[cat],
    code: CATEGORY_CODES[cat],
    count: counts[cat] ?? 0,
  }));
});

const stats = computed(() => {
  const categoriesWithItems = categoryBreakdown.value.filter((c) => c.count > 0).length;
  const motorItems = items.value.filter((it) => it.category === 'motor');
  const motorsOnHandCount = motorItems.reduce((sum, it) => sum + Number(categoryDetail(it)?.quantity ?? 0), 0);
  const motorDesignations = new Set(motorItems.map((it) => categoryDetail(it)?.designation).filter(Boolean));
  return [
    { label: 'Items catalogued', value: String(totalItems.value), sub: `${categoriesWithItems} CATEGORIES` },
    { label: 'Est. total value', value: `$${totalValue.value.toFixed(0)}`, sub: 'SUM OF APPROX. VALUES' },
    { label: 'Motors on hand', value: String(motorsOnHandCount), sub: `${motorDesignations.size} DESIGNATIONS` },
  ];
});

const recentlyAdded = computed(() => items.value.slice(0, 5));

const missingValueCount = computed(() => items.value.filter((it) => it.approx_value_usd === null).length);
</script>

<template>
  <main style="max-width: 1440px; margin: 0 auto; padding: 24px 28px 64px">
    <div v-if="loading" style="font: 500 12px 'JetBrains Mono', monospace; color: rgba(22,34,76,0.6)">Loading…</div>
    <p v-else-if="loadError" style="color: var(--color-rust)">{{ loadError }}</p>

    <div v-else-if="totalItems === 0" style="border: 1px dashed rgba(22,34,76,0.4); padding: 48px; text-align: center; font: 500 12px 'JetBrains Mono', monospace; letter-spacing: 0.08em; color: rgba(22,34,76,0.6)">
      ADD YOUR FIRST ITEM TO SEE IT HERE
    </div>

    <template v-else>
      <div style="background: var(--color-orange); border: 1px solid var(--color-navy); padding: 22px 26px; display: flex; align-items: stretch; gap: 0; margin-bottom: 18px">
        <div
          v-for="(s, i) in stats"
          :key="s.label"
          :style="{ flex: '1', padding: '0 22px', borderLeft: i === 0 ? '0' : '1px dashed rgba(22,34,76,0.5)' }"
        >
          <div style="font: 500 10px 'JetBrains Mono', monospace; letter-spacing: 0.12em; color: rgba(22,34,76,0.7); text-transform: uppercase">{{ s.label }}</div>
          <div style="font: 400 40px 'Archivo Black', sans-serif; line-height: 1.1; margin-top: 6px; color: var(--color-navy)">{{ s.value }}</div>
          <div style="font: 500 11px 'JetBrains Mono', monospace; color: rgba(22,34,76,0.65); margin-top: 2px">{{ s.sub }}</div>
        </div>
      </div>

      <div style="display: flex; align-items: center; gap: 12px; margin: 34px 0 14px">
        <h2 style="margin: 0; font: 400 14px 'Archivo Black', sans-serif; letter-spacing: 0.08em; text-transform: uppercase">Collection by category</h2>
        <div style="flex: 1; height: 3px; background: var(--color-navy)" />
      </div>
      <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 12px; margin-bottom: 14px">
        <div
          v-for="c in categoryBreakdown"
          :key="c.value"
          style="background: #fff; border: 1px solid var(--color-navy); padding: 14px; cursor: pointer; display: flex; flex-direction: column; gap: 10px; min-height: 118px"
          @click="navigateTo(`/browse?category=${c.value}`)"
        >
          <div style="font: 500 10px 'JetBrains Mono', monospace; letter-spacing: 0.1em; color: var(--color-rust)">{{ c.code }}</div>
          <div style="font: 600 13px 'Archivo', sans-serif; line-height: 1.25; text-transform: uppercase; letter-spacing: 0.03em; flex: 1">{{ c.label }}</div>
          <span style="font: 400 26px 'Archivo Black', sans-serif; line-height: 1">{{ c.count }}</span>
        </div>
      </div>

      <div style="background: #fff; border: 1px solid var(--color-navy); padding: 16px">
        <div style="font: 500 10px 'JetBrains Mono', monospace; letter-spacing: 0.1em; color: rgba(22,34,76,0.6); margin-bottom: 10px; border-bottom: 1px dashed rgba(22,34,76,0.3); padding-bottom: 8px">RECENTLY ADDED</div>
        <button
          v-for="it in recentlyAdded"
          :key="it.id"
          type="button"
          style="display: block; width: 100%; border: 0; background: transparent; cursor: pointer; padding: 6px 0; font: 400 13px 'JetBrains Mono', monospace; color: var(--color-navy); text-align: left"
          @click="navigateTo(`/items/${it.id}`)"
        >
          {{ it.name }}
        </button>
      </div>

      <div v-if="missingValueCount > 0" style="background: #fff; border: 1px dashed var(--color-navy); padding: 14px; font: 400 13px 'JetBrains Mono', monospace; display: flex; justify-content: space-between; align-items: center; margin-top: 14px">
        <span><span style="color: rgba(22,34,76,0.6)">MISSING A VALUE ESTIMATE:</span> {{ missingValueCount }} item{{ missingValueCount === 1 ? '' : 's' }}</span>
        <button
          type="button"
          style="border: 0; background: transparent; cursor: pointer; color: var(--color-rust); text-decoration: underline; font: 400 13px 'JetBrains Mono', monospace"
          @click="navigateTo('/browse?missingValue=true')"
        >
          view them
        </button>
      </div>
    </template>

    <div style="margin-top: 32px; display: flex; align-items: center; gap: 12px">
      <span style="font: 500 11px 'JetBrains Mono', monospace; letter-spacing: 0.08em; color: rgba(22,34,76,0.65)">Signed in as {{ session?.user?.email }}</span>
      <button
        type="button"
        style="border: 1px solid var(--color-navy); background: transparent; cursor: pointer; padding: 8px 12px; font: 600 11px 'Archivo', sans-serif; letter-spacing: 0.06em"
        @click="handleSignOut"
      >
        Sign out
      </button>
    </div>
  </main>
</template>
