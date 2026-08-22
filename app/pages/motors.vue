<script setup lang="ts">
import { orderImpulseClasses } from '~/data/impulseLadder';
import type { ItemRecord } from '~/composables/useItems';

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

const motorItems = computed(() => items.value.filter((it) => it.category === 'motor'));

interface MotorRow {
  id: string;
  designation: string;
  cls: string;
  dia: string;
  propellant: string;
  type: string;
  cert: string;
  qty: number;
  location: string;
}

const allRows = computed<MotorRow[]>(() => {
  return motorItems.value.map((it) => {
    const d = categoryDetail(it) ?? {};
    return {
      id: it.id,
      designation: d.designation || it.name,
      cls: String(d.impulse_class ?? '').trim().toUpperCase(),
      dia: d.diameter_mm != null ? `${d.diameter_mm}MM` : '—',
      propellant: d.propellant_type ?? '—',
      type: d.construction ?? '—',
      cert: d.certification_status ?? '—',
      qty: Number(d.quantity ?? 0),
      location: it.storage_location ?? '—',
    };
  });
});

const totalOnHand = computed(() => motorItems.value.reduce((sum, it) => sum + Number(categoryDetail(it)?.quantity ?? 0), 0));
const designationCount = computed(() => new Set(motorItems.value.map((it) => categoryDetail(it)?.designation).filter(Boolean)).size);

const availableClasses = computed(() => orderImpulseClasses([...new Set(allRows.value.map((r) => r.cls).filter(Boolean))]));

const classRank = computed(() => {
  const map = new Map<string, number>();
  availableClasses.value.forEach((cls, i) => map.set(cls, i));
  return map;
});

const classCounts = computed(() => {
  const counts = new Map<string, number>();
  for (const r of allRows.value) {
    if (!r.cls) continue;
    counts.set(r.cls, (counts.get(r.cls) ?? 0) + r.qty);
  }
  return counts;
});

const CERT_OPTIONS = ['Certified', 'Collectable', 'Out of Certification'];

const selectedClasses = ref<string[]>([]);
const selectedCerts = ref<string[]>([]);

function toggleClass(cls: string) {
  const i = selectedClasses.value.indexOf(cls);
  if (i === -1) selectedClasses.value.push(cls);
  else selectedClasses.value.splice(i, 1);
}

function toggleCert(cert: string) {
  const i = selectedCerts.value.indexOf(cert);
  if (i === -1) selectedCerts.value.push(cert);
  else selectedCerts.value.splice(i, 1);
}

const filteredRows = computed(() => {
  let rows = allRows.value;
  if (selectedClasses.value.length) rows = rows.filter((r) => selectedClasses.value.includes(r.cls));
  if (selectedCerts.value.length) rows = rows.filter((r) => selectedCerts.value.includes(r.cert));
  return [...rows].sort((a, b) => {
    const rankDiff = (classRank.value.get(a.cls) ?? 999) - (classRank.value.get(b.cls) ?? 999);
    if (rankDiff !== 0) return rankDiff;
    return a.designation.localeCompare(b.designation);
  });
});

const filteredCount = computed(() => filteredRows.value.length);
const filteredQty = computed(() => filteredRows.value.reduce((sum, r) => sum + r.qty, 0));
const maxRowQty = computed(() => Math.max(1, ...filteredRows.value.map((r) => r.qty)));

function certStyle(cert: string) {
  if (cert === 'Certified') return { bg: 'var(--color-navy)', fg: 'var(--color-paper)', border: 'var(--color-navy)' };
  if (cert === 'Collectable') return { bg: 'var(--color-orange)', fg: 'var(--color-navy)', border: 'var(--color-navy)' };
  return { bg: 'transparent', fg: 'rgba(22,34,76,0.75)', border: 'rgba(22,34,76,0.3)' };
}
</script>

