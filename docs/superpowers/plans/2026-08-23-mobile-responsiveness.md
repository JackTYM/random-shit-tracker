# Mobile Responsiveness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:subagent-driven-development (recommended) or superpowers-extended-cc:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every page of RandomShitTracker.com usable on a phone (~390px viewport) without breaking desktop behavior, per the approved design spec at `docs/superpowers/specs/2026-08-23-mobile-responsiveness-design.md`.

**Architecture:** One breakpoint at `768px`. Existing inline `style="..."` attributes are left completely untouched everywhere. Two global `!important` visibility utility classes (`.rt-desktop-only` / `.rt-mobile-only`) are added once to `app/assets/css/main.css` and reused everywhere to hide/show whole elements without touching their inline styles at all. Wherever a specific CSS property (not just show/hide) must change at the breakpoint — a grid's column count, a flex direction, a fixed width — a small component-scoped class with an `!important` override is added directly on the existing element (still without touching its `style` attribute). This is a deliberate adaptation of the spec's "move properties out of inline styles" instruction: instead of extracting individual properties out of long inline style strings (fiddly, easy to break something else), every fix is purely additive — new classes and new sibling elements only. The `!important` usage is narrowly scoped to this specific "utility must beat inline" purpose, never used for ordinary styling.

**Tech Stack:** Nuxt 4, Vue 3 `<script setup>`, plain CSS (`<style scoped>` blocks + one shared global stylesheet). No new dependencies.

**User decisions (already made):**
- Mobile nav pattern: fixed bottom tab bar (Dashboard, Browse, Motors, Storage, Search + a prominent "+" for Add Item), not a hamburger drawer or overflow menu.
- Motors table on mobile: a card list (one card per motor), not a horizontally-scrollable table.
- Single breakpoint at 768px.

---

## Task 1: Global responsive utility classes and small CSS fixes

**Goal:** `app/assets/css/main.css` gains the two shared visibility utility classes every later task depends on, plus the header-search-placeholder-contrast and select-chevron fixes.

**Files:**
- Modify: `app/assets/css/main.css`

**Acceptance Criteria:**
- [ ] `.rt-desktop-only` hides an element below 768px regardless of any inline `style` it carries
- [ ] `.rt-mobile-only` hides an element at 769px and above regardless of any inline `style` it carries
- [ ] The header search input's placeholder (`id="header-search-input"`) is legible (light-on-dark) without changing placeholder color anywhere else in the app
- [ ] Every `<select>` shows a visible chevron
- [ ] `npm run typecheck && npm run build` both pass

**Verify:** `npm run typecheck && npm run build`. Manual: open the app, resize the browser across 768px, confirm no visual regression on any page yet (no page uses the new classes until later tasks — this task alone should be a no-op visually except the select chevron and search placeholder, both immediately visible on the Dashboard header / Add Item category dropdowns).

**Steps:**

- [ ] **Step 1: Read the current file**

Read `app/assets/css/main.css` in full to confirm it still matches this exactly:

```css
html, body {
  margin: 0;
  padding: 0;
  background: var(--color-paper);
}

* {
  box-sizing: border-box;
}

body {
  font-family: var(--font-ui);
  color: var(--color-navy);
}

a {
  color: var(--color-rust);
  text-decoration: none;
  border-bottom: 1px solid rgba(194, 65, 12, 0.4);
}

a:hover {
  color: var(--color-navy);
  border-bottom-color: var(--color-navy);
}

input, select, textarea, button {
  font-family: var(--font-ui);
}

select {
  appearance: none;
  background-image: none;
}

::placeholder {
  color: rgba(22, 34, 76, 0.35);
}
```

If it has drifted from this, stop and report the actual content before proceeding — do not blindly apply the diff below onto different content.

- [ ] **Step 2: Add the chevron to the existing `select` rule**

Replace:
```css
select {
  appearance: none;
  background-image: none;
}
```
with:
```css
select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 6'%3E%3Cpath fill='%2316224C' d='M0 0l5 6 5-6z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 10px 6px;
  padding-right: 26px;
}
```

- [ ] **Step 3: Add the header search placeholder override and the two visibility utilities**

Append this to the end of the file (after the existing `::placeholder` rule):

```css

/* Header search input sits on a dark background; the app-wide placeholder color (dark navy)
   is unreadable there. Scoped to this one input's id — every other placeholder in the app is
   correctly dark-on-light and must not change. */
#header-search-input::placeholder {
  color: rgba(245, 241, 232, 0.5);
}

/* Shared responsive visibility utilities. Marked !important deliberately: these exist
   specifically to override elements' own inline `style="display: ..."` attributes (which this
   codebase uses everywhere and which always win over a plain, non-important class rule). Only
   ever used to toggle `display` — never for ordinary styling. */
@media (max-width: 768px) {
  .rt-desktop-only {
    display: none !important;
  }
}

@media (min-width: 769px) {
  .rt-mobile-only {
    display: none !important;
  }
}
```

- [ ] **Step 4: Verify and commit**

```bash
npm run typecheck && npm run build
```
Expected: both pass with 0 errors.

Live check: run `npm run dev`, open the Add Item page, confirm the category `<select>`-style dropdowns (Construction, Certification Status, etc. — visible once a category is picked) now show a small triangle chevron. Open the Dashboard, resize the browser to under 768px, confirm nothing on the page changes yet (no class is used anywhere else until later tasks).

