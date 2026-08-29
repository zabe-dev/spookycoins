import { auth } from '@/lib/auth/server';
import { db } from '@/lib/db/client';
import { coinSubmissions } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
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
  if (!session) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || 'Invalid request.' },
      { status: 400 },
    );

  const { id } = await context.params;
  const [owned] = await db
    .select()
    .from(coinSubmissions)
    .where(and(eq(coinSubmissions.id, id), eq(coinSubmissions.requesterEmail, session.user.email)))
    .limit(1);
  if (!owned) return NextResponse.json({ error: 'Submission not found.' }, { status: 404 });

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
  return NextResponse.json({ ok: true });
}
