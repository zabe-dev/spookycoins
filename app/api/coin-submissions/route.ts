import { auth } from '@/lib/auth/server';
import { db } from '@/lib/db/client';
import {
  coinSubmissionCategories,
  coinSubmissionContracts,
  coinSubmissionLinks,
  coinSubmissions,
} from '@/lib/db/schema';
import {
  coinSubmissionPayloadSchema,
  type CoinSubmissionPayload,
} from '@/features/submissions/schemas/coin-submission';
import { apiError, apiSuccess } from '@/lib/api/responses';
import { headers } from 'next/headers';
import { uploadSubmissionLogo } from '@/lib/storage/s3';

const maxSubmissionBodyBytes = 3_200_000;
const rateLimitWindowMs = 60_000;
const maxSubmissionsPerWindow = 5;
const submissionAttempts = new Map<string, number[]>();

export async function POST(request: Request) {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) return apiError('AUTH_REQUIRED', 'Sign in required.', 401);

  const contentLength = Number(requestHeaders.get('content-length') || 0);
  if (contentLength > maxSubmissionBodyBytes) {
    return apiError('SUBMISSION_TOO_LARGE', 'Submission is too large.', 413);
  }

  const requesterKey = buildRequesterKey(session.user.id, requestHeaders);
  if (isRateLimited(requesterKey)) {
    return apiError(
      'RATE_LIMITED',
      'Too many submission attempts. Please try again in a minute.',
      429,
    );
  }

  const rawBody = await request.text().catch(() => '');
  if (byteLength(rawBody) > maxSubmissionBodyBytes) {
    return apiError('SUBMISSION_TOO_LARGE', 'Submission is too large.', 413);
  }

  const body = parseJson(rawBody);
  const parsed = coinSubmissionPayloadSchema.safeParse({
    ...(isRecord(body) ? body : {}),
    email: session.user.email,
  });
  if (!parsed.success) {
    return apiError(
      'INVALID_SUBMISSION',
      parsed.error.issues[0]?.message || 'Invalid submission.',
      400,
    );
  }

  const payload = parsed.data;
  const contactEmail = session.user.email;

  const turnstile = await verifyTurnstile(payload.turnstileToken || '', requestHeaders);
  if (!turnstile.ok) {
    return apiError(
      'TURNSTILE_FAILED',
      turnstile.error || 'Bot protection verification failed.',
      400,
    );
  }

  const uploadedLogo = await uploadSubmissionLogo(payload.logo).catch(() => null);
  if (!uploadedLogo) {
    return apiError('LOGO_UPLOAD_FAILED', 'Could not upload the logo. Please try again.', 502);
  }

  const createdId = await db.transaction(async (tx) => {
    const [submission] = await tx
      .insert(coinSubmissions)
      .values({
        submittedByUserId: session.user.id,
        requesterEmail: contactEmail,
        requesterTelegram: payload.telegramContact,
        submissionType: 'new-coin',
        status: 'pending',
        coinData: buildSubmissionData(payload, contactEmail, uploadedLogo),
      })
      .returning({ id: coinSubmissions.id });

    if (!submission) throw new Error('Failed to create submission.');

    await tx.insert(coinSubmissionCategories).values(
      payload.categories.map((category) => ({
        submissionId: submission.id,
        category,
      })),
    );

    await tx.insert(coinSubmissionContracts).values(
      payload.contracts.map((contract, index) => ({
        submissionId: submission.id,
        chain: contract.chain,
        contractAddress: contract.address || null,
        isPrimary: index === 0,
        sortOrder: index,
      })),
    );

    const links = buildSubmissionLinks(payload);
    if (links.length) {
      await tx.insert(coinSubmissionLinks).values(
        links.map((link, index) => ({
          submissionId: submission.id,
          kind: link.kind,
          provider: link.provider || null,
          label: link.label || null,
          url: link.url || '',
          sortOrder: index,
        })),
      );
    }

    return submission.id;
  });

  return apiSuccess({ id: createdId }, 'Project submitted for review.');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function parseJson(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function byteLength(value: string) {
  return new TextEncoder().encode(value).length;
}

function buildRequesterKey(userId: string, requestHeaders: Headers) {
  const ip =
    requestHeaders.get('cf-connecting-ip') ||
    requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown-ip';
  return `${userId}:${ip}`;
}

function isRateLimited(key: string) {
  const now = Date.now();
  const activeAttempts = (submissionAttempts.get(key) || []).filter(
    (timestamp) => now - timestamp < rateLimitWindowMs,
  );
  if (activeAttempts.length >= maxSubmissionsPerWindow) {
    submissionAttempts.set(key, activeAttempts);
    return true;
  }
  submissionAttempts.set(key, [...activeAttempts, now]);
  return false;
}

async function verifyTurnstile(token: string, requestHeaders: Headers) {
  const secret = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;
  if (!secret) return { ok: true };
  if (!token) return { ok: false, error: 'Complete the bot protection check.' };

  const remoteip =
    requestHeaders.get('cf-connecting-ip') ||
    requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim();
  const formData = new FormData();
  formData.append('secret', secret);
  formData.append('response', token);
  if (remoteip) formData.append('remoteip', remoteip);

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    });
    const result = (await response.json().catch(() => null)) as { success?: boolean } | null;
    return result?.success
      ? { ok: true }
      : { ok: false, error: 'Bot protection verification failed.' };
  } catch {
    return { ok: false, error: 'Bot protection verification failed.' };
  }
}

