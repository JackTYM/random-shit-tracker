// The Neon Auth SDK supports a one-time `neon_auth_session_verifier` URL param (set
// after an OAuth redirect) to force a fresh, uncached getSession() read. In this
// deployment it has consistently failed with a 400 on every attempt -- observed
// across multiple independent getSession() calls all sent with the same verifier
// value, none of which ever succeeded -- while the underlying session cookie set by
// the OAuth callback is already valid on its own (confirmed by the account name
// rendering correctly even when every verifier-based call failed). Rather than keep
// racing/retrying a token that never works, strip it from the URL before any code
// gets a chance to read `window.location.search`, so every getSession() call just
// falls back to the normal cookie-based session check, which already works.
export default defineNuxtPlugin(() => {
  if (!window.location.search.includes('neon_auth_session_verifier')) return;
  const url = new URL(window.location.href);
  url.searchParams.delete('neon_auth_session_verifier');
  window.history.replaceState(window.history.state, '', url.href);
});
