import type { PublicWatchedCoin } from '@/features/account/components/account-panel';
import { getPublicCoinListItems } from '@/features/coins/server/coin-list';
import { isMissingInteractionTableError } from '@/features/coins/server/interactions';
import { db } from '@/lib/db/client';
import { coinWatchlists, coins } from '@/lib/db/schema';
import { and, desc, eq } from 'drizzle-orm';

export async function getWatchlistTableRows(
  userId: string,
  viewerId?: string | null,
): Promise<PublicWatchedCoin[]> {
  const watchedCoins = await db
    .select({
      coinId: coins.id,
      createdAt: coinWatchlists.createdAt,
    })
    .from(coinWatchlists)
    .innerJoin(coins, eq(coins.id, coinWatchlists.coinId))
    .where(and(eq(coinWatchlists.userId, userId), eq(coins.listingStatus, 'active')))
    .orderBy(desc(coinWatchlists.createdAt))
    .catch((error) => {
      if (isMissingInteractionTableError(error)) return [];
      throw error;
    });

  if (!watchedCoins.length) return [];

  const savedAtByCoinId = new Map(
    watchedCoins.map((coin) => [coin.coinId, coin.createdAt.toISOString()]),
  );
  const watchedOrder = new Map(watchedCoins.map((coin, index) => [coin.coinId, index]));
  const fullCoins = await getPublicCoinListItems(viewerId);
  const topCoinRankById = new Map(
    [...fullCoins]
      .sort((a, b) => b.votes - a.votes || a.name.localeCompare(b.name))
      .map((coin, index) => [coin.coinId, index + 1]),
  );

  return fullCoins
    .filter((coin) => savedAtByCoinId.has(coin.coinId))
    .map((coin) => ({
      ...coin,
      rank: topCoinRankById.get(coin.coinId) ?? coin.rank,
      savedAt: savedAtByCoinId.get(coin.coinId) || coin.submittedTimestamp,
    }))
    .sort(
      (a, b) =>
        (watchedOrder.get(a.coinId) ?? Number.MAX_SAFE_INTEGER) -
        (watchedOrder.get(b.coinId) ?? Number.MAX_SAFE_INTEGER),
    );
}
