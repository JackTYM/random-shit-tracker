import { createClient } from '@neondatabase/neon-js';

// WARNING: this is a module-level singleton, which is safe ONLY because no code path
// currently calls stateful auth methods (getSession, signIn, etc.) during SSR — the
// global middleware bails via `import.meta.server` before reaching useAuth()'s refresh().
// Cloudflare Workers reuse isolates across many users' requests without resetting module
// scope, so if a future change ever calls an auth method server-side, this singleton's
// internal session cache could leak session data across users sharing an isolate. Before
// adding any SSR-side auth call, this needs to become per-request state instead.
let _client: ReturnType<typeof createClient> | null = null;

async function fetchDataApiJwt(authUrl: string): Promise<string | null> {
  try {
    const res = await fetch(`${authUrl}/token`, { credentials: 'include' });
    if (!res.ok) return null;
    const { token } = (await res.json()) as { token?: string };
    return token ?? null;
  } catch {
    return null;
  }
}

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

    // The Data API portion of the client above derives its Bearer token via the Neon Auth
    // SDK's internal getJWTToken(), which only trusts a JWT injected from a `set-auth-jwt`
    // response header on a session call -- Neon's real responses never carry that header
    // for this project (confirmed directly against the upstream API), so it always falls
    // back to the plain, non-JWT opaque session token and every Data API call fails with
    // AuthRequiredError. GET /auth/token (proxied same-origin) reliably returns a real,
    // valid JWT, so bypass the SDK's broken internal derivation for the Data API
    // specifically via its documented custom-token-provider mode -- this returns a plain
    // NeonPostgrestClient with no `.auth` of its own, so only its `.from` is grafted onto
    // the auth-integrated client above; every other method (`.auth.*`) is untouched.
    const dataApiClient = createClient({
      dataApi: { url: config.public.neonDataApiUrl, getToken: () => fetchDataApiJwt(authUrl) },
    });
    _client.from = dataApiClient.from.bind(dataApiClient);
  }
  return _client;
}