```bash
git add app/assets/css/main.css
git commit -m "Add responsive visibility utilities, select chevron, header search placeholder fix"
```

---

## Task 2: Header — mobile bottom tab bar, collapsing search, account sheet

**Goal:** Below 768px, the header collapses to logo + search/account icon buttons, a fixed bottom tab bar provides navigation, and page content gets bottom clearance so the bar never overlaps it. Above 768px, the header is pixel-identical to today.

**Files:**
- Modify: `app/components/AppHeader.vue`
- Modify: `app/layouts/default.vue`

**Acceptance Criteria:**
- [ ] Above 768px: header renders and behaves exactly as before (no visual or functional change)
- [ ] Below 768px: primary nav (Dashboard/Browse) and the VIEW sub-tab strip are hidden; `+ ADD ITEM`, the user's email, and the desktop Sign out button are hidden
- [ ] Below 768px: a "SEARCH" button appears in the header; tapping it reveals the existing search input (same debounce/dropdown/typeahead behavior as desktop) in place; the input still has `id="header-search-input"` (required — `app/pages/search.vue` calls `document.getElementById('header-search-input')?.focus()`)
- [ ] Below 768px: an "ACCT" button appears in the header; tapping it opens a bottom sheet showing the user's email and a working Sign out button
- [ ] Below 768px: a fixed bottom bar shows Dashboard/Browse/Motors/Storage/Search destinations plus a distinct "+" button linking to Add Item; the active destination is visually highlighted using the same `currentScreen()` logic already driving desktop active states
- [ ] Below 768px: page content never sits underneath the fixed bottom bar (bottom padding added to the layout)
- [ ] `npm run typecheck` passes

**Verify:** `npm run typecheck`. Live browser check at both ~1440px and ~390px: confirm every criterion above; confirm search still works end-to-end on mobile (type a query, see results, click one, land on its detail page); confirm Sign out still works from the mobile account sheet; confirm every bottom-bar destination navigates correctly and highlights when active.

**Steps:**

- [ ] **Step 1: Read the current file**

Read `app/components/AppHeader.vue` in full and confirm its current content matches what's shown in Step 2 below's "before" state (the version with `currentScreen()`, `primaryNavItems`, `viewTabs`, the search box with `id="header-search-input"`, `+ ADD ITEM`, session email, and Sign out). If it has drifted, stop and report before proceeding.

- [ ] **Step 2: Replace the file with the full new version**

Replace the entire contents of `app/components/AppHeader.vue` with:

```vue
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
  if (path === '/browse') return 'browse';
  if (path === '/motors') return 'motors';
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
    { label: 'Motors', to: '/motors', action: undefined, active: screen === 'motors' },
    { label: 'Storage', to: '/storage', action: undefined, active: screen === 'storage' },
    { label: 'Search', to: '/search', action: undefined, active: screen === 'search' },
  ];
});

const bottomBarItems = computed(() => {
  const screen = currentScreen();
  return [
    { label: 'DASH', to: '/', active: screen === 'dash' },
    { label: 'ALL', to: '/browse', active: screen === 'browse' || screen === 'detail' },
    { label: 'MOTORS', to: '/motors', active: screen === 'motors' },
    { label: 'BINS', to: '/storage', active: screen === 'storage' },
    { label: 'FIND', to: '/search', active: screen === 'search' },
  ];
});

const mobileAccountOpen = ref(false);

async function handleSignOut() {
  mobileAccountOpen.value = false;
  await signOut();
  await navigateTo('/login');
}

function toggleMobileAccount() {
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
  mobileSearchExpanded.value = true;
  nextTick(() => document.getElementById('header-search-input')?.focus());
}
</script>

<template>
  <header style="position: sticky; top: 0; z-index: 20; background: var(--color-navy); border-bottom: 4px solid var(--color-orange)">
    <div style="max-width: 1440px; margin: 0 auto; padding: 0 28px; height: 62px; display: flex; align-items: center; gap: 28px">
      <NuxtLink to="/" style="display: flex; align-items: baseline; gap: 6px; flex: none; text-decoration: none">
        <span style="font: 400 19px 'Archivo Black', sans-serif; letter-spacing: -0.01em; color: var(--color-paper)">
          RANDOM<span style="color: var(--color-orange)">SHIT</span>TRACKER
        </span>
        <span style="font: 500 10px 'JetBrains Mono', monospace; color: rgba(245,241,232,0.45)">.COM</span>
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

  <nav class="rt-mobile-only" style="position: fixed; bottom: 0; left: 0; right: 0; z-index: 20; background: var(--color-navy); border-top: 3px solid var(--color-orange); display: flex; align-items: stretch">
    <NuxtLink
      v-for="b in bottomBarItems"
      :key="b.label"
      :to="b.to"
      :style="{
        flex: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '12px 4px', textDecoration: 'none', minHeight: '44px',
        font: `600 9.5px 'Archivo', sans-serif`, letterSpacing: '0.05em',
        color: b.active ? 'var(--color-orange)' : 'rgba(245,241,232,0.7)',
        borderTop: b.active ? '2px solid var(--color-orange)' : '2px solid transparent',
        marginTop: '-2px',
      }"
    >
      {{ b.label }}
    </NuxtLink>
    <NuxtLink
      to="/items/new"
      style="flex: 0 0 54px; display: flex; align-items: center; justify-content: center; background: var(--color-orange); color: var(--color-navy); text-decoration: none; font: 400 22px 'Archivo Black', sans-serif; min-height: 44px"
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
  .rt-header-search-wrap {
    display: none;
  }

  .rt-header-search-wrap.rt-mobile-search-open {
    display: block;
    position: absolute;
    left: 8px;
    right: 8px;
    top: 100%;
    margin-top: 4px;
    z-index: 25;
  }

  .rt-header-search-wrap.rt-mobile-search-open input {
    width: 100%;
  }
}
</style>
```

