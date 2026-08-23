<script setup lang="ts">
import { CATEGORY_LABELS } from '~/data/categoryFormFields';
import type { ItemRecord } from '~/composables/useItems';
import { formatDashboardAge, monthsSince, STALE_MONTHS } from '~/data/valueAge';
import { orderImpulseClasses } from '~/data/impulseLadder';

const { session, signOut } = useAuth();
const { listItems, categoryDetail } = useItems();
const { fetchPrimaryPhotos } = usePrimaryPhotos();

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

const recentlyAdded = computed(() => items.value.slice(0, 4));

const missingValueCount = computed(() => items.value.filter((it) => it.approx_value_usd === null).length);

const impulseBars = computed(() => {
  const motorItems = items.value.filter((it) => it.category === 'motor');
  const counts = new Map<string, number>();
  for (const it of motorItems) {
    const cls = String(categoryDetail(it)?.impulse_class ?? '').trim().toUpperCase();
    if (!cls) continue;
    counts.set(cls, (counts.get(cls) ?? 0) + Number(categoryDetail(it)?.quantity ?? 0));
  }
  const ordered = orderImpulseClasses([...counts.keys()]);
  const maxQty = Math.max(1, ...ordered.map((cls) => counts.get(cls) ?? 0));
  return ordered.map((cls) => {
    const qty = counts.get(cls) ?? 0;
    return {
      cls,
      qty,
      pct: `${Math.round((qty / maxQty) * 100)}%`,
      note: qty <= 4 ? 'LOW STOCK' : '',
    };
  });
});

const staleList = computed(() => {
  return items.value
    .filter((it) => it.value_estimated_at && monthsSince(it.value_estimated_at) >= STALE_MONTHS)
    .sort((a, b) => monthsSince(b.value_estimated_at!) - monthsSince(a.value_estimated_at!))
    .slice(0, 5)
    .map((it) => ({ id: it.id, name: it.name, date: it.value_estimated_at, age: formatDashboardAge(it.value_estimated_at!) }));
});
</script>

<template>
  <main style="max-width: 1440px; margin: 0 auto; padding: 24px 28px 64px">
    <div v-if="loading" style="font: 500 12px 'JetBrains Mono', monospace; color: rgba(22,34,76,0.6)">Loading…</div>
    <p v-else-if="loadError" style="color: var(--color-rust)">{{ loadError }}</p>

    <div v-else-if="totalItems === 0" style="border: 1px dashed rgba(22,34,76,0.4); padding: 48px; text-align: center; font: 500 12px 'JetBrains Mono', monospace; letter-spacing: 0.08em; color: rgba(22,34,76,0.6)">
      ADD YOUR FIRST ITEM TO SEE IT HERE
    </div>

    <template v-else>
      <div class="rt-dash-stats" style="background: var(--color-orange); border: 1px solid var(--color-navy); padding: 22px 26px; display: flex; align-items: stretch; gap: 0; margin-bottom: 18px">
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
      <div class="rt-dash-grid-6" style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 12px; margin-bottom: 14px">
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

      <div style="display: flex; align-items: center; gap: 12px; margin: 34px 0 14px">
        <h2 style="margin: 0; font: 400 14px 'Archivo Black', sans-serif; letter-spacing: 0.08em; text-transform: uppercase">Recently catalogued</h2>
        <div style="flex: 1; height: 3px; background: var(--color-navy)" />
      </div>
      <div class="rt-dash-grid-4" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px">
        <ItemCard
          v-for="it in recentlyAdded"
          :key="it.id"
          :item="it"
          :photo-url="primaryPhotoByItem[it.id] ?? null"
          @click="navigateTo(`/items/${it.id}`)"
        />
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

      <div class="rt-dash-two-col" style="display: grid; grid-template-columns: 1.1fr 1fr; gap: 20px; margin-top: 14px">
        <div style="background: #fff; border: 1px solid var(--color-navy); padding: 18px 20px">
          <h3 style="margin: 0 0 14px; font: 400 13px 'Archivo Black', sans-serif; letter-spacing: 0.08em; text-transform: uppercase">Motors by impulse class</h3>
          <div v-if="impulseBars.length === 0" style="font-size: 12.5px; color: rgba(22,34,76,0.5)">No motor items recorded yet.</div>
          <div v-else class="rt-impulse-chart-wrap" style="display: flex; flex-direction: column; gap: 7px">
            <div v-for="b in impulseBars" :key="b.cls" style="display: flex; align-items: center; gap: 10px">
              <span style="width: 36px; flex: none; font: 400 15px 'Archivo Black', sans-serif">{{ b.cls }}</span>
              <div class="rt-impulse-bar-track" style="flex: 1; height: 16px; background: var(--color-paper); border: 1px solid rgba(22,34,76,0.25)">
                <div :style="{ height: '100%', width: b.pct, background: 'var(--color-orange)' }" />
              </div>
              <span style="width: 34px; text-align: right; font: 700 11px 'JetBrains Mono', monospace">{{ b.qty }}</span>
              <span style="width: 78px; font: 400 10px 'JetBrains Mono', monospace; color: rgba(22,34,76,0.55)">{{ b.note }}</span>
            </div>
          </div>
        </div>
        <div style="background: #fff; border: 1px solid var(--color-navy); padding: 18px 20px">
          <h3 style="margin: 0 0 14px; font: 400 13px 'Archivo Black', sans-serif; letter-spacing: 0.08em; text-transform: uppercase">Estimates needing review</h3>
          <div v-if="staleList.length === 0" style="font-size: 12.5px; color: rgba(22,34,76,0.5)">Nothing is overdue for a review.</div>
          <div v-else style="display: flex; flex-direction: column">
            <div
              v-for="s in staleList"
              :key="s.id"
              style="display: flex; align-items: center; gap: 12px; padding: 9px 0; border-bottom: 1px dotted rgba(22,34,76,0.3); cursor: pointer"
              @click="navigateTo(`/items/${s.id}`)"
            >
              <span style="flex: 1; font: 600 12.5px 'Archivo', sans-serif; text-transform: uppercase; letter-spacing: 0.02em">{{ s.name }}</span>
              <span style="font: 400 10px 'JetBrains Mono', monospace; color: var(--color-rust)">{{ s.age }}</span>
              <span style="width: 78px; text-align: right; font: 400 10px 'JetBrains Mono', monospace; color: rgba(22,34,76,0.6)">{{ s.date }}</span>
            </div>
          </div>
        </div>
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

<style scoped>
@media (max-width: 768px) {
  /* This row was missed by the original responsiveness pass — three equal-flex tiles with
     22px horizontal padding each don't fit a 390px viewport and were clipping the third tile. */
  .rt-dash-stats {
    flex-direction: column !important;
    gap: 14px !important;
  }

  .rt-dash-grid-6,
  .rt-dash-grid-4 {
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)) !important;
  }

  .rt-dash-two-col {
    grid-template-columns: 1fr !important;
  }

  .rt-impulse-chart-wrap {
    overflow-x: auto;
  }

  .rt-impulse-bar-track {
    min-width: 60px;
  }
}
</style>
