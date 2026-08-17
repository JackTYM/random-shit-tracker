import { createClient } from '@neondatabase/neon-js';

let _client: ReturnType<typeof createClient> | null = null;

export function useNeonClient() {
  if (!_client) {
    const config = useRuntimeConfig();
    _client = createClient(config.public.neonBaseUrl);
  }
  return _client;
}
