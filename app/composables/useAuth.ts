export function useAuth() {
  const client = useNeonClient();
  const session = useState<{ user: Record<string, any>; session: Record<string, any> } | null>(
    'neon-auth-session',
    () => null,
  );
  const pending = useState('neon-auth-pending', () => true);

  async function refresh() {
    const { data } = await client.auth.getSession();
    session.value = data ?? null;
    pending.value = false;
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
