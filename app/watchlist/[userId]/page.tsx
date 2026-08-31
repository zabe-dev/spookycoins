import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import {
  PublicWatchlistTable,
  type AccountWatchedCoin,
} from '@/features/account/components/account-panel';
import { NETWORKS } from '@/features/coins/networks';
import { processExpiredCoinDeletionRequests } from '@/features/coins/server/delete-requests';
import { isMissingInteractionTableError } from '@/features/coins/server/interactions';
import { db } from '@/lib/db/client';
import { coinWatchlists, coins, users } from '@/lib/db/schema';
import { and, desc, eq } from 'drizzle-orm';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

type WatchlistPageParams = { params: Promise<{ userId: string }> };

export const metadata: Metadata = {
  title: 'Public watchlist',
  robots: { index: false, follow: false },
};

export default async function PublicWatchlistPage({ params }: WatchlistPageParams) {
  const { userId } = await params;
  await processExpiredCoinDeletionRequests();

  const [owner] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!owner) notFound();

  const watchedCoins = await db
    .select({
      coinId: coins.id,
      name: coins.name,
      symbol: coins.symbol,
      chain: coins.chain,
      logoUrl: coins.logoUrl,
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

  const rows: AccountWatchedCoin[] = watchedCoins.map((coin) => ({
    ...coin,
    ...readChainData(coin.chain),
    createdAt: coin.createdAt.toISOString(),
  }));

  return (
    <main className="market-page">
      <SiteHeader active="none" />
      <section className="container settings-shell account-shell">
        <header className="account-heading">
          <h1>Public watchlist</h1>
          <p>Coins saved by {owner.email}. Anyone with this link can view this table.</p>
        </header>

        <section className="settings-card submissions-card">
          <div className="settings-card-title">
            <div>
              <small>Watchlist</small>
              <h2>Watched coins</h2>
            </div>
            <span>{rows.length}</span>
          </div>
          {rows.length ? (
            <PublicWatchlistTable coins={rows} />
          ) : (
            <div className="settings-empty">
              <strong>No watched coins yet</strong>
              <p>This public watchlist is empty.</p>
            </div>
          )}
        </section>
      </section>
      <SiteFooter />
    </main>
  );
}

function readChainData(value: string | null) {
  if (value && value in NETWORKS) {
    const network = NETWORKS[value as keyof typeof NETWORKS];
    return {
      chain: network.shortName,
      chainIcon: network.iconUrl,
    };
  }

  return { chain: value, chainIcon: null };
}
