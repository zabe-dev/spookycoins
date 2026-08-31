import { auth } from '@/lib/auth/server';
import { apiError, apiSuccess } from '@/lib/api/responses';
import { db } from '@/lib/db/client';
import { coins, coinSubmissions } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { z } from 'zod';

const requestSchema = z.object({
  action: z.literal('delete'),
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return apiError('AUTH_REQUIRED', 'Sign in required.', 401);
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return apiError('INVALID_REQUEST', parsed.error.issues[0]?.message || 'Invalid request.', 400);

  const { id } = await context.params;
  const [owned] = await db
    .select()
    .from(coinSubmissions)
    .where(
      and(
        eq(coinSubmissions.id, id),
        eq(coinSubmissions.requesterEmail, session.user.email),
        eq(coinSubmissions.submissionType, 'new-coin'),
      ),
    )
    .limit(1);
  if (!owned) return apiError('SUBMISSION_NOT_FOUND', 'Submission not found.', 404);

  const scheduledDeleteAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await db.transaction(async (tx) => {
    if (owned.coinId) {
      await tx
        .update(coins)
        .set({ listingStatus: 'suspended', updatedAt: new Date() })
        .where(eq(coins.id, owned.coinId));
    }

    await tx.insert(coinSubmissions).values({
      coinId: owned.coinId,
      requesterEmail: session.user.email,
      requesterTelegram: owned.requesterTelegram,
      submissionType: 'delete-request',
      status: 'pending',
      coinData: {
        sourceSubmissionId: owned.id,
        requestedChanges: 'Delete this coin listing.',
        scheduledDeleteAt: scheduledDeleteAt.toISOString(),
      },
    });
  });
  return apiSuccess(
    { id: owned.id, scheduledDeleteAt: scheduledDeleteAt.toISOString() },
    'Deletion request sent.',
  );
}
