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
      const { data } = await client.auth.getSession();
      session.value = data ?? null;
      pending.value = false;
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
