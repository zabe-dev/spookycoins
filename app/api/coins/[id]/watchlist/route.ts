import { toggleCoinWatchlist } from '@/features/coins/server/interactions';
import { apiError, apiSuccess } from '@/lib/api/responses';
import { auth } from '@/lib/auth/server';
import { headers } from 'next/headers';

type RouteContext = { params: Promise<{ id: string }> };

const watchlistAttempts = new Map<string, number[]>();
const rateLimitWindowMs = 60_000;
const maxWatchlistAttemptsPerWindow = 40;

export async function POST(_request: Request, { params }: RouteContext) {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) return apiError('AUTH_REQUIRED', 'Sign in required.', 401);

  if (isRateLimited(session.user.id)) {
    return apiError('RATE_LIMITED', 'Too many watchlist updates. Please slow down.', 429);
  }

  const { id } = await params;
  const coinId = Number(id);
  if (!Number.isSafeInteger(coinId) || coinId < 1) {
    return apiError('INVALID_COIN_ID', 'Coin not found.', 404);
  }

  try {
    const result = await toggleCoinWatchlist(coinId, session.user.id);
    return apiSuccess(
      {
        coinId,
        watching: result.watching,
        summary: result.summary,
      },
      result.watching ? 'Added to watchlist.' : 'Removed from watchlist.',
    );
  } catch (error) {
    return apiError(
      'WATCHLIST_FAILED',
      error instanceof Error ? error.message : 'Could not update your watchlist.',
      400,
    );
  }
}

function isRateLimited(key: string) {
  const now = Date.now();
  const activeAttempts = (watchlistAttempts.get(key) || []).filter(
    (timestamp) => now - timestamp < rateLimitWindowMs,
  );
  watchlistAttempts.set(key, [...activeAttempts, now]);
  return activeAttempts.length >= maxWatchlistAttemptsPerWindow;
}
