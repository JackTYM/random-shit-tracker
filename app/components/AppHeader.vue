<script setup lang="ts">
import { CATEGORY_LABELS } from '~/data/categoryFormFields';
import type { HeaderSearchResult } from '~/composables/useSearchItems';

const { session, signOut } = useAuth();
const { searchItems } = useSearchItems();
const route = useRoute();

const BROWSE_FAMILY = ['browse', 'storage', 'search'];

function isDetailRoute(path: string): boolean {
  return path !== '/items/new' && /^\/items\/[^/]+$/.test(path);
}

function currentScreen(): string {
  const path = route.path;
  if (path === '/') return 'dash';
  if (path === '/browse') return 'browse';
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
    { label: 'Storage', to: '/storage', action: undefined, active: screen === 'storage' },
    { label: 'Search', to: '/search', action: undefined, active: screen === 'search' },
  ];
});

const bottomBarItems = computed(() => {
  const screen = currentScreen();
  return [
    { key: 'dash', label: 'DASH', to: '/', active: screen === 'dash' },
    { key: 'browse', label: 'ALL', to: '/browse', active: screen === 'browse' || screen === 'detail' },
    { key: 'storage', label: 'BINS', to: '/storage', active: screen === 'storage' },
    { key: 'search', label: 'FIND', to: '/search', active: screen === 'search' },
  ];
});

const mobileAccountOpen = ref(false);

async function handleSignOut() {
  mobileAccountOpen.value = false;
  await signOut();
  await navigateTo('/login');
}

function toggleMobileAccount() {
  mobileSearchExpanded.value = false;
  mobileAccountOpen.value = !mobileAccountOpen.value;
}

const searchQuery = ref('');
const searchResults = ref<HeaderSearchResult[]>([]);
const searchOpen = ref(false);
const mobileSearchExpanded = ref(false);
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
  mobileSearchExpanded.value = false;
  navigateTo(`/items/${id}`);
}

function closeSearch() {
  searchOpen.value = false;
}

function submitSearch() {
  const q = searchQuery.value.trim();
  if (!q) return;
  if (searchDebounce) clearTimeout(searchDebounce);
  closeSearch();
  mobileSearchExpanded.value = false;
  navigateTo(`/search?q=${encodeURIComponent(q)}`);
}

function handleSearchBlur() {
  setTimeout(() => {
    closeSearch();
    if (!searchQuery.value.trim()) mobileSearchExpanded.value = false;
  }, 150);
}

function openMobileSearch() {
  mobileAccountOpen.value = false;
  mobileSearchExpanded.value = true;
  nextTick(() => document.getElementById('header-search-input')?.focus());
}

// AppHeader is a layout-level component that persists across route changes (it isn't
// remounted per page), so without this, navigating away while the mobile search box is
// expanded with unsubmitted text would leave it open with stale text on top of every
// subsequent page.
watch(
  () => route.path,
  () => {
    mobileSearchExpanded.value = false;
    mobileAccountOpen.value = false;
    searchQuery.value = '';
    searchResults.value = [];
    searchOpen.value = false;
  },
);
</script>

