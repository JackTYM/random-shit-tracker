import { jwtVerify, createRemoteJWKSet } from 'jose';
import type { H3Event } from 'h3';

let _jwks: ReturnType<typeof createRemoteJWKSet> | null = null;
let _issuer: string | null = null;

export async function requireUserId(event: H3Event): Promise<string> {
  const authHeader = getHeader(event, 'authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw createError({ statusCode: 401, statusMessage: 'Missing bearer token' });
  }
  const token = authHeader.slice('Bearer '.length);

  if (!_jwks || !_issuer) {
    const config = useRuntimeConfig(event);
    _jwks = createRemoteJWKSet(new URL(`${config.public.neonAuthUrl}/.well-known/jwks.json`));
    // Neon Auth issues tokens with iss/aud set to the auth server's origin.
    _issuer = new URL(config.public.neonAuthUrl).origin;
  }

  try {
    const { payload } = await jwtVerify(token, _jwks, { issuer: _issuer, audience: _issuer });
    if (!payload.sub) throw new Error('missing sub claim');
    return payload.sub;
  } catch (err) {
    console.error('[requireUserId] JWT verification failed:', err);
    throw createError({ statusCode: 401, statusMessage: 'Invalid token' });
  }
}