<template>
  <main style="max-width: 1440px; margin: 0 auto; padding: 24px 28px 64px">
    <div v-if="loading" style="font: 500 12px 'JetBrains Mono', monospace; color: rgba(22,34,76,0.6)">Loading…</div>
    <p v-else-if="loadError" style="color: var(--color-rust)">{{ loadError }}</p>

    <div v-else-if="motorItems.length === 0" style="border: 1px dashed rgba(22,34,76,0.4); padding: 48px; text-align: center; font: 500 12px 'JetBrains Mono', monospace; letter-spacing: 0.08em; color: rgba(22,34,76,0.6)">
      NO ROCKET MOTORS RECORDED YET
    </div>

    <div v-else style="display: flex; gap: 24px; align-items: flex-start">
      <aside style="width: 250px; flex: none">
        <div style="background: var(--color-navy); color: var(--color-paper); padding: 9px 12px; font: 400 11px 'Archivo Black', sans-serif; letter-spacing: 0.1em">IMPULSE LADDER</div>
        <div style="background: #fff; border: 1px solid var(--color-navy); border-top: 0; padding: 12px">
          <button
            v-for="cls in availableClasses"
            :key="cls"
            type="button"
            :style="{
              width: '100%', textAlign: 'left', cursor: 'pointer', padding: '8px 10px', marginBottom: '5px',
              display: 'flex', alignItems: 'center', gap: '10px',
              border: `1px solid ${selectedClasses.includes(cls) ? 'var(--color-navy)' : 'rgba(22,34,76,0.3)'}`,
              background: selectedClasses.includes(cls) ? 'var(--color-navy)' : 'transparent',
              color: selectedClasses.includes(cls) ? 'var(--color-paper)' : 'var(--color-navy)',
            }"
            @click="toggleClass(cls)"
          >
            <span style="font: 400 16px 'Archivo Black', sans-serif; width: 38px; flex: none">{{ cls }}</span>
            <span style="flex: 1; font: 400 10px 'JetBrains Mono', monospace; letter-spacing: 0.04em; opacity: 0.8">{{ classCounts.get(cls) ?? 0 }} ON HAND</span>
          </button>
        </div>
        <div style="background: var(--color-orange); border: 1px solid var(--color-navy); border-top: 0; padding: 14px 12px">
          <div style="font: 500 10px 'JetBrains Mono', monospace; letter-spacing: 0.12em; color: rgba(22,34,76,0.75)">TOTAL ON HAND</div>
          <div style="font: 400 34px 'Archivo Black', sans-serif; line-height: 1.1">{{ totalOnHand }}</div>
          <div style="font: 400 10.5px 'JetBrains Mono', monospace; color: rgba(22,34,76,0.8)">ACROSS {{ designationCount }} DESIGNATIONS</div>
        </div>
      </aside>

      <section style="flex: 1; min-width: 0">
        <div style="display: flex; align-items: flex-end; justify-content: space-between; border-bottom: 3px solid var(--color-navy); padding-bottom: 10px; margin-bottom: 16px">
          <div>
            <h1 style="margin: 0; font: 400 28px 'Archivo Black', sans-serif; text-transform: uppercase">Rocket motors</h1>
            <div style="font: 500 11px 'JetBrains Mono', monospace; letter-spacing: 0.08em; color: rgba(22,34,76,0.65); margin-top: 5px">{{ filteredCount }} ITEM{{ filteredCount === 1 ? '' : 'S' }} SHOWN · {{ filteredQty }} ON HAND</div>
          </div>
          <div style="display: flex; gap: 6px">
            <button
              v-for="cert in CERT_OPTIONS"
              :key="cert"
              type="button"
              :style="{
                border: `1px solid ${selectedCerts.includes(cert) ? 'var(--color-navy)' : 'rgba(22,34,76,0.3)'}`,
                background: selectedCerts.includes(cert) ? 'var(--color-navy)' : 'transparent',
                color: selectedCerts.includes(cert) ? 'var(--color-paper)' : 'var(--color-navy)',
                cursor: 'pointer', padding: '7px 11px', font: `500 10px 'JetBrains Mono', monospace`, letterSpacing: '0.08em',
              }"
              @click="toggleCert(cert)"
            >
              {{ cert.toUpperCase() }}
            </button>
          </div>
        </div>

        <div v-if="filteredRows.length === 0" style="border: 1px dashed rgba(22,34,76,0.4); padding: 48px; text-align: center; font: 500 12px 'JetBrains Mono', monospace; letter-spacing: 0.08em; color: rgba(22,34,76,0.6)">
          NO MOTORS MATCH THESE FILTERS
        </div>

        <div v-else style="background: #fff; border: 1px solid var(--color-navy); overflow-x: auto">
          <div style="min-width: 880px; display: grid; grid-template-columns: 1.3fr 0.5fr 0.6fr 0.9fr 1fr 1.2fr 0.9fr 1.1fr; background: var(--color-navy); color: var(--color-paper); font: 500 9.5px 'JetBrains Mono', monospace; letter-spacing: 0.1em">
            <div style="padding: 9px 12px">DESIGNATION</div>
            <div style="padding: 9px 6px">CLASS</div>
            <div style="padding: 9px 6px">DIA</div>
            <div style="padding: 9px 6px">PROPELLANT</div>
            <div style="padding: 9px 6px">TYPE</div>
            <div style="padding: 9px 6px">STATUS</div>
            <div style="padding: 9px 6px; text-align: right">QTY</div>
            <div style="padding: 9px 12px">LOCATION</div>
          </div>
          <div
            v-for="(r, i) in filteredRows"
            :key="r.id"
            :style="{
              minWidth: '880px', whiteSpace: 'nowrap', display: 'grid',
              gridTemplateColumns: '1.3fr 0.5fr 0.6fr 0.9fr 1fr 1.2fr 0.9fr 1.1fr',
              alignItems: 'center', borderBottom: '1px dotted rgba(22,34,76,0.28)', cursor: 'pointer',
              background: i % 2 ? 'var(--color-paper)' : '#fff',
            }"
            @click="navigateTo(`/items/${r.id}`)"
          >
            <div style="padding: 9px 12px; font: 400 14px 'Archivo Black', sans-serif; letter-spacing: 0.01em">{{ r.designation }}</div>
            <div style="padding: 9px 6px; font: 700 12px 'JetBrains Mono', monospace">{{ r.cls || '—' }}</div>
            <div style="padding: 9px 6px; font: 400 11.5px 'JetBrains Mono', monospace">{{ r.dia }}</div>
            <div style="padding: 9px 6px; font: 400 11.5px 'JetBrains Mono', monospace; color: rgba(22,34,76,0.8)">{{ r.propellant }}</div>
            <div style="padding: 9px 6px; font: 400 11.5px 'JetBrains Mono', monospace; color: rgba(22,34,76,0.8)">{{ r.type }}</div>
            <div style="padding: 9px 6px">
              <span :style="{ display: 'inline-block', background: certStyle(r.cert).bg, color: certStyle(r.cert).fg, border: `1px solid ${certStyle(r.cert).border}`, padding: '3px 7px', font: `700 9px 'JetBrains Mono', monospace`, letterSpacing: '0.08em' }">{{ r.cert.toUpperCase() }}</span>
            </div>
            <div style="padding: 9px 6px; display: flex; align-items: center; gap: 7px; justify-content: flex-end">
              <div style="width: 38px; height: 9px; background: var(--color-paper); border: 1px solid rgba(22,34,76,0.3)">
                <div :style="{ height: '100%', width: `${Math.round((r.qty / maxRowQty) * 100)}%`, background: 'var(--color-orange)' }" />
              </div>
              <span style="font: 700 12px 'JetBrains Mono', monospace; width: 20px; text-align: right">{{ r.qty }}</span>
            </div>
            <div style="padding: 9px 12px; font: 500 10.5px 'JetBrains Mono', monospace; letter-spacing: 0.04em">▪ {{ r.location }}</div>
          </div>
          <div style="min-width: 880px; display: flex; justify-content: space-between; padding: 11px 12px; background: var(--color-paper); font: 700 10.5px 'JetBrains Mono', monospace; letter-spacing: 0.08em">
            <span>{{ filteredCount }} ROWS</span>
            <span>TOTAL QTY {{ filteredQty }}</span>
          </div>
        </div>
      </section>
    </div>
  </main>
</template>
