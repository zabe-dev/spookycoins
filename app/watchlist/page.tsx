import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { InfoBand } from '@/components/layout/info-band';
import { WatchlistPanel } from '@/features/account/components/account-panel';
import { getWatchlistTableRows } from '@/features/account/server/watchlist';
import { processExpiredCoinDeletionRequests } from '@/features/coins/server/delete-requests';
import { auth } from '@/lib/auth/server';
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import '../market.css';
import '../scroll-fix.css';

export const metadata: Metadata = {
  title: 'Watchlist',
  robots: { index: false, follow: false },
};

export default async function WatchlistPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect('/');

  await processExpiredCoinDeletionRequests();
  const rows = await getWatchlistTableRows(session.user.id, session.user.id);

  return (
    <main className="market-page">
      <SiteHeader active="none" />
      <WatchlistPanel userId={session.user.id} coins={rows} isSignedIn={true} />
      <InfoBand />
      <SiteFooter />
    </main>
  );
}
