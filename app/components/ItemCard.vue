<script setup lang="ts">
import { CATEGORY_LABELS } from '~/data/categoryFormFields';
import { CATEGORY_CARD_FIELDS } from '~/data/categoryCardFields';
import type { ItemRecord } from '~/composables/useItems';

const props = defineProps<{
  item: ItemRecord;
  photoUrl: string | null;
}>();

const { categoryDetail } = useItems();

const specs = computed(() => {
  const detail = categoryDetail(props.item);
  if (!detail) return [];
  const fields = CATEGORY_CARD_FIELDS[props.item.category] ?? [];
  return fields
    .map((f) => ({ k: f.label, v: detail[f.key] }))
    .filter((s) => s.v !== null && s.v !== undefined && s.v !== '');
});
</script>

<template>
  <div style="background: #fff; border: 1px solid var(--color-navy); cursor: pointer; display: flex; flex-direction: column">
    <div style="position: relative; height: 168px; border-bottom: 1px solid var(--color-navy); overflow: hidden; background: var(--color-paper)">
      <img v-if="photoUrl" :src="photoUrl" :alt="item.name" style="width: 100%; height: 100%; object-fit: cover; display: block" />
      <div v-else style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: repeating-linear-gradient(135deg, #EAE4D5 0 6px, var(--color-paper) 6px 12px)">
        <span style="font: 500 10px 'JetBrains Mono', monospace; letter-spacing: 0.1em; color: rgba(22,34,76,0.5); text-align: center; padding: 0 12px">NO PHOTO</span>
      </div>
      <span style="position: absolute; top: 0; left: 0; background: var(--color-orange); color: var(--color-navy); font: 700 9px 'JetBrains Mono', monospace; letter-spacing: 0.1em; padding: 5px 8px">{{ CATEGORY_LABELS[item.category]?.toUpperCase() }}</span>
    </div>
    <div style="padding: 12px 14px 13px; display: flex; flex-direction: column; gap: 9px; flex: 1">
      <div>
        <div style="font: 400 14px 'Archivo Black', sans-serif; line-height: 1.2; text-transform: uppercase">{{ item.name }}</div>
        <div style="font: 500 10px 'JetBrains Mono', monospace; letter-spacing: 0.08em; color: rgba(22,34,76,0.6); margin-top: 4px">{{ item.manufacturer_or_club }}</div>
      </div>
      <div style="display: flex; flex-direction: column; gap: 3px; flex: 1">
        <div v-for="sp in specs" :key="sp.k" style="display: flex; align-items: baseline; gap: 5px; font: 400 11px 'JetBrains Mono', monospace; color: rgba(22,34,76,0.75)">
          <span>{{ sp.k }}</span>
          <span style="flex: 1; border-bottom: 1px dotted rgba(22,34,76,0.4); transform: translateY(-3px)" />
          <span style="font-weight: 700; color: var(--color-navy)">{{ sp.v }}</span>
        </div>
      </div>
      <div style="border-top: 1px dashed rgba(22,34,76,0.3); padding-top: 9px; display: flex; align-items: center; justify-content: space-between">
        <span style="font: 500 10px 'JetBrains Mono', monospace; letter-spacing: 0.06em; color: var(--color-navy)">▪ {{ item.storage_location || '—' }}</span>
        <span v-if="item.approx_value_usd" style="font: 400 14px 'Archivo Black', sans-serif; color: var(--color-rust)">${{ Number(item.approx_value_usd).toFixed(0) }}</span>
      </div>
    </div>
  </div>
</template>