<template>
  <header style="position: sticky; top: 0; z-index: 20; background: var(--color-navy); border-bottom: 4px solid var(--color-orange)">
    <div class="rt-header-bar" style="max-width: 1440px; margin: 0 auto; padding: 0 28px; height: 62px; display: flex; align-items: center; gap: 28px">
      <NuxtLink to="/" style="display: flex; align-items: baseline; gap: 6px; flex: none; text-decoration: none">
        <span class="rt-logo-wordmark" style="font: 400 19px 'Archivo Black', sans-serif; letter-spacing: -0.01em; color: var(--color-paper)">
          RANDOM<span style="color: var(--color-orange)">SHIT</span>TRACKER
        </span>
        <span class="rt-desktop-only" style="font: 500 10px 'JetBrains Mono', monospace; color: rgba(245,241,232,0.45)">.COM</span>
      </NuxtLink>

      <nav class="rt-desktop-only" style="display: flex; gap: 2px; flex: 1">
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
        <div class="rt-header-search-wrap" :class="{ 'rt-mobile-search-open': mobileSearchExpanded }" style="position: relative">
          <input
            id="header-search-input"
            v-model="searchQuery"
            placeholder="Search the collection…"
            style="width: 230px; padding: 8px 11px; border: 1px solid rgba(245,241,232,0.3); background: rgba(245,241,232,0.08); color: var(--color-paper); font-size: 13px"
            @focus="searchResults.length > 0 && (searchOpen = true)"
            @blur="handleSearchBlur"
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

        <button
          type="button"
          class="rt-mobile-only"
          style="border: 1px solid rgba(245,241,232,0.4); background: transparent; cursor: pointer; padding: 8px 10px; font: 600 10px 'Archivo', sans-serif; letter-spacing: 0.06em; color: var(--color-paper)"
          @click="openMobileSearch"
        >
          SEARCH
        </button>

        <div class="rt-desktop-only" style="display: flex; align-items: center; gap: 10px">
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

        <button
          type="button"
          class="rt-mobile-only"
          style="border: 1px solid rgba(245,241,232,0.4); background: transparent; cursor: pointer; padding: 8px 10px; font: 600 10px 'Archivo', sans-serif; letter-spacing: 0.06em; color: var(--color-paper)"
          @click="toggleMobileAccount"
        >
          ACCT
        </button>
      </div>
    </div>
  </header>

  <div v-if="inBrowseFamily" class="rt-desktop-only" style="border-bottom: 1px solid rgba(22,34,76,0.25); background: #EFEADD">
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

  <nav class="rt-mobile-only" style="position: fixed; bottom: 0; left: 0; right: 0; z-index: 20; background: var(--color-navy); border-top: 3px solid var(--color-orange); display: flex; align-items: stretch; padding-bottom: env(safe-area-inset-bottom)">
    <NuxtLink
      v-for="b in bottomBarItems"
      :key="b.key"
      :to="b.to"
      :style="{
        flex: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '3px',
        padding: '9px 4px 7px', textDecoration: 'none', minHeight: '48px',
        font: `600 9.5px 'Archivo', sans-serif`, letterSpacing: '0.05em',
        color: b.active ? 'var(--color-orange)' : 'rgba(245,241,232,0.7)',
        borderTop: b.active ? '2px solid var(--color-orange)' : '2px solid transparent',
        marginTop: '-2px',
      }"
    >
      <svg v-if="b.key === 'dash'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter"><path d="M4 11 L12 4 L20 11" /><path d="M6 10 V20 H18 V10" /></svg>
      <svg v-else-if="b.key === 'browse'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter"><rect x="4" y="4" width="7" height="7" /><rect x="13" y="4" width="7" height="7" /><rect x="4" y="13" width="7" height="7" /><rect x="13" y="13" width="7" height="7" /></svg>
      <svg v-else-if="b.key === 'storage'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter"><rect x="4" y="8" width="16" height="12" /><path d="M4 8 L6 4 H18 L20 8" /><path d="M10 13 H14" /></svg>
      <svg v-else-if="b.key === 'search'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter"><circle cx="10.5" cy="10.5" r="6.5" /><path d="M15.5 15.5 L21 21" /></svg>
      {{ b.label }}
    </NuxtLink>
    <NuxtLink
      to="/items/new"
      style="flex: 0 0 54px; display: flex; align-items: center; justify-content: center; background: var(--color-orange); color: var(--color-navy); text-decoration: none; font: 400 26px 'Archivo Black', sans-serif; min-height: 48px"
    >
      +
    </NuxtLink>
  </nav>

  <div v-if="mobileAccountOpen" style="position: fixed; inset: 0; background: rgba(22,34,76,0.5); z-index: 40" @click.self="mobileAccountOpen = false">
    <div style="position: fixed; left: 0; right: 0; bottom: 0; background: var(--color-navy); border-top: 3px solid var(--color-orange); padding: 20px 20px 28px">
      <div style="font: 500 11px 'JetBrains Mono', monospace; letter-spacing: 0.08em; color: rgba(245,241,232,0.7); margin-bottom: 12px">{{ session?.user?.email }}</div>
      <button
        type="button"
        style="width: 100%; border: 1px solid rgba(245,241,232,0.4); background: transparent; cursor: pointer; padding: 12px; font: 600 12px 'Archivo', sans-serif; letter-spacing: 0.06em; color: var(--color-paper); min-height: 44px"
        @click="handleSignOut"
      >
        Sign out
      </button>
    </div>
  </div>
</template>

<style scoped>
@media (max-width: 768px) {
  /* The 273px-wide wordmark plus its 28px/28px padding+gap left no room for the SEARCH/ACCT
     buttons at 390px, pushing them off-screen. Shrink the bar's own spacing and the wordmark's
     font-size (the .COM suffix is hidden entirely via .rt-desktop-only, added above). */
  .rt-header-bar {
    padding: 0 10px !important;
    gap: 6px !important;
  }

  .rt-logo-wordmark {
    font-size: 13px !important;
  }

  .rt-header-search-wrap {
    display: none;
  }

  .rt-header-search-wrap.rt-mobile-search-open {
    display: block;
    position: absolute !important;
    left: 8px;
    right: 8px;
    top: 100%;
    margin-top: 4px;
    z-index: 25;
    background: var(--color-navy);
    padding: 8px;
    border-bottom: 3px solid var(--color-orange);
  }

  .rt-header-search-wrap.rt-mobile-search-open input {
    width: 100% !important;
  }
}
</style>
