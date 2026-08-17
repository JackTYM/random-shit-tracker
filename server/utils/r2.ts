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
