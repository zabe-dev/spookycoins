import { createHmac, createHash, randomUUID } from 'crypto';

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
  const url = objectUrl(storage.endpoint, storage.bucket, key);
  const payloadHash = sha256Hex(body);
  const now = new Date();
  const amzDate = isoDate(now);
  const shortDate = amzDate.slice(0, 8);
  const headers = {
    host: url.host,
    'content-type': logo.mimeType,
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': amzDate,
  };
  const authorization = signRequest({
    accessKeyId: storage.accessKeyId,
    secretAccessKey: storage.secretAccessKey,
    region: storage.region,
    method: 'PUT',
    pathname: url.pathname,
    query: url.searchParams.toString(),
    headers,
    payloadHash,
    shortDate,
  });

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      ...headers,
      authorization,
    },
    body,
  });

  if (!response.ok) {
    const message = await response.text().catch(() => '');
    throw new Error(
      `Logo upload failed with status ${response.status}${message ? `: ${message.slice(0, 240)}` : ''}`,
    );
  }

  return {
    key,
    url: publicObjectUrl(storage.publicBaseUrl || storage.endpoint, storage.bucket, key),
  };
}

function getS3Config() {
  const endpoint = process.env.AWS_ENDPOINT_URL_S3 || process.env.S3_ENDPOINT_URL;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const region = process.env.AWS_REGION || 'us-east-1';
  const bucket = firstEnvValue(bucketEnvKeys);
  const publicBaseUrl = firstEnvValue(publicUrlEnvKeys);

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error('S3 storage is not configured.');
  }
  if (!bucket) {
    throw new Error('S3 bucket is not configured.');
  }

  return {
    endpoint: trimTrailingSlash(endpoint),
    accessKeyId,
    secretAccessKey,
    region,
    bucket,
    publicBaseUrl: publicBaseUrl ? trimTrailingSlash(publicBaseUrl) : '',
  };
}

function dataUrlToBuffer(dataUrl: string, mimeType: string) {
  const prefix = `data:${mimeType};base64,`;
  if (!dataUrl.startsWith(prefix)) throw new Error('Invalid logo data.');
  return Buffer.from(dataUrl.slice(prefix.length), 'base64');
}

function objectUrl(endpoint: string, bucket: string, key: string) {
  const base = new URL(`${trimTrailingSlash(endpoint)}/`);
  const pathname = joinPath(base.pathname, bucket, key);
  base.pathname = pathname;
  return base;
}

function publicObjectUrl(baseUrl: string, bucket: string, key: string) {
  return objectUrl(baseUrl, bucket, key).toString();
}

function signRequest({
  accessKeyId,
  secretAccessKey,
  region,
  method,
  pathname,
  query,
  headers,
  payloadHash,
  shortDate,
}: {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  method: string;
  pathname: string;
  query: string;
  headers: Record<string, string>;
  payloadHash: string;
  shortDate: string;
}) {
  const signedHeaders = Object.keys(headers).sort().join(';');
  const canonicalHeaders = Object.keys(headers)
    .sort()
    .map((key) => `${key}:${headers[key].trim()}\n`)
    .join('');
  const scope = `${shortDate}/${region}/s3/aws4_request`;
  const canonicalRequest = [
    method,
    encodePath(pathname),
    query,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n');
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    headers['x-amz-date'],
    scope,
    sha256Hex(canonicalRequest),
  ].join('\n');
  const signature = hmacHex(signingKey(secretAccessKey, shortDate, region), stringToSign);

  return `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
}

function signingKey(secretAccessKey: string, shortDate: string, region: string) {
  const dateKey = hmac(Buffer.from(`AWS4${secretAccessKey}`, 'utf8'), shortDate);
  const dateRegionKey = hmac(dateKey, region);
  const dateRegionServiceKey = hmac(dateRegionKey, 's3');
  return hmac(dateRegionServiceKey, 'aws4_request');
}

function hmac(key: Buffer, value: string) {
  return createHmac('sha256', key).update(value).digest();
}

function hmacHex(key: Buffer, value: string) {
  return createHmac('sha256', key).update(value).digest('hex');
}

function sha256Hex(value: string | Buffer) {
  return createHash('sha256').update(value).digest('hex');
}

function isoDate(date: Date) {
  return date.toISOString().replace(/[:-]|\.\d{3}/g, '');
}

function encodePath(pathname: string) {
  return pathname
    .split('/')
    .map((part) => encodeURIComponent(decodeURIComponent(part)))
    .join('/');
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
