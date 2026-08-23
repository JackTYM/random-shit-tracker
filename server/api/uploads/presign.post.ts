import { createR2Client, r2ObjectUrl, sanitizeFilename } from '../../utils/r2';
import { requireUserId } from '../../utils/verifyAuth';

const ALLOWED_CONTENT_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event);
  const body = await readBody<{ filename: string; contentType: string }>(event);
  if (typeof body?.filename !== 'string' || !body.filename || typeof body?.contentType !== 'string' || !body.contentType) {
    throw createError({ statusCode: 400, statusMessage: 'filename and contentType are required' });
  }
  if (!ALLOWED_CONTENT_TYPES.has(body.contentType)) {
    throw createError({ statusCode: 400, statusMessage: 'Unsupported content type' });
  }

  const config = useRuntimeConfig(event);
  const key = `${userId}/${crypto.randomUUID()}-${sanitizeFilename(body.filename)}`;
  const objectUrl = r2ObjectUrl(config.r2AccountId, config.r2Bucket, key);

  const client = createR2Client(config.r2AccessKeyId, config.r2SecretAccessKey);
  // allHeaders: true is load-bearing for security. aws4fetch treats content-type as an
  // "unsignable" header by default, so without it X-Amz-SignedHeaders is just "host" and the
  // content-type checked above is purely advisory — the client could presign as image/png and
  // then PUT with Content-Type: text/html, and R2 would store and serve it as HTML. With
  // allHeaders, content-type is part of the signature and R2 itself rejects any mismatched PUT.
  const signed = await client.sign(
    new Request(objectUrl, { method: 'PUT', headers: { 'content-type': body.contentType } }),
    { aws: { signQuery: true, allHeaders: true } },
  );

  return {
    uploadUrl: signed.url,
    publicUrl: `${config.public.r2PublicBaseUrl}/${key}`,
    key,
    // The PUT must send exactly this value or the signature will not match.
    contentType: body.contentType,
  };
});