Note what changed vs. the original, precisely: every existing element, its inline `style`, and its logic (search debounce, result selection, sign-out) is unchanged. Additions are: `bottomBarItems` computed, `mobileAccountOpen`/`mobileSearchExpanded` refs, `toggleMobileAccount`/`openMobileSearch`/`handleSearchBlur` functions (the last replaces the previous inline `@blur="setTimeout(closeSearch, 150)"` with an equivalent named function that also collapses mobile search), `class="rt-desktop-only"` on the primary `<nav>` and the VIEW-strip `<div>`, a `class="rt-header-search-wrap"` wrapper-class (not a new wrapper element — added directly to the existing `position: relative` div) with a `:class` binding for the mobile-expanded state, two new `rt-mobile-only` buttons (SEARCH, ACCT), a new `rt-mobile-only` bottom `<nav>`, and a new account-sheet `<div v-if="mobileAccountOpen">`. `submitSearch` and `selectResult` each gained one line (`mobileSearchExpanded.value = false;`) to collapse the mobile search state after use.

- [ ] **Step 2: Add bottom padding to the layout**

Read `app/layouts/default.vue` first to confirm it currently matches:

```vue
<template>
  <div style="min-height: 100vh; background: var(--color-paper); font-family: var(--font-ui); color: var(--color-navy)">
    <AppHeader />
    <slot />
  </div>
</template>
```

Replace it with:

```vue
<template>
  <div class="rt-app-shell" style="min-height: 100vh; background: var(--color-paper); font-family: var(--font-ui); color: var(--color-navy)">
    <AppHeader />
    <slot />
  </div>
</template>

<style scoped>
@media (max-width: 768px) {
  .rt-app-shell {
    padding-bottom: 62px;
  }
}
</style>
```

- [ ] **Step 3: Verify and commit**

```bash
npm run typecheck
```
Expected: `ok`.

Live browser check with `npm run dev`, at both ~1440px and ~390px widths:
- Desktop (≥769px): header, VIEW strip, search, +ADD ITEM, email, Sign out all render and behave exactly as before. No bottom bar visible.
- Mobile (≤768px): only logo + SEARCH + ACCT buttons show in the top bar. Tapping SEARCH reveals the input (focused), typing shows the same dropdown results as desktop, clicking a result navigates correctly, and the input collapses back afterward. Tapping ACCT opens the bottom sheet with the correct email and a working Sign out. The fixed bottom bar shows DASH/ALL/MOTORS/BINS/FIND + a "+" button; each link navigates correctly and the active one is highlighted; page content is never hidden underneath the bar (scroll to the bottom of a long page and confirm the last content is still fully visible above the bar).

```bash
git add app/components/AppHeader.vue app/layouts/default.vue
git commit -m "Add mobile bottom tab bar, collapsing header search, and account sheet"
```

---

## Task 3: Motors — card list on mobile

**Goal:** Below 768px, `/motors` shows a stacked card per motor with a collapsible filters panel, instead of the desktop sidebar + table. Above 768px, unchanged.

**Files:**
- Modify: `app/pages/motors.vue`

**Acceptance Criteria:**
- [ ] Above 768px: page renders and behaves exactly as before
- [ ] Below 768px: the sidebar + table are hidden; a card list renders instead, one card per filtered/sorted motor, showing designation, impulse class, diameter, propellant, construction, certification, quantity, and storage location
- [ ] Below 768px: a "TOTAL ON HAND" stat block (unfiltered grand total, same numbers as desktop sidebar) is always visible above the card list
- [ ] Below 768px: a "FILTERS" toggle button reveals/hides a panel containing the same impulse-class multi-select and cert-status chip controls as desktop, sharing the exact same `selectedClasses`/`selectedCerts` state (toggling a filter in the mobile panel affects the same filtered results as it would on desktop)
- [ ] Below 768px: the filtered count/quantity line is visible above the card list
- [ ] `npm run typecheck` passes

**Verify:** `npm run typecheck`. Live browser check at ~390px: confirm cards render correctly for real motor data, confirm toggling an impulse class or cert filter in the mobile panel actually changes which cards show (same filtering logic, not a separate copy), confirm the empty-filters and no-motors-yet states still show their existing messages.

**Steps:**

- [ ] **Step 1: Read the current file**

