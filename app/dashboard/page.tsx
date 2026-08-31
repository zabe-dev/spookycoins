import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { AccountPanel } from '@/features/account/components/account-panel';
import { NETWORKS } from '@/features/coins/networks';
import { processExpiredCoinDeletionRequests } from '@/features/coins/server/delete-requests';
import { isMissingInteractionTableError } from '@/features/coins/server/interactions';
import { auth } from '@/lib/auth/server';
import { db } from '@/lib/db/client';
import { coinSubmissions, coinWatchlists, coins } from '@/lib/db/schema';
import { and, desc, eq } from 'drizzle-orm';
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Dashboard',
  robots: { index: false, follow: false },
};

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect('/');

  await processExpiredCoinDeletionRequests();

  const submissions = await db
    .select({
      id: coinSubmissions.id,
      coinId: coinSubmissions.coinId,
      status: coinSubmissions.status,
      submissionType: coinSubmissions.submissionType,
      coinData: coinSubmissions.coinData,
      createdAt: coinSubmissions.createdAt,
    })
    .from(coinSubmissions)
    .where(
      and(
        eq(coinSubmissions.requesterEmail, session.user.email),
        eq(coinSubmissions.submissionType, 'new-coin'),
      ),
    )
    .orderBy(desc(coinSubmissions.createdAt));

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
    .where(and(eq(coinWatchlists.userId, session.user.id), eq(coins.listingStatus, 'active')))
    .orderBy(desc(coinWatchlists.createdAt))
    .catch((error) => {
      if (isMissingInteractionTableError(error)) return [];
      throw error;
    });

  return (
    <main className="market-page">
      <SiteHeader active="none" />
      <AccountPanel
        email={session.user.email}
        userId={session.user.id}
        watchedCoins={watchedCoins.map((coin) => ({
          ...coin,
          ...readChainData(coin.chain),
          createdAt: coin.createdAt.toISOString(),
        }))}
        submissions={submissions.map((submission) => ({
          ...submission,
          createdAt: submission.createdAt.toISOString(),
          coinData: readCoinData(submission.coinData),
        }))}
      />
      <SiteFooter />
    </main>
  );
}

function readCoinData(value: unknown) {
  if (!value || typeof value !== 'object') return {};
  const record = value as Record<string, unknown>;
  const basic = isRecord(record.basic) ? record.basic : null;
  const market = isRecord(record.market) ? record.market : null;

  return {
    name: readString(basic?.name) || readString(record.name),
    symbol: readString(basic?.symbol) || readString(record.symbol),
    chain: readString(market?.primaryChain) || readString(record.chain),
  };
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function readString(value: unknown) {
  return typeof value === 'string' ? value : undefined;
}
