<template>
  <div class="rt-app-shell" style="min-height: 100vh; background: var(--color-paper); font-family: var(--font-ui); color: var(--color-navy)">
    <AppHeader />
    <slot />
  </div>
</template>

<style scoped>
@media (max-width: 768px) {
  .rt-app-shell {
    padding-bottom: calc(66px + env(safe-area-inset-bottom));
  }
}
</style>
