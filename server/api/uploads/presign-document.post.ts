import { createR2Client, r2ObjectUrl } from '../../utils/r2';
import { requireUserId } from '../../utils/verifyAuth';

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event);
  const body = await readBody<{ filename: string; contentType: string }>(event);
  if (!body?.filename || !body?.contentType) {
    throw createError({ statusCode: 400, statusMessage: 'filename and contentType are required' });
  }

  const config = useRuntimeConfig(event);
  const key = `${userId}/documents/${crypto.randomUUID()}-${body.filename}`;
  const objectUrl = r2ObjectUrl(config.r2AccountId, config.r2Bucket, key);

  const client = createR2Client(config.r2AccessKeyId, config.r2SecretAccessKey);
  const signed = await client.sign(
    new Request(objectUrl, { method: 'PUT', headers: { 'content-type': body.contentType } }),
    { aws: { signQuery: true } },
  );

  return {
    uploadUrl: signed.url,
    publicUrl: `${config.public.r2PublicBaseUrl}/${key}`,
    key,
  };
});
