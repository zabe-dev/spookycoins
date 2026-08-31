import 'server-only';

import { db } from '@/lib/db/client';
import { coinSubmissions, coins } from '@/lib/db/schema';
import { and, eq, inArray, sql } from 'drizzle-orm';

export async function processExpiredCoinDeletionRequests() {
  const now = new Date();
  const nowIso = now.toISOString();
  const expiredRequests = await db
    .select({
      id: coinSubmissions.id,
      coinId: coinSubmissions.coinId,
    })
    .from(coinSubmissions)
    .where(
      and(
        eq(coinSubmissions.submissionType, 'delete-request'),
        eq(coinSubmissions.status, 'pending'),
        sql`nullif(${coinSubmissions.coinData}->>'scheduledDeleteAt', '')::timestamptz <= ${nowIso}::timestamptz`,
      ),
    );

  if (!expiredRequests.length) {
    return { completedRequests: 0, deletedCoins: 0 };
  }

  const requestIds = expiredRequests.map((request) => request.id);
  const coinIds = Array.from(
    new Set(
      expiredRequests
        .map((request) => request.coinId)
        .filter((coinId): coinId is number => typeof coinId === 'number'),
    ),
  );

  await db.transaction(async (tx) => {
    await tx
      .update(coinSubmissions)
      .set({ status: 'approved', reviewedAt: now, updatedAt: now })
      .where(inArray(coinSubmissions.id, requestIds));

    if (coinIds.length) {
      await tx.delete(coins).where(inArray(coins.id, coinIds));
    }
  });

  return { completedRequests: requestIds.length, deletedCoins: coinIds.length };
}