function buildSubmissionData(
  payload: CoinSubmissionPayload,
  contactEmail: string,
  uploadedLogo: { key: string; url: string },
) {
  return {
    logo: {
      name: payload.logo.name,
      mimeType: payload.logo.mimeType,
      width: payload.logo.width,
      height: payload.logo.height,
      key: uploadedLogo.key,
      url: uploadedLogo.url,
    },
    logoUrl: uploadedLogo.url,
    name: payload.name,
    symbol: payload.symbol,
    description: payload.description,
    categories: payload.categories,
    isPresale: payload.isPresale,
    chain: payload.contracts[0]?.chain || '',
    website: payload.website,
    telegram: payload.telegram,
    x: payload.x,
    discord: payload.discord,
    github: payload.github,
    whitepaper: payload.whitepaper,
    contracts: payload.contracts,
    launchDate: payload.launchDate,
    chart: payload.chart,
    dex: payload.dex,
    presale: payload.presale,
    security: {
      kycUrl: payload.kycUrl,
      auditUrl: payload.auditUrl,
    },
    contact: {
      email: contactEmail,
      telegram: payload.telegramContact,
      agreedToTerms: payload.agreedToTerms,
    },
  };
}

function buildSubmissionLinks(payload: CoinSubmissionPayload) {
  return [
    { kind: 'website', url: payload.website, label: 'Website' },
    { kind: 'telegram', url: payload.telegram, label: 'Telegram' },
    { kind: 'x', url: payload.x, label: 'X' },
    { kind: 'discord', url: payload.discord, label: 'Discord' },
    { kind: 'github', url: payload.github, label: 'GitHub' },
    { kind: 'whitepaper', url: payload.whitepaper, label: 'Whitepaper' },
    {
      kind: 'chart',
      provider: payload.chart.provider,
      url: payload.chart.customUrl,
      label: 'Chart link',
    },
    {
      kind: 'dex',
      provider: payload.dex.provider,
      url: payload.dex.customUrl,
      label: 'DEX link',
    },
    ...(payload.isPresale
      ? [
          {
            kind: 'presale-website',
            url: payload.presale.website,
            label: 'Presale website',
          },
          {
            kind: 'kyc',
            url: payload.kycUrl,
            label: 'KYC link',
          },
          {
            kind: 'audit',
            url: payload.auditUrl,
            label: 'Audit report',
          },
        ]
      : [
          {
            kind: 'kyc',
            url: payload.kycUrl,
            label: 'KYC link',
          },
          {
            kind: 'audit',
            url: payload.auditUrl,
            label: 'Audit report',
          },
        ]),
  ].filter((link) => Boolean(link.url));
}
