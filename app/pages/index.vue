<script setup lang="ts">
import { CATEGORY_LABELS } from '~/data/categoryFormFields';
import type { ItemRecord } from '~/composables/useItems';

const { session, signOut } = useAuth();
const { listItems } = useItems();

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

const categoryBreakdown = computed(() => {
  const counts: Record<string, number> = {};
  for (const it of items.value) counts[it.category] = (counts[it.category] ?? 0) + 1;
  return Object.keys(CATEGORY_LABELS)
    .map((cat) => ({ value: cat, label: CATEGORY_LABELS[cat], count: counts[cat] ?? 0 }))
    .filter((o) => o.count > 0);
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
      <div style="display: flex; gap: 14px; margin-bottom: 18px">
        <div style="flex: 1; background: #fff; border: 1px solid var(--color-navy); padding: 16px; text-align: center">
          <div style="font: 500 10px 'JetBrains Mono', monospace; letter-spacing: 0.1em; color: rgba(22,34,76,0.6)">TOTAL ITEMS</div>
          <div style="font: 400 32px 'Archivo Black', sans-serif; margin-top: 6px">{{ totalItems }}</div>
        </div>
        <div style="flex: 1; background: var(--color-orange); border: 1px solid var(--color-navy); padding: 16px; text-align: center">
          <div style="font: 500 10px 'JetBrains Mono', monospace; letter-spacing: 0.1em; color: rgba(22,34,76,0.75)">ESTIMATED VALUE</div>
          <div style="font: 400 32px 'Archivo Black', sans-serif; margin-top: 6px">${{ totalValue.toFixed(0) }}</div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px">
        <div style="background: #fff; border: 1px solid var(--color-navy); padding: 16px">
          <div style="font: 500 10px 'JetBrains Mono', monospace; letter-spacing: 0.1em; color: rgba(22,34,76,0.6); margin-bottom: 10px; border-bottom: 1px dashed rgba(22,34,76,0.3); padding-bottom: 8px">ITEMS BY CATEGORY</div>
          <button
            v-for="c in categoryBreakdown"
            :key="c.value"
            type="button"
            style="display: flex; justify-content: space-between; width: 100%; border: 0; background: transparent; cursor: pointer; padding: 6px 0; font: 400 13px 'JetBrains Mono', monospace; color: var(--color-navy); text-align: left"
            @click="navigateTo(`/browse?category=${c.value}`)"
          >
            <span>{{ c.label }}</span>
            <span style="font-weight: 700">{{ c.count }}</span>
          </button>
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
      </div>

      <div v-if="missingValueCount > 0" style="background: #fff; border: 1px dashed var(--color-navy); padding: 14px; font: 400 13px 'JetBrains Mono', monospace; display: flex; justify-content: space-between; align-items: center">
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
