import { AwsClient } from 'aws4fetch';

export function createR2Client(accessKeyId: string, secretAccessKey: string) {
  return new AwsClient({
    accessKeyId,
    secretAccessKey,
    service: 's3',
    region: 'auto',
  });
}

export function r2ObjectUrl(accountId: string, bucket: string, key: string) {
  return `https://${accountId}.r2.cloudflarestorage.com/${bucket}/${key}`;
}

// Strips any directory components and unsafe characters so a client-supplied filename can never
// introduce a path segment (e.g. "../../other-user-id/x.png") into an R2 key built by string concatenation.
export function sanitizeFilename(filename: string): string {
  const basename = filename.split(/[/\\]/).pop() ?? '';
  const cleaned = basename.replace(/[^A-Za-z0-9._-]/g, '_').replace(/^\.+/, '');
  return cleaned.slice(0, 200) || 'file';
}
