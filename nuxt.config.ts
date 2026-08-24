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
      // Explicitly `null` (not simply omitted) — @vite-pwa/nuxt defaults `navigateFallback` to
      // the app's baseURL ("/") whenever the key is absent from this object entirely, which
      // would silently reintroduce the exact bug described below (just bound to "/" instead of
      // "/offline"). Setting it to a falsy value here both satisfies @vite-pwa/nuxt's
      // `"navigateFallback" in options.workbox` presence check (so it won't inject its own
      // default) and workbox-build's own `if (navigateFallback)` template guard (so no
      // NavigationRoute is generated at all).
      //
      // NOTE: deliberately NOT using `navigateFallback` here. It registers a Workbox
      // NavigationRoute with the default allowlist ([/./], i.e. "match every navigation"),
      // whose handler (createHandlerBoundToURL) is a precache-only lookup that never attempts
      // a network fetch. For an SSR app that means EVERY page navigation — even while fully
      // online — would be answered with the precached /offline shell instead of the real
      // server-rendered page. Confirmed empirically: with this service worker active and the
      // network fully up, reloading /login rendered the offline.html fallback text, not the
      // real login page. Instead, the `runtimeCaching` entry below matches navigation requests
      // explicitly with `NetworkOnly` + `precacheFallback`, which always tries the network
      // first and only serves the precached /offline page if that fetch genuinely fails.
      //
      // Explicit glob (not the module's default) because this project's SSR `cloudflare_module`
      // nitro preset doesn't auto-enable shell precaching the way static/prerendered builds do —
      // without this, the service worker would only precache build-metadata JSON, not the actual
      // app JS/CSS/HTML. Includes `html` so `offline.html` (the precacheFallback target below)
      // is actually precached — `precacheFallback` throws if its target isn't precached.
      navigateFallback: null,
      globPatterns: ['**/*.{js,css,html}'],
      runtimeCaching: [
        {
          urlPattern: ({ request }) => request.mode === 'navigate',
          handler: 'NetworkOnly',
          options: {
            precacheFallback: { fallbackURL: '/offline' },
          },
        },
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
