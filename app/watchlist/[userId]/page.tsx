import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { InfoBand } from '@/components/layout/info-band';
import { SiteFaq } from '@/components/layout/site-faq';
import { PublicWatchlistTable } from '@/features/account/components/account-panel';
import { WideAdBanner } from '@/features/ads/components/ad-banners';
import { getActiveBannerAds } from '@/features/ads/server/banner-ads';
import { getWatchlistTableRows } from '@/features/account/server/watchlist';
import { processExpiredCoinDeletionRequests } from '@/features/coins/server/delete-requests';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { auth } from '@/lib/auth/server';
import { eq } from 'drizzle-orm';
import type { Metadata } from 'next';
import { headers } from 'next/headers';
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
  const session = await auth.api.getSession({ headers: await headers() });
  await processExpiredCoinDeletionRequests();

  const [owner] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!owner) notFound();

  const [rows, bannerAds] = await Promise.all([
    getWatchlistTableRows(userId, session?.user.id),
    getActiveBannerAds(),
  ]);
  const ownerName = owner.name.trim() || 'Hunter';

  return (
    <main className="market-page">
      <SiteHeader active="none" />
      <section className="container settings-shell account-shell public-watchlist-shell">
        <header className="account-heading">
          <h1>{ownerName}&apos;s Watchlist</h1>
          <p>Viewing a shared watchlist.</p>
        </header>

        <section className="settings-card submissions-card watchlist-page-card">
          <div className="watchlist-page-toolbar">
            <span>{rows.length}</span>
          </div>
          {rows.length ? (
            <PublicWatchlistTable coins={rows} isSignedIn={Boolean(session?.user)} />
          ) : (
            <div className="settings-empty">
              <strong>No watched coins yet</strong>
              <p>This public watchlist is empty.</p>
            </div>
          )}
        </section>
      </section>
      <WideAdBanner ads={bannerAds.wide} offset={3} />
      <SiteFaq />
      <InfoBand />
      <SiteFooter />
    </main>
  );
}
