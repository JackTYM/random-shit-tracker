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
  // Force a same-origin browser request to carry the Origin header a genuine cross-origin
  // request to Neon would have had. WebKit omits Origin on same-origin GET fetches (there's
  // nothing cross-site to declare), so whatever the browser sent here is unreliable. Setting
  // it explicitly to our own app origin matches what a direct cross-origin request from this
  // app would have sent and what Neon's trusted_origins config expects.
  headers.set('origin', url.origin);

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
    // Strip Domain (so the cookie defaults to the host that actually served this response
    // -- our domain -- instead of the upstream one, which the browser would otherwise
    // reject as not matching the responding host) AND SameSite=None + Partitioned. Those
    // two only exist to make a cookie usable cross-site at all; a cookie relayed through
    // our own same-origin proxy is now genuinely first-party and doesn't need them.
    responseHeaders.append(
      'set-cookie',
      cookie
        .replace(/;\s*Domain=[^;]+/i, '')
        .replace(/;\s*SameSite=None/i, '; SameSite=Lax')
        .replace(/;\s*Partitioned/i, ''),
    );
  }

  return new Response(upstreamRes.body, {
    status: upstreamRes.status,
    statusText: upstreamRes.statusText,
    headers: responseHeaders,
  });
});
