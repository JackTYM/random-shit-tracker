<script setup lang="ts">
import { CATEGORY_FORM_FIELDS } from '~/data/categoryFormFields';

const props = defineProps<{
  category: string;
  values: Record<string, string>;
  otherValues: Record<string, string>;
}>();

const emit = defineEmits<{
  'update:values': [Record<string, string>];
  'update:otherValues': [Record<string, string>];
}>();

const currentFields = computed(() => {
  const fields = CATEGORY_FORM_FIELDS[props.category] ?? [];
  return fields.filter((f) => !f.showWhen || props.values[f.showWhen.field] === f.showWhen.equals);
});

function setValue(key: string, value: string) {
  emit('update:values', { ...props.values, [key]: value });
}

function setOtherValue(key: string, value: string) {
  emit('update:otherValues', { ...props.otherValues, [key]: value });
}
</script>

<template>
  <div class="rt-additem-grid" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px">
    <div v-for="field in currentFields" :key="field.key" style="display: flex; flex-direction: column; gap: 5px">
      <label style="font: 500 9.5px 'JetBrains Mono', monospace; letter-spacing: 0.12em; color: rgba(22,34,76,0.65)">{{ field.label.toUpperCase() }}</label>
      <select
        v-if="field.type === 'select'"
        :value="values[field.key] ?? ''"
        style="padding: 9px 11px; border: 1px solid var(--color-navy); background: var(--color-paper); font-size: 13.5px; color: var(--color-navy)"
        @change="setValue(field.key, ($event.target as HTMLSelectElement).value)"
      >
        <option value="" disabled>Select…</option>
        <option v-for="opt in field.options" :key="opt" :value="opt">{{ opt }}</option>
      </select>
      <input
        v-else-if="field.type === 'number'"
        :value="values[field.key] ?? ''"
        type="number"
        step="any"
        style="padding: 9px 11px; border: 1px solid var(--color-navy); background: var(--color-paper); font-size: 13.5px; color: var(--color-navy)"
        @input="setValue(field.key, ($event.target as HTMLInputElement).value)"
      />
      <textarea
        v-else-if="field.type === 'textarea'"
        :value="values[field.key] ?? ''"
        rows="3"
        style="padding: 9px 11px; border: 1px solid var(--color-navy); background: var(--color-paper); font-size: 13.5px; color: var(--color-navy); resize: vertical"
        @input="setValue(field.key, ($event.target as HTMLTextAreaElement).value)"
      />
      <input
        v-else
        :value="values[field.key] ?? ''"
        type="text"
        style="padding: 9px 11px; border: 1px solid var(--color-navy); background: var(--color-paper); font-size: 13.5px; color: var(--color-navy)"
        @input="setValue(field.key, ($event.target as HTMLInputElement).value)"
      />
      <input
        v-if="field.otherKey && values[field.key] === 'Other'"
        :value="otherValues[field.otherKey] ?? ''"
        type="text"
        placeholder="Specify…"
        style="padding: 9px 11px; border: 1px dashed rgba(22,34,76,0.5); background: var(--color-paper); font-size: 13.5px; color: var(--color-navy)"
        @input="setOtherValue(field.otherKey!, ($event.target as HTMLInputElement).value)"
      />
    </div>
  </div>
</template>

<style scoped>
@media (max-width: 768px) {
  .rt-additem-grid {
    grid-template-columns: 1fr !important;
  }
}
</style>
