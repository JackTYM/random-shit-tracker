import { createClient } from '@neondatabase/neon-js';

// WARNING: this is a module-level singleton, which is safe ONLY because no code path
// currently calls stateful auth methods (getSession, signIn, etc.) during SSR — the
// global middleware bails via `import.meta.server` before reaching useAuth()'s refresh().
// Cloudflare Workers reuse isolates across many users' requests without resetting module
// scope, so if a future change ever calls an auth method server-side, this singleton's
// internal session cache could leak session data across users sharing an isolate. Before
// adding any SSR-side auth call, this needs to become per-request state instead.
let _client: ReturnType<typeof createClient> | null = null;

export function useNeonClient() {
  if (!_client) {
    const config = useRuntimeConfig();
    // The underlying better-auth client validates its auth URL at construction time via
    // `new URL(url)` with no base — a bare relative '/auth' throws ("Invalid base URL")
    // unconditionally, client-side included. (Confirmed against a working reference
    // implementation's own code comment: "the SDK requires an absolute URL, so resolve it
    // against the current origin here rather than baking a fixed domain in at build time.")
    // So both branches need a real absolute URL: server-side from the current request's
    // own origin, client-side from window.location.
    const authUrl = import.meta.server
      ? `${useRequestURL().origin}/auth`
      : new URL('/auth', window.location.origin).toString();
    _client = createClient({
      // Same-origin proxy (server/routes/auth/[...path].ts) instead of Neon's own auth
      // domain directly -- see that file's comment for why. The Data API doesn't need
      // this: it authenticates via an explicit `Authorization: Bearer <jwt>` header, not
      // a browser-managed cookie, so it isn't subject to the same cross-site restrictions
      // and can keep talking to Neon's own domain directly.
      auth: { url: authUrl },
      dataApi: { url: config.public.neonDataApiUrl },
    });
  }
  return _client;
}
