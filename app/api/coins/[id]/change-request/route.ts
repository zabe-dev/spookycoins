import { apiError, apiSuccess } from '@/lib/api/responses';
import { db } from '@/lib/db/client';
import { changeRequests, coins } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

type RouteContext = { params: Promise<{ id: string }> };

const requestSchema = z.object({
  changeType: z.string().trim().min(2).max(80),
  requestedChanges: z.string().trim().min(10).max(2000),
  evidenceUrl: z
    .string()
    .trim()
    .max(300)
    .optional()
    .transform((value) => value || '')
    .pipe(z.union([z.literal(''), z.string().url('Use a valid supporting link.')])),
  email: z.string().trim().email('Use a valid contact email.').max(254),
});

const requestAttempts = new Map<string, number[]>();
const rateLimitWindowMs = 60_000;
const maxRequestsPerWindow = 8;

export async function POST(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const coinId = Number(id);
  if (!Number.isSafeInteger(coinId) || coinId < 1) {
    return apiError('INVALID_COIN_ID', 'Coin not found.', 404);
  }

  const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (isRateLimited(`${coinId}:${ipAddress}`)) {
    return apiError('RATE_LIMITED', 'Too many requests. Please slow down.', 429);
  }

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return apiError(
      'INVALID_CHANGE_REQUEST',
      parsed.error.issues[0]?.message || 'Check the request details and try again.',
      400,
    );
  }

  const [coin] = await db.select({ id: coins.id }).from(coins).where(eq(coins.id, coinId)).limit(1);
  if (!coin) return apiError('COIN_NOT_FOUND', 'Coin not found.', 404);

  await db.insert(changeRequests).values({
    coinId,
    requesterEmail: parsed.data.email,
    requestedChanges: `[${parsed.data.changeType}] ${parsed.data.requestedChanges}`,
    evidenceUrl: parsed.data.evidenceUrl || null,
    status: 'pending',
  });

  return apiSuccess({ coinId }, 'Request sent for admin review.');
}

function isRateLimited(key: string) {
  const now = Date.now();
  const activeAttempts = (requestAttempts.get(key) || []).filter(
    (timestamp) => now - timestamp < rateLimitWindowMs,
  );
  requestAttempts.set(key, [...activeAttempts, now]);
  return activeAttempts.length >= maxRequestsPerWindow;
}
