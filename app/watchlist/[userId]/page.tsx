import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { PublicWatchlistTable } from '@/features/account/components/account-panel';
import { getWatchlistTableRows } from '@/features/account/server/watchlist';
import { processExpiredCoinDeletionRequests } from '@/features/coins/server/delete-requests';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import '../../market.css';
import '../../scroll-fix.css';

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

  const rows = await getWatchlistTableRows(userId);

  return (
    <main className="market-page">
      <SiteHeader active="none" />
      <section className="container settings-shell account-shell public-watchlist-shell">
        <header className="account-heading">
          <h1>Public watchlist</h1>
          <p>Coins saved by {owner.email}. Anyone with this link can view this table.</p>
        </header>

        <section className="settings-card submissions-card watchlist-page-card">
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
