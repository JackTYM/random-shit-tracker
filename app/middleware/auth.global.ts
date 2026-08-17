export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path === '/login') return;

  // Deliberate Phase 1 trade-off, not a hard technical limit: the browser-oriented
  // useAuth() has no session on the server, but @neondatabase/auth/server does
  // export a framework-agnostic RequestContext (Hono-compatible, so usable from
  // Nitro's H3) that could validate sessions server-side — it just needs a
  // cookieSecret, a signed session cookie, and a custom RequestContext adapter
  // we haven't built. Safe for now because no protected data is ever SSR'd here;
  // all real data access goes through the Neon Data API from the client, which
  // enforces its own RLS regardless of this middleware. If SSR ever needs real
  // user data, build server-side session validation first. Known cost: reloading
  // while signed in causes a real Vue hydration mismatch (SSR renders logged-out,
  // client corrects post-hydration), not just a cosmetic warning.
  if (import.meta.server) return;

  const { session, refresh } = useAuth();
  if (session.value === null) {
    await refresh();
  }
  if (!session.value?.user) {
    return navigateTo('/login');
  }
});
