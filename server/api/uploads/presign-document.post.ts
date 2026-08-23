import { createR2Client, r2ObjectUrl, sanitizeFilename } from '../../utils/r2';
import { requireUserId } from '../../utils/verifyAuth';

// Any real document type is allowed (per design), but these are actively-rendered/executable
// content types that would let an uploaded "document" run as script when served from our domain.
const DANGEROUS_CONTENT_TYPES = new Set([
  'text/html',
  'application/xhtml+xml',
  'image/svg+xml',
  'application/xml',
  'text/xml',
  'application/javascript',
  'text/javascript',
  'application/x-javascript',
]);

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event);
  const body = await readBody<{ filename: string; contentType: string }>(event);
  if (typeof body?.filename !== 'string' || !body.filename || typeof body?.contentType !== 'string' || !body.contentType) {
    throw createError({ statusCode: 400, statusMessage: 'filename and contentType are required' });
  }
  // Compare (and store) only the base media type, ignoring parameters like "; charset=utf-8" —
  // otherwise a trivial parameter suffix bypasses the denylist entirely.
  const baseContentType = (body.contentType.split(';')[0] ?? '').trim().toLowerCase();
  // An input like ";text/html" parses to an empty base type, which is in neither the denylist nor
  // any sane allowlist — reject it rather than letting "not in the set" read as "allowed".
  if (!baseContentType) {
    throw createError({ statusCode: 400, statusMessage: 'Unsupported content type' });
  }
  if (DANGEROUS_CONTENT_TYPES.has(baseContentType)) {
    throw createError({ statusCode: 400, statusMessage: 'Unsupported content type' });
  }

  const config = useRuntimeConfig(event);
  const key = `${userId}/documents/${crypto.randomUUID()}-${sanitizeFilename(body.filename)}`;
  const objectUrl = r2ObjectUrl(config.r2AccountId, config.r2Bucket, key);

  const client = createR2Client(config.r2AccessKeyId, config.r2SecretAccessKey);
  // allHeaders: true is load-bearing for security. aws4fetch treats content-type as an
  // "unsignable" header by default, so without it X-Amz-SignedHeaders is just "host" and the
  // denylist checked above is purely advisory — the client could presign as application/pdf and
  // then PUT with Content-Type: text/html, and R2 would store and serve it as HTML. With
  // allHeaders, content-type is part of the signature and R2 itself rejects any mismatched PUT.
  const signed = await client.sign(
    new Request(objectUrl, { method: 'PUT', headers: { 'content-type': baseContentType } }),
    { aws: { signQuery: true, allHeaders: true } },
  );

  return {
    uploadUrl: signed.url,
    publicUrl: `${config.public.r2PublicBaseUrl}/${key}`,
    key,
    // The PUT must send exactly this normalized value or the signature will not match.
    contentType: baseContentType,
  };
});
