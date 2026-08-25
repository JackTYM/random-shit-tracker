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
    // createClient validates its auth URL at construction time, and this composable is
    // called unconditionally by useAuth() in components that also render during SSR (e.g.
    // AppHeader.vue) — even though no auth *method* is ever called server-side (see the
    // singleton warning above), the client still gets *constructed* there, so a bare
    // relative '/auth' throws ("Invalid base URL") during SSR. It resolves fine client-side
    // (fetch() resolves relative URLs against the page origin), so only the server needs an
    // absolute one, built from the current request's own origin.
    const authUrl = import.meta.server ? `${useRequestURL().origin}/auth` : '/auth';
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
