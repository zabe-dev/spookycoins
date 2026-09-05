import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { WatchlistPanel } from '@/features/account/components/account-panel';
import { PremiumAdBanner } from '@/features/ads/components/ad-banners';
import { getActiveBannerAds } from '@/features/ads/server/banner-ads';
import { getWatchlistTableRows } from '@/features/account/server/watchlist';
import { processExpiredCoinDeletionRequests } from '@/features/coins/server/delete-requests';
import { processExpiredPresales } from '@/features/coins/server/presale-expiry';
import { getCurrentSession } from '@/lib/auth/session';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import '../market.css';
import '../scroll-fix.css';

export const metadata: Metadata = {
  title: 'Watchlist',
  robots: { index: false, follow: false },
};

export default async function WatchlistPage() {
  const session = await getCurrentSession();
  if (!session) redirect('/');

  await processExpiredPresales();
  await processExpiredCoinDeletionRequests();
  const [rows, bannerAds] = await Promise.all([
    getWatchlistTableRows(session.user.id, session.user.id),
    getActiveBannerAds(),
  ]);

  return (
    <main className="market-page">
      <SiteHeader active="none" />
      <WatchlistPanel
        userId={session.user.id}
        coins={rows}
        isSignedIn={true}
        afterTable={<PremiumAdBanner ads={bannerAds.premium} offset={3} />}
      />
      <SiteFooter />
    </main>
  );
}
