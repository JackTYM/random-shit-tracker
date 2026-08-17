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
    _client = createClient(config.public.neonBaseUrl);
  }
  return _client;
}
