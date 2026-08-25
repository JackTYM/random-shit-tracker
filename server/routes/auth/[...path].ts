import { toWebRequest } from 'h3';

// Same-origin proxy for Neon Auth. The browser talking directly to Neon's auth host (a
// different domain) makes the session cookie cross-site, which iOS Safari's standalone-PWA
// storage partitioning silently drops -- logins never persist once the app is installed to
// the Home Screen. Proxying through our own domain makes the cookie first-party and
// sidesteps that entirely. Mirrors the pattern already proven working in production on
// another app in this account (myolfactorylab's functions/auth/[[path]].ts).
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  const upstreamBase = config.public.neonAuthUrl;

  const request = toWebRequest(event);
  const url = new URL(request.url);
  const upstreamUrl = `${upstreamBase}${url.pathname.slice('/auth'.length)}${url.search}`;

  const headers = new Headers(request.headers);
  headers.delete('host');

  const upstreamRes = await fetch(upstreamUrl, {
    method: request.method,
    headers,
    body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
    // @ts-expect-error -- duplex is required by undici for streaming request bodies but
    // missing from the RequestInit type this TS lib version ships.
    duplex: ['GET', 'HEAD'].includes(request.method) ? undefined : 'half',
    redirect: 'manual',
  });

  const responseHeaders = new Headers(upstreamRes.headers);
  responseHeaders.delete('set-cookie');
  for (const cookie of upstreamRes.headers.getSetCookie()) {
    // Strip any Domain attribute so the cookie defaults to the host that actually served
    // this response (our domain), not the upstream one -- the browser would otherwise
    // reject a Domain that doesn't match the responding host.
    responseHeaders.append('set-cookie', cookie.replace(/;\s*Domain=[^;]+/i, ''));
  }

  return new Response(upstreamRes.body, {
    status: upstreamRes.status,
    statusText: upstreamRes.statusText,
    headers: responseHeaders,
  });
});
