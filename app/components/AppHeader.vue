<script setup lang="ts">
const { session, signOut } = useAuth();

const navItems = [
  'Dashboard',
  'Browse',
  'Rocket Motors',
  'Model Airplanes',
  'Rocket Kits',
  'Rocket Parts',
  'Books & Printed',
  'Storage',
];

async function handleSignOut() {
  await signOut();
  await navigateTo('/login');
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
        <template v-for="n in navItems" :key="n">
          <NuxtLink
            v-if="n === 'Browse'"
            to="/browse"
            style="border: 0; cursor: pointer; padding: 7px 11px; font: 600 11px 'Archivo', sans-serif; letter-spacing: 0.09em; text-transform: uppercase; background: transparent; color: var(--color-paper); text-decoration: none"
          >
            {{ n }}
          </NuxtLink>
          <button
            v-else
            disabled
            title="Ships in Phase 2"
            style="border: 0; cursor: not-allowed; opacity: 0.4; padding: 7px 11px; font: 600 11px 'Archivo', sans-serif; letter-spacing: 0.09em; text-transform: uppercase; background: transparent; color: var(--color-paper)"
          >
            {{ n }}
          </button>
        </template>
      </nav>

      <div style="display: flex; align-items: center; gap: 10px; flex: none">
        <input
          disabled
          placeholder="Search the collection…"
          title="Ships in Phase 2"
          style="width: 230px; padding: 8px 11px; border: 1px solid rgba(245,241,232,0.3); background: rgba(245,241,232,0.08); color: var(--color-paper); font-size: 13px"
        />
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
