<script setup lang="ts">
import { CATEGORY_LABELS } from '~/data/categoryFormFields';
import type { HeaderSearchResult } from '~/composables/useSearchItems';

const { session, signOut } = useAuth();
const { searchItems } = useSearchItems();
const route = useRoute();

const BROWSE_FAMILY = ['browse', 'motors', 'storage', 'search'];

function isDetailRoute(path: string): boolean {
  return path !== '/items/new' && /^\/items\/[^/]+$/.test(path);
}

function currentScreen(): string {
  const path = route.path;
  if (path === '/') return 'dash';
  if (path === '/browse') return route.query.category === 'motor' ? 'motors' : 'browse';
  if (path === '/storage') return 'storage';
  if (path === '/search') return 'search';
  if (isDetailRoute(path)) return 'detail';
  return '';
}

const primaryNavItems = computed(() => {
  const screen = currentScreen();
  return [
    { label: 'Dashboard', to: '/', active: screen === 'dash' },
    { label: 'Browse', to: '/browse', active: BROWSE_FAMILY.includes(screen) || screen === 'detail' },
  ];
});

const inBrowseFamily = computed(() => BROWSE_FAMILY.includes(currentScreen()));

const viewTabs = computed(() => {
  const screen = currentScreen();
  return [
    { label: 'All items', to: '/browse', action: undefined, active: screen === 'browse' },
    { label: 'Motors', to: '/browse?category=motor', action: undefined, active: screen === 'motors' },
    { label: 'Storage', to: '/storage', action: undefined, active: screen === 'storage' },
    { label: 'Search', to: '/search', action: undefined, active: screen === 'search' },
  ];
});

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

function submitSearch() {
  const q = searchQuery.value.trim();
  if (!q) return;
  closeSearch();
  navigateTo(`/search?q=${encodeURIComponent(q)}`);
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
          v-for="n in primaryNavItems"
          :key="n.label"
          :to="n.to"
          :style="{
            border: '0', cursor: 'pointer', padding: '7px 11px',
            font: `600 11px 'Archivo', sans-serif`, letterSpacing: '0.09em', textTransform: 'uppercase',
            background: n.active ? 'var(--color-orange)' : 'transparent',
            color: n.active ? 'var(--color-navy)' : 'rgba(245,241,232,0.75)',
            textDecoration: 'none',
          }"
        >
          {{ n.label }}
        </NuxtLink>
      </nav>

      <div style="display: flex; align-items: center; gap: 10px; flex: none">
        <div style="position: relative">
          <input
            id="header-search-input"
            v-model="searchQuery"
            placeholder="Search the collection…"
            style="width: 230px; padding: 8px 11px; border: 1px solid rgba(245,241,232,0.3); background: rgba(245,241,232,0.08); color: var(--color-paper); font-size: 13px"
            @focus="searchResults.length > 0 && (searchOpen = true)"
            @blur="setTimeout(closeSearch, 150)"
            @keydown.escape="closeSearch"
            @keydown.enter="submitSearch"
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

  <div v-if="inBrowseFamily" style="border-bottom: 1px solid rgba(22,34,76,0.25); background: #EFEADD">
    <div style="max-width: 1440px; margin: 0 auto; padding: 10px 28px; display: flex; align-items: center; gap: 6px">
      <span style="font: 500 9.5px 'JetBrains Mono', monospace; letter-spacing: 0.12em; color: rgba(22,34,76,0.5); margin-right: 6px">VIEW</span>
      <template v-for="t in viewTabs" :key="t.label">
        <NuxtLink
          v-if="t.to"
          :to="t.to"
          :style="{
            border: `1px solid ${t.active ? 'var(--color-navy)' : 'rgba(22,34,76,0.3)'}`,
            background: t.active ? 'var(--color-navy)' : 'transparent',
            color: t.active ? 'var(--color-paper)' : 'rgba(22,34,76,0.7)',
            cursor: 'pointer', padding: '6px 12px', display: 'inline-block',
            font: `600 10.5px 'Archivo', sans-serif`, letterSpacing: '0.09em', textTransform: 'uppercase',
            textDecoration: 'none',
          }"
        >
          {{ t.label }}
        </NuxtLink>
        <button
          v-else
          type="button"
          :style="{
            border: `1px solid ${t.active ? 'var(--color-navy)' : 'rgba(22,34,76,0.3)'}`,
            background: t.active ? 'var(--color-navy)' : 'transparent',
            color: t.active ? 'var(--color-paper)' : 'rgba(22,34,76,0.7)',
            cursor: 'pointer', padding: '6px 12px',
            font: `600 10.5px 'Archivo', sans-serif`, letterSpacing: '0.09em', textTransform: 'uppercase',
          }"
          @click="t.action && t.action()"
        >
          {{ t.label }}
        </button>
      </template>
    </div>
  </div>
</template>