Read `app/pages/motors.vue` in full and confirm its content matches the version already on `master` (the `<script setup>` with `allRows`/`filteredRows`/`selectedClasses`/`selectedCerts`/`toggleClass`/`toggleCert`/`CERT_OPTIONS`/`certStyle`, and the template's `v-if="loading"` / `v-else-if="loadError"` / `v-else-if="motorItems.length === 0"` / `v-else` chain). If it has drifted, stop and report before proceeding.

- [ ] **Step 2: Add a `mobileFiltersOpen` ref**

In `<script setup>`, add near the other refs (after `const selectedCerts = ref<string[]>([]);`):

```ts
const mobileFiltersOpen = ref(false);
```

- [ ] **Step 3: Tag the existing desktop block and add the mobile block**

Find the existing `v-else` block that starts `<div v-else style="display: flex; gap: 24px; align-items: flex-start">` (the one containing `<aside>` and `<section>`). Add `class="rt-desktop-only"` to it, changing only its opening tag:

```html
<div v-else class="rt-desktop-only" style="display: flex; gap: 24px; align-items: flex-start">
```

Everything inside this block (the `<aside>`, the `<section>`, all filter buttons, the table) stays completely unchanged.

Immediately after this block's closing `</div>` (and still before the outer `</main>`), add:

```html
<div v-if="motorItems.length > 0" class="rt-mobile-only">
  <div style="background: var(--color-orange); border: 1px solid var(--color-navy); padding: 12px; margin-bottom: 12px">
    <div style="font: 500 10px 'JetBrains Mono', monospace; letter-spacing: 0.12em; color: rgba(22,34,76,0.75)">TOTAL ON HAND</div>
    <div style="font: 400 30px 'Archivo Black', sans-serif; line-height: 1.1">{{ totalOnHand }}</div>
    <div style="font: 400 10px 'JetBrains Mono', monospace; color: rgba(22,34,76,0.8)">ACROSS {{ designationCount }} DESIGNATIONS</div>
  </div>

  <button
    type="button"
    style="width: 100%; border: 1px solid var(--color-navy); background: #fff; cursor: pointer; padding: 10px 12px; margin-bottom: 10px; min-height: 44px; font: 600 11px 'Archivo', sans-serif; letter-spacing: 0.08em; text-align: left"
    @click="mobileFiltersOpen = !mobileFiltersOpen"
  >
    {{ mobileFiltersOpen ? 'HIDE FILTERS ▴' : 'FILTERS ▾' }}
  </button>

  <div v-if="mobileFiltersOpen" style="background: #fff; border: 1px solid var(--color-navy); padding: 12px; margin-bottom: 12px">
    <div style="font: 500 10px 'JetBrains Mono', monospace; letter-spacing: 0.1em; color: rgba(22,34,76,0.6); margin-bottom: 8px">IMPULSE CLASS</div>
    <button
      v-for="cls in availableClasses"
      :key="cls"
      type="button"
      :style="{
        width: '100%', textAlign: 'left', cursor: 'pointer', padding: '10px', marginBottom: '5px', minHeight: '44px',
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
    <div style="height: 1px; background: rgba(22,34,76,0.2); margin: 12px 0" />
    <div style="font: 500 10px 'JetBrains Mono', monospace; letter-spacing: 0.1em; color: rgba(22,34,76,0.6); margin-bottom: 8px">CERTIFICATION</div>
    <div style="display: flex; flex-wrap: wrap; gap: 6px">
      <button
        v-for="cert in CERT_OPTIONS"
        :key="cert"
        type="button"
        :style="{
          border: `1px solid ${selectedCerts.includes(cert) ? 'var(--color-navy)' : 'rgba(22,34,76,0.3)'}`,
          background: selectedCerts.includes(cert) ? 'var(--color-navy)' : 'transparent',
          color: selectedCerts.includes(cert) ? 'var(--color-paper)' : 'var(--color-navy)',
          cursor: 'pointer', padding: '10px 12px', minHeight: '44px', font: `500 10px 'JetBrains Mono', monospace`, letterSpacing: '0.08em',
        }"
        @click="toggleCert(cert)"
      >
        {{ cert.toUpperCase() }}
      </button>
    </div>
  </div>

  <div style="font: 500 11px 'JetBrains Mono', monospace; letter-spacing: 0.08em; color: rgba(22,34,76,0.65); margin-bottom: 10px">{{ filteredCount }} ITEM{{ filteredCount === 1 ? '' : 'S' }} SHOWN · {{ filteredQty }} ON HAND</div>

  <div v-if="filteredRows.length === 0" style="border: 1px dashed rgba(22,34,76,0.4); padding: 32px; text-align: center; font: 500 12px 'JetBrains Mono', monospace; letter-spacing: 0.08em; color: rgba(22,34,76,0.6)">
    NO MOTORS MATCH THESE FILTERS
  </div>

  <div v-else style="display: flex; flex-direction: column; gap: 10px">
    <div
      v-for="r in filteredRows"
      :key="r.id"
      style="background: #fff; border: 1px solid var(--color-navy); padding: 12px 14px; cursor: pointer"
      @click="navigateTo(`/items/${r.id}`)"
    >
      <div style="display: flex; align-items: baseline; justify-content: space-between; gap: 8px; margin-bottom: 8px">
        <span style="font: 400 15px 'Archivo Black', sans-serif; letter-spacing: 0.01em">{{ r.designation }}</span>
        <span style="font: 700 13px 'JetBrains Mono', monospace">{{ r.cls || '—' }}</span>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px 12px; font: 400 12px 'JetBrains Mono', monospace; color: rgba(22,34,76,0.8)">
        <div>DIA <strong style="color: var(--color-navy)">{{ r.dia }}</strong></div>
        <div>QTY <strong style="color: var(--color-navy)">{{ r.qty }}</strong></div>
        <div>{{ r.propellant }}</div>
        <div>{{ r.type }}</div>
      </div>
      <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 8px; gap: 8px">
        <span :style="{ display: 'inline-block', background: certStyle(r.cert).bg, color: certStyle(r.cert).fg, border: `1px solid ${certStyle(r.cert).border}`, padding: '3px 7px', font: `700 9px 'JetBrains Mono', monospace`, letterSpacing: '0.08em' }">{{ r.cert.toUpperCase() }}</span>
        <span style="font: 500 10.5px 'JetBrains Mono', monospace; letter-spacing: 0.04em">▪ {{ r.location }}</span>
      </div>
    </div>
  </div>
</div>
```

This new block reuses `totalOnHand`, `designationCount`, `availableClasses`, `classCounts`, `selectedClasses`, `toggleClass`, `CERT_OPTIONS`, `selectedCerts`, `toggleCert`, `filteredCount`, `filteredQty`, `filteredRows`, `certStyle` — all already defined in `<script setup>`, none of them new. `v-if="motorItems.length > 0"` naturally covers the loading state too (during loading, `items` is empty so `motorItems` is empty, so this block simply doesn't render, matching the desktop chain's behavior without needing to duplicate the `loading`/`loadError`/`motorItems.length === 0` checks — those existing top-level branches already handle those states for the whole page, mobile included).

- [ ] **Step 4: Verify and commit**

```bash
npm run typecheck
```
Expected: `ok`.

Live browser check at ~390px with real motor data: confirm cards show correct designation/class/diameter/propellant/construction/certification/quantity/location; tap FILTERS, toggle an impulse class, confirm the card list actually filters (and the toggle also visually updates, matching desktop's selected-state styling); toggle it off, toggle a cert-status chip, confirm that filters too; confirm the "X ITEMS SHOWN · Y ON HAND" line updates to match.

```bash
git add app/pages/motors.vue
git commit -m "Add mobile card-list view for Motors with collapsible filters"
```

---

## Task 4: Dashboard, Browse, and Search — responsive grids

**Goal:** Below 768px, Dashboard's category/recent-item grids reflow instead of clipping, Browse's filter sidebar stacks above results, and Search's result rows stack instead of overlapping.

**Files:**
- Modify: `app/pages/index.vue`
- Modify: `app/pages/browse.vue`
- Modify: `app/pages/search.vue`

**Acceptance Criteria:**
- [ ] Above 768px: all three pages render and behave exactly as before
- [ ] Below 768px, Dashboard: the 6-tile category grid and the 4-card recent-items grid both reflow to fit the viewport (no clipped tiles/cards); the "Motors by impulse class" / "Estimates needing review" two-column row stacks to one column; the impulse-class bar chart's bars keep a readable minimum width (scrolling horizontally only if that minimum still doesn't fit, never collapsing to zero-width)
- [ ] Below 768px, Browse: the filter sidebar renders as a full-width block above the results grid instead of beside it; filter buttons keep a minimum 44px tap height
- [ ] Below 768px, Search: each result row's storage-location badge and price wrap to a second line instead of overlapping the title
- [ ] `npm run typecheck` passes

**Verify:** `npm run typecheck`. Live browser check at ~390px on all three pages with real data; confirm `document.documentElement.scrollWidth` does not exceed `window.innerWidth` on any of them (no horizontal page scroll from these pages' own content — the header/bottom-bar from Task 2 must already be in place for this check to be meaningful body-wide, but verify each of these three pages' own content doesn't independently reintroduce overflow).

**Steps:**

- [ ] **Step 1: Read all three current files**

Read `app/pages/index.vue`, `app/pages/browse.vue`, and `app/pages/search.vue` in full and confirm they match the versions currently on `master`. If any has drifted, stop and report before proceeding.

- [ ] **Step 2: Dashboard grids**

In `app/pages/index.vue`, make these four surgical changes (add a `class` attribute to each element's opening tag; do not change anything else about them):

1. Find `<div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 12px; margin-bottom: 14px">` (the category-tiles grid) and change it to:
   ```html
   <div class="rt-dash-grid-6" style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 12px; margin-bottom: 14px">
   ```

2. Find `<div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px">` (the recent-items grid) and change it to:
   ```html
   <div class="rt-dash-grid-4" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px">
   ```

3. Find `<div style="display: grid; grid-template-columns: 1.1fr 1fr; gap: 20px; margin-top: 14px">` (the impulse-chart / stale-estimates two-column row) and change it to:
   ```html
   <div class="rt-dash-two-col" style="display: grid; grid-template-columns: 1.1fr 1fr; gap: 20px; margin-top: 14px">
   ```

4. Find `<div v-else style="display: flex; flex-direction: column; gap: 7px">` (the impulse bar chart's rows container, inside the "Motors by impulse class" card) and change it to:
   ```html
   <div v-else class="rt-impulse-chart-wrap" style="display: flex; flex-direction: column; gap: 7px">
   ```
   Then find the bar-track div inside that loop, `<div style="flex: 1; height: 16px; background: var(--color-paper); border: 1px solid rgba(22,34,76,0.25)">`, and change it to:
   ```html
   <div class="rt-impulse-bar-track" style="flex: 1; height: 16px; background: var(--color-paper); border: 1px solid rgba(22,34,76,0.25)">
   ```

Then add this `<style scoped>` block right after the closing `</template>` tag at the end of the file:

```html
<style scoped>
@media (max-width: 768px) {
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
```

- [ ] **Step 3: Browse sidebar**

In `app/pages/browse.vue`, make these two changes:

1. Find `<main style="max-width: 1440px; margin: 0 auto; padding: 24px 28px 64px; display: flex; gap: 24px; align-items: flex-start">` and change it to:
   ```html
   <main class="rt-browse-shell" style="max-width: 1440px; margin: 0 auto; padding: 24px 28px 64px; display: flex; gap: 24px; align-items: flex-start">
   ```

2. Find `<aside style="width: 236px; flex: none; position: sticky; top: 86px">` and change it to:
   ```html
   <aside class="rt-browse-sidebar" style="width: 236px; flex: none; position: sticky; top: 86px">
   ```

Add `class="rt-tap-target"` to the three filter-button `v-for` loops inside the sidebar (category buttons, manufacturer buttons, storage buttons) and to the "MISSING VALUE ESTIMATE" button — each of these currently starts with `:style="{...}"` (a bound object, not a plain string); add the class as a separate attribute alongside it, e.g. the category button's opening tag:
```html
<button
  v-for="opt in categoryOptions"
  :key="opt.value"
  type="button"
  class="rt-tap-target"
  :style="{
```
(Same pattern — add `class="rt-tap-target"` right after `type="button"` — for the manufacturer-options loop, the storage-options loop, and the standalone "MISSING VALUE ESTIMATE" button. Do not modify any `:style` binding.)

Then add this `<style scoped>` block right after the closing `</template>` tag at the end of the file:

```html
<style scoped>
@media (max-width: 768px) {
  .rt-browse-shell {
    flex-direction: column !important;
  }

  .rt-browse-sidebar {
    width: 100% !important;
    position: static !important;
  }

  .rt-tap-target {
    min-height: 44px !important;
  }
}
</style>
```

- [ ] **Step 4: Search result rows**

In `app/pages/search.vue`, find this block (the per-result row):

```html
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
```

Replace it with:

```html
          <div
            v-for="r in g.rows"
            :key="r.id"
            class="rt-search-row"
            style="display: flex; align-items: center; gap: 14px; padding: 11px 14px; border-bottom: 1px dotted rgba(22,34,76,0.3); cursor: pointer"
            @click="navigateTo(`/items/${r.id}`)"
          >
            <img v-if="primaryPhotoByItem[r.id]" :src="primaryPhotoByItem[r.id]" :alt="r.name" style="width: 46px; height: 46px; flex: none; object-fit: cover; border: 1px solid rgba(22,34,76,0.45)" />
            <div v-else style="width: 46px; height: 46px; flex: none; border: 1px solid rgba(22,34,76,0.45); background: repeating-linear-gradient(135deg, #EAE4D5 0 5px, var(--color-paper) 5px 10px)" />
            <div style="flex: 1; min-width: 0">
              <div style="font: 400 14px 'Archivo Black', sans-serif; text-transform: uppercase">{{ r.name }}</div>
              <div v-if="metaLine(r)" style="font: 400 10.5px 'JetBrains Mono', monospace; color: rgba(22,34,76,0.65); margin-top: 3px">{{ metaLine(r) }}</div>
            </div>
            <div class="rt-search-meta" style="display: flex; align-items: center; gap: 10px">
              <span style="font: 500 10.5px 'JetBrains Mono', monospace; letter-spacing: 0.06em; color: var(--color-navy)">▪ {{ r.storage_location || '—' }}</span>
              <span v-if="r.approx_value_usd" style="width: 70px; text-align: right; font: 400 15px 'Archivo Black', sans-serif; color: var(--color-rust)">${{ Number(r.approx_value_usd).toFixed(2) }}</span>
            </div>
          </div>
```

(The only change is wrapping the two trailing `<span>`s in a new `<div class="rt-search-meta">` and adding `class="rt-search-row"` to the outer row — both spans' own content/style are untouched.)

Then add this `<style scoped>` block right after the closing `</template>` tag at the end of the file:

```html
<style scoped>
@media (max-width: 768px) {
  .rt-search-row {
    flex-wrap: wrap;
  }

  .rt-search-meta {
    flex: 1 1 100%;
    justify-content: space-between;
    padding-left: 60px;
  }
}
</style>
```

- [ ] **Step 5: Verify and commit**

```bash
npm run typecheck
```
Expected: `ok`.

Live browser check at ~390px with real data on all three pages: Dashboard's category tiles and recent cards reflow into a narrower grid with no clipping; the two-column "impulse class / stale estimates" row stacks to one column; Browse's filter sidebar appears above the results as a full-width block, its buttons all feel comfortably tappable; Search result rows show the location badge + price on their own line beneath the title, no overlapping text. Confirm all three pages still look and behave identically to before at ~1440px.

```bash
git add app/pages/index.vue app/pages/browse.vue app/pages/search.vue
git commit -m "Make Dashboard, Browse, and Search grids responsive below 768px"
```

---

## Task 5: Item Detail, Add Item, and CategoryFieldsForm — responsive grids

**Goal:** Below 768px, Item Detail's photo/details split and edit-mode grid collapse to one column, and Add Item's general/category-specific field grids collapse to one column, so every field is reachable by scrolling instead of clipped off-screen.

**Files:**
- Modify: `app/pages/items/[id].vue`
- Modify: `app/pages/items/new.vue`
- Modify: `app/components/CategoryFieldsForm.vue`

**Acceptance Criteria:**
- [ ] Above 768px: all three files render and behave exactly as before
- [ ] Below 768px, Item Detail: the photo/details grid stacks to one column (photo first, full-width, details beneath); the thumbnail strip reflows instead of forcing exactly 4 fixed columns; the value/storage two-column block stacks to one column; edit mode's two-column field grid stacks to one column; the link-picker modal fits within the viewport instead of overflowing it
- [ ] Below 768px, Add Item: the General section's three-column field grid stacks to one column
- [ ] Below 768px, category-specific fields (`CategoryFieldsForm.vue`, used by both Add Item and Item Detail's edit mode): the three-column field grid stacks to one column
- [ ] `npm run typecheck && npm run build` both pass

**Verify:** `npm run typecheck && npm run build`. Live browser check at ~390px: open an existing item's detail page (view and edit mode), and the Add Item page for at least 2 categories (e.g. Rocket Motor and Model Rocket Part) — confirm every field is reachable by scrolling, nothing is clipped off the right edge of the screen.

**Steps:**

- [ ] **Step 1: Read all three current files**

Read `app/pages/items/[id].vue`, `app/pages/items/new.vue`, and `app/components/CategoryFieldsForm.vue` in full and confirm they match the versions currently on `master`. If any has drifted, stop and report before proceeding.

- [ ] **Step 2: Item Detail grids**

In `app/pages/items/[id].vue`, make these four changes (add a `class` attribute; change nothing else on each element):

1. `<div style="display: grid; grid-template-columns: 0.9fr 1.1fr; gap: 28px; align-items: start">` →
   ```html
   <div class="rt-detail-grid" style="display: grid; grid-template-columns: 0.9fr 1.1fr; gap: 28px; align-items: start">
   ```

2. `<div v-if="photos.length > 1" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 8px">` →
   ```html
   <div v-if="photos.length > 1" class="rt-thumb-grid" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 8px">
   ```

3. `<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 14px">` (the APPROX. VALUE / STORAGE LOCATION row) →
   ```html
   <div class="rt-value-storage-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 14px">
   ```

4. `<div style="background: #fff; border: 1px solid var(--color-navy); margin-top: 20px; padding: 18px 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 16px">` (the edit-mode field grid) →
   ```html
   <div class="rt-edit-grid" style="background: #fff; border: 1px solid var(--color-navy); margin-top: 20px; padding: 18px 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 16px">
   ```

Also find the link-picker modal panel, `<div style="background: #fff; border: 1px solid var(--color-navy); width: 420px; padding: 20px">`, and change it to:
```html
<div class="rt-link-modal" style="background: #fff; border: 1px solid var(--color-navy); width: 420px; padding: 20px">
```

Then add this `<style scoped>` block right after the closing `</template>` tag at the end of the file:

```html
<style scoped>
@media (max-width: 768px) {
  .rt-detail-grid,
  .rt-value-storage-grid,
  .rt-edit-grid {
    grid-template-columns: 1fr !important;
  }

  .rt-thumb-grid {
    grid-template-columns: repeat(auto-fill, minmax(64px, 1fr)) !important;
  }

  .rt-link-modal {
    width: calc(100vw - 32px) !important;
  }
}
</style>
```

- [ ] **Step 3: Add Item grid**

In `app/pages/items/new.vue`, find `<div style="padding: 18px 20px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px">` (Section 1's field grid) and change it to:

```html
<div class="rt-additem-grid" style="padding: 18px 20px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px">
```

Then add this `<style scoped>` block right after the closing `</template>` tag at the end of the file:

```html
<style scoped>
@media (max-width: 768px) {
  .rt-additem-grid {
    grid-template-columns: 1fr !important;
  }
}
</style>
```

- [ ] **Step 4: CategoryFieldsForm grid**

In `app/components/CategoryFieldsForm.vue`, find `<div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px">` (the component's only grid, wrapping the `v-for="field in currentFields"` loop) and change it to:

```html
<div class="rt-additem-grid" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px">
```

Then add this `<style scoped>` block right after the closing `</template>` tag at the end of the file:

```html
<style scoped>
@media (max-width: 768px) {
  .rt-additem-grid {
    grid-template-columns: 1fr !important;
  }
}
</style>
```

(This is the same class name and rule as Task's Step 3 in `new.vue`, defined independently in this separate component — Vue's `scoped` attribute namespaces each component's styles automatically, so the two files' identical class names never conflict or leak into each other.)

- [ ] **Step 5: Verify and commit**

```bash
npm run typecheck && npm run build
```
Expected: both pass with 0 errors.

Live browser check at ~390px: open an existing item's detail page — confirm the photo renders full-width above the details (not squashed to a sliver), the title doesn't clip, the value/storage blocks stack, the thumbnail strip (if the item has 2+ photos) reflows sensibly; click EDIT ENTRY and confirm every edit field (including STORAGE LOCATION and APPROX. VALUE) is reachable by scrolling; open the link picker and confirm its modal fits within the screen width. Open Add Item, pick Rocket Motor, confirm DIAMETER/QUANTITY/etc. are all reachable by scrolling; pick Model Rocket Part, confirm MATERIAL is reachable too. Confirm all of the above still look identical to before at ~1440px.

```bash
git add "app/pages/items/[id].vue" app/pages/items/new.vue app/components/CategoryFieldsForm.vue
git commit -m "Make Item Detail and Add Item field grids responsive below 768px"
```

---

## Task 6: End-to-end live verification

**USER-ORDERED GATE — NON-SKIPPABLE.** This project requires live verification of every shipped feature before merge, established across every prior phase without exception. Close only after an actual browser walkthrough has been run, with real captured output — not a code-only review.

**Goal:** Prove every page works correctly at both desktop (~1440px) and mobile (~390px) widths, with no regressions, closing out the full mobile-responsiveness phase.

**Files:** none (verification only)

**Acceptance Criteria:**
- [ ] At ~390px, every page's `document.documentElement.scrollWidth` does not exceed the viewport width (no horizontal page scroll anywhere): Dashboard, Browse, Motors, Storage, Search, Add Item, Item Detail (view and edit mode)
- [ ] At ~390px, the bottom tab bar is present and every destination (Dashboard/Browse/Motors/Storage/Search/+) navigates correctly and highlights the active one
- [ ] At ~390px, the header's SEARCH toggle and ACCT sheet both work end-to-end (search returns real results and navigates; sign out works)
- [ ] At ~390px, Motors shows the card-list view with working filters (impulse class + cert status, individually and combined)
- [ ] At ~390px, Add Item is fully usable for at least 2 categories (all fields reachable, category picked, item saved successfully)
- [ ] At ~390px, Item Detail is fully usable in both view and edit mode (all fields reachable, edit saves successfully)
- [ ] At ~390px, Storage (unmodified in this phase) still works correctly — regression check
- [ ] At ~1440px, every page above is pixel-equivalent to its pre-phase appearance (no unintended desktop regressions)
- [ ] `npm run typecheck && npm run build` both pass

**Verify:** manual UI walkthrough at both widths across every page listed above, using a dedicated test account; `npm run typecheck && npm run build`.

```json:metadata
{"files": [], "verifyCommand": "manual UI walkthrough at 390px and 1440px; npm run typecheck && npm run build", "acceptanceCriteria": ["no horizontal scroll on any page at 390px", "bottom bar fully functional", "header search + account sheet functional on mobile", "motors card list + filters functional on mobile", "add item usable end-to-end on mobile for 2+ categories", "item detail view+edit usable end-to-end on mobile", "storage regression-checked", "desktop pixel-equivalent to before", "typecheck and build pass"], "modelTier": "standard", "userGate": true, "tags": ["user-gate"]}
```

**Steps:**

- [ ] **Step 1: Static verification**

```bash
npm run typecheck && npm run build
```
Expected: both pass with 0 errors.

- [ ] **Step 2: Live walkthrough**

Using a dedicated test account (create a fresh one via the app's normal signup flow if you don't already have real collection data to test with — this is a REAL production Neon database with real users; never touch any existing real account's data), start the dev server and, at both ~390px and ~1440px browser widths:

1. Sign in, land on Dashboard — check for horizontal scroll, check the category/recent grids reflow correctly on mobile, check the two-column bottom row stacks on mobile.
2. Navigate via the bottom bar (mobile) / top nav (desktop) to Browse — check the filter sidebar stacks above results on mobile, check no horizontal scroll.
3. Navigate to Motors — check the card list + FILTERS toggle work on mobile (toggle an impulse class, toggle a cert status, confirm the list actually filters), check the table still works identically on desktop.
4. Navigate to Storage — confirm it still works (this page wasn't touched this phase; regression check only).
5. Use search (header icon on mobile, header box on desktop) — confirm results appear and clicking one navigates correctly.
6. Add a new item via Add Item for 2 different categories (e.g. Rocket Motor and Model Rocket Part) — confirm every field is reachable and the item saves successfully on both mobile and desktop.
7. Open the new item's detail page — confirm the layout stacks correctly on mobile (photo above details), open edit mode, confirm every field (including Storage Location and Approx. Value) is reachable, save a change successfully.
8. Open the link picker on an item detail page at mobile width — confirm the modal fits within the screen.
9. On mobile, open the ACCT sheet and confirm Sign out works.

- [ ] **Step 3: Report and close**

Record the actual observed result for each acceptance criterion above (not an assumption). If anything fails, do not close this task — fix it (re-dispatch the relevant earlier task's implementer with the specific failure) and re-verify before closing.

---

## Plan self-review

**Spec coverage:** Every section of `docs/superpowers/specs/2026-08-23-mobile-responsiveness-design.md` maps to a task — breakpoint/mechanism (Task 1 + architecture note), header/bottom-bar (Task 2), Motors card list (Task 3), Dashboard/Browse/Search (Task 4), Item Detail/Add Item/CategoryFieldsForm (Task 5), cross-cutting placeholder/chevron fixes (Task 1), tap-target/text-size bumps (folded into Tasks 2/3/4 wherever the audit specifically measured a violation — header nav, Motors filter buttons, Browse filter buttons — rather than a separate task, since it has no dedicated file of its own), verification (Task 6). The Item Detail "RELATED IN COLLECTION" 3-column relationship diagram and its already-proportional (non-fixed-px) columns are explicitly left unmodified — out of the spec's named scope, and not observed to force horizontal overflow on its own.

**Placeholder scan:** No TBD/TODO; every step has complete, literal code.

**Type consistency:** Class names (`rt-desktop-only`, `rt-mobile-only`, `rt-additem-grid`, etc.) are used identically everywhere they're defined and referenced. `rt-additem-grid` is intentionally defined independently in two separate scoped components (`new.vue`, `CategoryFieldsForm.vue`) — called out explicitly in Task 5 so it isn't mistaken for a bug.
