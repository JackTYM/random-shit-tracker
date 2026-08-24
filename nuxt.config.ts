// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@vite-pwa/nuxt'],
  nitro: {
    preset: 'cloudflare_module',
  },
  runtimeConfig: {
    r2AccountId: '',
    r2AccessKeyId: '',
    r2SecretAccessKey: '',
    r2Bucket: '',
    public: {
      neonBaseUrl: '',
      neonAuthUrl: '',
      neonDataApiUrl: '',
      r2PublicBaseUrl: '',
    },
  },
  app: {
    head: {
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: 'anonymous' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&family=Archivo+Black&family=JetBrains+Mono:wght@400;500;700&display=swap',
        },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon-180x180.png' },
      ],
      meta: [
        { name: 'theme-color', content: '#16224C' },
      ],
    },
  },
  css: ['~/assets/css/tokens.css', '~/assets/css/main.css'],
  pwa: {
    registerType: 'autoUpdate',
    includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png'],
    manifest: {
      name: 'RandomShitTracker',
      short_name: 'RST',
      theme_color: '#16224C',
      background_color: '#F5F1E8',
      display: 'standalone',
      start_url: '/',
      scope: '/',
      icons: [
        { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    workbox: {
      // @vite-pwa/nuxt's default (non-dev) manifestTransform strips the `.html` extension off
      // every precached HTML entry (offline.html -> "offline"), to mirror how prerendered/static
      // Nuxt builds serve clean URLs. navigateFallback must match that transformed precache key
      // (not the on-disk filename), or createHandlerBoundToURL's cache lookup misses entirely.
      navigateFallback: '/offline',
      // Explicit glob (not the module's default) because this project's SSR `cloudflare_module`
      // nitro preset doesn't auto-enable shell precaching the way static/prerendered builds do —
      // without this, the service worker would only precache build-metadata JSON, not the actual
      // app JS/CSS/HTML. Includes `html` so `offline.html` (the navigateFallback target above)
      // is actually precached — Workbox's navigateFallback throws if its target isn't precached,
      // which silently prevents ALL subsequent registerRoute calls (including the two
      // network-only runtime-caching rules below) from ever registering.
      globPatterns: ['**/*.{js,css,html}'],
      runtimeCaching: [
        {
          urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
          handler: 'NetworkOnly',
        },
        {
          urlPattern: ({ url }) => url.hostname.endsWith('.neon.tech'),
          handler: 'NetworkOnly',
        },
      ],
    },
  },
});
