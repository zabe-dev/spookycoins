import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

type StoredObject = {
  key: string;
  url: string;
};

const bucketEnvKeys = [
  'AWS_BUCKET_NAME',
  'AWS_S3_BUCKET',
  'AWS_S3_BUCKET_NAME',
  'S3_BUCKET',
  'S3_BUCKET_NAME',
  'PROJECT_LOGO_BUCKET',
  'SUBMISSION_LOGO_BUCKET',
];

const publicUrlEnvKeys = [
  'AWS_S3_PUBLIC_URL',
  'S3_PUBLIC_URL',
  'PROJECT_LOGO_PUBLIC_URL',
  'SUBMISSION_LOGO_PUBLIC_URL',
];

export async function uploadSubmissionLogo(logo: {
  name: string;
  mimeType: 'image/png' | 'image/jpeg' | 'image/webp';
  dataUrl: string;
}): Promise<StoredObject> {
  const storage = getS3Config();
  const body = dataUrlToBuffer(logo.dataUrl, logo.mimeType);
  const extension = extensionForMime(logo.mimeType);
  const key = `submissions/logos/${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${extension}`;

  await storage.client.send(
    new PutObjectCommand({
      Bucket: storage.bucket,
      Key: key,
      Body: body,
      ContentType: logo.mimeType,
    }),
  );

  return {
    key,
    url: publicObjectUrl(storage.publicBaseUrl || storage.endpoint, storage.bucket, key),
  };
}

function getS3Config() {
  const endpoint = process.env.AWS_ENDPOINT_URL_S3 || process.env.S3_ENDPOINT_URL;
  const region = process.env.AWS_REGION || 'us-east-1';
  const bucket = firstEnvValue(bucketEnvKeys);
  const publicBaseUrl = firstEnvValue(publicUrlEnvKeys);

  if (!endpoint || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    throw new Error('S3 storage is not configured.');
  }
  if (!bucket) {
    throw new Error('S3 bucket is not configured.');
  }

  return {
    endpoint: trimTrailingSlash(endpoint),
    bucket,
    publicBaseUrl: publicBaseUrl ? trimTrailingSlash(publicBaseUrl) : '',
    client: new S3Client({
      endpoint,
      region,
      forcePathStyle: true,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    }),
  };
}

function dataUrlToBuffer(dataUrl: string, mimeType: string) {
  const prefix = `data:${mimeType};base64,`;
  if (!dataUrl.startsWith(prefix)) throw new Error('Invalid logo data.');
  return Buffer.from(dataUrl.slice(prefix.length), 'base64');
}

function publicObjectUrl(baseUrl: string, bucket: string, key: string) {
  const url = new URL(`${trimTrailingSlash(baseUrl)}/`);
  url.pathname = joinPath(url.pathname, bucket, key);
  return url.toString();
}

function joinPath(...parts: string[]) {
  return `/${parts
    .map((part) => part.replace(/^\/+|\/+$/g, ''))
    .filter(Boolean)
    .join('/')}`;
}

function firstEnvValue(keys: string[]) {
  return keys.map((key) => process.env[key]).find(Boolean) || '';
}

function extensionForMime(mimeType: string) {
  if (mimeType === 'image/jpeg') return 'jpg';
  if (mimeType === 'image/webp') return 'webp';
  return 'png';
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/g, '');
}
