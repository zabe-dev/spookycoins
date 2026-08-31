import { recordCoinVote } from '@/features/coins/server/interactions';
import { apiError, apiSuccess } from '@/lib/api/responses';
import { auth } from '@/lib/auth/server';
import { headers } from 'next/headers';

type RouteContext = { params: Promise<{ id: string }> };

const voteAttempts = new Map<string, number[]>();
const rateLimitWindowMs = 60_000;
const maxVotesPerWindow = 20;

export async function POST(_request: Request, { params }: RouteContext) {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) return apiError('AUTH_REQUIRED', 'Sign in required.', 401);

  const ipAddress = getIpAddress(requestHeaders);
  if (isRateLimited(`${session.user.id}:${ipAddress || 'unknown'}`)) {
    return apiError('RATE_LIMITED', 'Too many vote attempts. Please slow down.', 429);
  }

  const { id } = await params;
  const coinId = Number(id);
  if (!Number.isSafeInteger(coinId) || coinId < 1) {
    return apiError('INVALID_COIN_ID', 'Coin not found.', 404);
  }

  try {
    const result = await recordCoinVote({
      coinId,
      userId: session.user.id,
      ipAddress,
      userAgent: requestHeaders.get('user-agent'),
    });

    if (!result.ok) {
      return apiError(result.code, result.message, 429);
    }

    return apiSuccess(
      {
        coinId,
        nextVoteAt: result.nextVoteAt,
        summary: result.summary,
      },
      result.message,
    );
  } catch (error) {
    return apiError(
      'VOTE_FAILED',
      error instanceof Error ? error.message : 'Could not record your vote.',
      400,
    );
  }
}

function isRateLimited(key: string) {
  const now = Date.now();
  const activeAttempts = (voteAttempts.get(key) || []).filter(
    (timestamp) => now - timestamp < rateLimitWindowMs,
  );
  voteAttempts.set(key, [...activeAttempts, now]);
  return activeAttempts.length >= maxVotesPerWindow;
}

function getIpAddress(requestHeaders: Headers) {
  return (
    requestHeaders.get('cf-connecting-ip') ||
    requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    null
  );
}
