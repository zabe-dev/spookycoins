import { apiError, apiSuccess } from '@/lib/api/responses';
import { db } from '@/lib/db/client';
import { mailingListSubscribers } from '@/lib/db/schema';
import { getClientIp } from '@/lib/http/client-ip';
import { sql } from 'drizzle-orm';
import { headers } from 'next/headers';
import { z } from 'zod';

const subscribeSchema = z.object({
  email: z.string().trim().email('Use a valid email address.').max(254),
  source: z.string().trim().max(80).optional(),
});

const rateLimitWindowMs = 60_000;
const maxRequestsPerWindow = 6;
const subscribeAttempts = new Map<string, number[]>();

export async function POST(request: Request) {
  const requestHeaders = await headers();
  const ipAddress = getClientIp(requestHeaders) || 'unknown';

  if (isRateLimited(ipAddress)) {
    return apiError('RATE_LIMITED', 'Too many attempts. Please try again in a minute.', 429);
  }

  const parsed = subscribeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return apiError(
      'INVALID_EMAIL',
      parsed.error.issues[0]?.message || 'Use a valid email address.',
      400,
    );
  }

  const email = parsed.data.email.toLowerCase();
  const source = parsed.data.source || 'homepage';

  await db
    .insert(mailingListSubscribers)
    .values({
      email,
      source,
      status: 'subscribed',
      subscribedAt: new Date(),
      unsubscribedAt: null,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: mailingListSubscribers.email,
      set: {
        source,
        status: 'subscribed',
        subscribedAt: sql`now()`,
        unsubscribedAt: null,
        updatedAt: sql`now()`,
      },
    });

  return apiSuccess({ email }, 'You are on the list.');
}

function isRateLimited(key: string) {
  const now = Date.now();
  const activeAttempts = (subscribeAttempts.get(key) || []).filter(
    (timestamp) => now - timestamp < rateLimitWindowMs,
  );
  subscribeAttempts.set(key, [...activeAttempts, now]);
  return activeAttempts.length >= maxRequestsPerWindow;
}
