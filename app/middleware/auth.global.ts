export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path === '/login') return;

  // The Neon Auth SDK is browser-oriented: its cross-origin getSession() call
  // has no access to the session cookie when run server-side during SSR (the
  // SDK only ships SSR cookie-forwarding for Next.js, not Nuxt). Gating on the
  // server would otherwise bounce every signed-in user back to /login on a
  // plain page reload. Skip on the server and let the client-side pass decide.
  if (import.meta.server) return;

  const { session, refresh } = useAuth();
  if (session.value === null) {
    await refresh();
  }
  if (!session.value?.user) {
    return navigateTo('/login');
  }
});
