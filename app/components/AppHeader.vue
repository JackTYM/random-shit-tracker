<script setup lang="ts">
import { CATEGORY_LABELS } from '~/data/categoryFormFields';
import type { HeaderSearchResult } from '~/composables/useSearchItems';

const { session, signOut } = useAuth();
const { searchItems } = useSearchItems();

const navItems = [
  { label: 'Dashboard', to: '/' },
  { label: 'Browse', to: '/browse' },
  { label: 'Rocket Motors', to: '/browse?category=motor' },
  { label: 'Model Airplanes', to: '/browse?category=plane' },
  { label: 'Rocket Kits', to: '/browse?category=kit' },
  { label: 'Rocket Parts', to: '/browse?category=part' },
  { label: 'Books & Printed', to: '/browse?category=print' },
  { label: 'Other Collectables', to: '/browse?category=other' },
  { label: 'Storage', to: '/storage' },
];

async function handleSignOut() {
  await signOut();
  await navigateTo('/login');
}

const searchQuery = ref('');
const searchResults = ref<HeaderSearchResult[]>([]);
const searchOpen = ref(false);
let searchDebounce: ReturnType<typeof setTimeout> | null = null;

watch(searchQuery, (q) => {
  if (searchDebounce) clearTimeout(searchDebounce);
  if (!q.trim()) {
    searchResults.value = [];
    searchOpen.value = false;
    return;
  }
  searchDebounce = setTimeout(async () => {
    const results = await searchItems(q);
    if (q === searchQuery.value) {
      searchResults.value = results;
      searchOpen.value = true;
    }
  }, 250);
});

function selectResult(id: string) {
  searchOpen.value = false;
  searchQuery.value = '';
  searchResults.value = [];
  navigateTo(`/items/${id}`);
}

function closeSearch() {
  searchOpen.value = false;
}
</script>

<template>
  <header style="position: sticky; top: 0; z-index: 20; background: var(--color-navy); border-bottom: 4px solid var(--color-orange)">
    <div style="max-width: 1440px; margin: 0 auto; padding: 0 28px; height: 62px; display: flex; align-items: center; gap: 28px">
      <div style="display: flex; align-items: baseline; gap: 6px; flex: none">
        <span style="font: 400 19px 'Archivo Black', sans-serif; letter-spacing: -0.01em; color: var(--color-paper)">
          RANDOM<span style="color: var(--color-orange)">SHIT</span>TRACKER
        </span>
        <span style="font: 500 10px 'JetBrains Mono', monospace; color: rgba(245,241,232,0.45)">.COM</span>
      </div>

      <nav style="display: flex; gap: 2px; flex: 1">
        <NuxtLink
          v-for="n in navItems"
          :key="n.label"
          :to="n.to"
          style="border: 0; cursor: pointer; padding: 7px 11px; font: 600 11px 'Archivo', sans-serif; letter-spacing: 0.09em; text-transform: uppercase; background: transparent; color: var(--color-paper); text-decoration: none"
        >
          {{ n.label }}
        </NuxtLink>
      </nav>

      <div style="display: flex; align-items: center; gap: 10px; flex: none">
        <div style="position: relative">
          <input
            v-model="searchQuery"
            placeholder="Search the collection…"
            style="width: 230px; padding: 8px 11px; border: 1px solid rgba(245,241,232,0.3); background: rgba(245,241,232,0.08); color: var(--color-paper); font-size: 13px"
            @focus="searchResults.length > 0 && (searchOpen = true)"
            @blur="setTimeout(closeSearch, 150)"
            @keydown.escape="closeSearch"
          />
          <div
            v-if="searchOpen"
            style="position: absolute; top: 100%; left: 0; width: 280px; margin-top: 4px; background: #fff; border: 1px solid var(--color-navy); z-index: 30; max-height: 260px; overflow-y: auto"
          >
            <div v-if="searchResults.length === 0" style="padding: 10px 12px; font-size: 12.5px; color: rgba(22,34,76,0.5)">No matches</div>
            <button
              v-for="r in searchResults"
              :key="r.id"
              type="button"
              style="display: block; width: 100%; text-align: left; border: 0; border-bottom: 1px solid rgba(22,34,76,0.1); background: transparent; cursor: pointer; padding: 9px 12px; font-size: 13px; color: var(--color-navy)"
              @click="selectResult(r.id)"
            >
              {{ r.name }} <span style="opacity: 0.6; font-size: 11px">({{ CATEGORY_LABELS[r.category] }})</span>
            </button>
          </div>
        </div>
        <NuxtLink
          to="/items/new"
          style="border: 0; cursor: pointer; background: var(--color-orange); color: var(--color-navy); padding: 9px 14px; font: 400 12px 'Archivo Black', sans-serif; letter-spacing: 0.06em; white-space: nowrap; flex: none; text-decoration: none"
        >
          + ADD ITEM
        </NuxtLink>
        <span style="font: 500 10px 'JetBrains Mono', monospace; color: rgba(245,241,232,0.6)">{{ session?.user?.email }}</span>
        <button
          type="button"
          style="border: 1px solid rgba(245,241,232,0.4); background: transparent; cursor: pointer; padding: 7px 10px; font: 600 10px 'Archivo', sans-serif; letter-spacing: 0.06em; color: var(--color-paper)"
          @click="handleSignOut"
        >
          Sign out
        </button>
      </div>
    </div>
  </header>
</template>
