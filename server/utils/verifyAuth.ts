import { jwtVerify, createRemoteJWKSet } from 'jose';
import type { H3Event } from 'h3';

let _jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

export async function requireUserId(event: H3Event): Promise<string> {
  const authHeader = getHeader(event, 'authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw createError({ statusCode: 401, statusMessage: 'Missing bearer token' });
  }
  const token = authHeader.slice('Bearer '.length);

  if (!_jwks) {
    const config = useRuntimeConfig(event);
    _jwks = createRemoteJWKSet(new URL(`${config.public.neonAuthUrl}/.well-known/jwks.json`));
  }

  try {
    const { payload } = await jwtVerify(token, _jwks);
    if (!payload.sub) throw new Error('missing sub claim');
    return payload.sub;
  } catch {
    throw createError({ statusCode: 401, statusMessage: 'Invalid token' });
  }
}
