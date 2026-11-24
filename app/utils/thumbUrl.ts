// Rewrites a photo URL on the R2 public host into a Cloudflare Image Transformations URL.
// Requires "Image Transformations" to be enabled on the zone. fit=scale-down means the server
// only ever shrinks (never upscales or crops) — CSS object-fit stays in charge of shape.
// URLs on other hosts, or already transformed, are returned unchanged.
export function thumbUrl(url: string, width: number): string {
  const base = useRuntimeConfig().public.r2PublicBaseUrl as string;
  if (!base || !url.startsWith(`${base}/`) || url.includes('/cdn-cgi/image/')) return url;
  const path = url.slice(base.length + 1);
  return `${base}/cdn-cgi/image/width=${width},fit=scale-down,format=auto,quality=80/${path}`;
}
