export function useAuth() {
  const client = useNeonClient();
  const session = useState<{ user: Record<string, any>; session: Record<string, any> } | null>(
    'neon-auth-session',
    () => null,
  );
  const pending = useState('neon-auth-pending', () => true);
  // Shared across concurrent refresh() callers (e.g. the global middleware's SSR and
  // client-side hydration passes) so a second caller awaits the first's in-flight
  // request instead of firing its own. Without this, two getSession() calls landing
  // close together right after an OAuth redirect can both read the one-time
  // `neon_auth_session_verifier` URL param before either's success handler strips it,
  // so the second request sends an already-consumed verifier and gets a 400.
  const refreshPromise = useState<Promise<void> | null>('neon-auth-refresh-promise', () => null);

  async function refresh() {
    if (refreshPromise.value) return refreshPromise.value;
    refreshPromise.value = (async () => {
      try {
        const { data } = await client.auth.getSession();
        session.value = data ?? null;
      } catch (err) {
        // A getSession() call made while a one-time `neon_auth_session_verifier` is
        // still in the URL can fail (e.g. if something else already consumed it -- see
        // the dedup comment above). The verifier is single-use, so retrying it won't
        // help; strip it and fall back to a normal cookie-based session check, which
        // succeeds if the server-side OAuth exchange actually completed. Without this,
        // an uncaught rejection here crashes app init (Nuxt's app:error / NUXT_E1005)
        // and leaves `pending` stuck at true forever.
        const hasVerifier = typeof window !== 'undefined' && window.location.search.includes('neon_auth_session_verifier');
        if (hasVerifier) {
          const url = new URL(window.location.href);
          url.searchParams.delete('neon_auth_session_verifier');
          window.history.replaceState(window.history.state, '', url.href);
          try {
            const { data } = await client.auth.getSession();
            session.value = data ?? null;
          } catch {
            session.value = null;
          }
        } else {
          session.value = null;
        }
      } finally {
        pending.value = false;
      }
    })();
    try {
      await refreshPromise.value;
    } finally {
      refreshPromise.value = null;
    }
  }

  async function signInEmail(email: string, password: string) {
    const result = await client.auth.signIn.email({ email, password });
    await refresh();
    return result;
  }

  async function signUpEmail(email: string, password: string, name: string) {
    const result = await client.auth.signUp.email({ email, password, name });
    await refresh();
    return result;
  }

  async function signInGoogle() {
    await client.auth.signIn.social({ provider: 'google', callbackURL: window.location.origin });
  }

  async function signOut() {
    await client.auth.signOut();
    session.value = null;
  }

  return {
    session,
    pending,
    isLoggedIn: computed(() => !!session.value?.user),
    refresh,
    signInEmail,
    signUpEmail,
    signInGoogle,
    signOut,
  };
}
