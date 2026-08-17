<script setup lang="ts">
const { session, signOut } = useAuth();

async function handleSignOut() {
  await signOut();
  await navigateTo('/login');
}
</script>

<template>
  <main style="max-width: 1440px; margin: 0 auto; padding: 28px">
    <p style="font: 500 11px 'JetBrains Mono', monospace; letter-spacing: 0.08em; color: rgba(22,34,76,0.65)">
      Signed in as {{ session?.user?.email }}
    </p>
    <button
      type="button"
      style="border: 1px solid var(--color-navy); background: transparent; cursor: pointer; padding: 8px 12px; font: 600 11px 'Archivo', sans-serif; letter-spacing: 0.06em"
      @click="handleSignOut"
    >
      Sign out
    </button>
    <p style="margin-top: 24px; font-size: 13px; color: rgba(22,34,76,0.6)">
      Dashboard, browse, and item pages ship in Phase 2.
    </p>
  </main>
</template>
