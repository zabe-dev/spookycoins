import { auth } from '@/lib/auth/server';
import { apiError, apiSuccess } from '@/lib/api/responses';
import { db } from '@/lib/db/client';
import { coinSubmissions } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { z } from 'zod';

const requestSchema = z
  .object({
    action: z.enum(['edit', 'delete']),
    details: z.string().trim().max(2000).optional(),
  })
  .refine((value) => value.action !== 'edit' || Boolean(value.details), {
    message: 'Describe the requested edit.',
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
    .where(and(eq(coinSubmissions.id, id), eq(coinSubmissions.requesterEmail, session.user.email)))
    .limit(1);
  if (!owned) return apiError('SUBMISSION_NOT_FOUND', 'Submission not found.', 404);

  await db.insert(coinSubmissions).values({
    coinId: owned.coinId,
    requesterEmail: session.user.email,
    requesterTelegram: owned.requesterTelegram,
    submissionType: parsed.data.action === 'edit' ? 'edit-request' : 'delete-request',
    status: 'pending',
    coinData: {
      sourceSubmissionId: owned.id,
      requestedChanges: parsed.data.details || 'Delete this coin listing.',
    },
  });
  return apiSuccess({ id: owned.id }, 'Request sent for review.');
}
