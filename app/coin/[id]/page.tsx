import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CoinDetailPage } from '@/features/coin/components/coin-detail-page';
import { getPublicCoinById } from '@/features/coins/server/coin-list';
import { NETWORKS } from '@/features/coins/networks';
import { auth } from '@/lib/auth/server';
import { headers } from 'next/headers';
import '../../market.css';
import '../../../features/coin/styles/coin-page.css';

type CoinPageParams = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: CoinPageParams): Promise<Metadata> {
  const { id } = await params;
  if (!/^\d+$/.test(id)) return {};

  const coin = await getPublicCoinById(Number(id));
  if (!coin) return {};

  const networkName = NETWORKS[coin.network].name;
  const title = `${coin.name} $${coin.symbol} — ${networkName} Crypto Project`;
  const description =
    coin.description ||
    `View ${coin.name} $${coin.symbol} on SpookyCoins, including ${networkName} project details, community votes, watchlist signals, and promotion status.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/coin/${coin.id}`,
    },
    openGraph: {
      title,
      description,
      url: `/coin/${coin.id}`,
      images: coin.logoUrl ? [{ url: coin.logoUrl, alt: `${coin.name} logo` }] : undefined,
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: coin.logoUrl ? [coin.logoUrl] : undefined,
    },
  };
}

export default async function CoinPage({ params }: CoinPageParams) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const session = await auth.api.getSession({ headers: await headers() });
  const coin = await getPublicCoinById(Number(id), session?.user.id);
  if (!coin) notFound();
  return <CoinDetailPage coinRecord={coin} isSignedIn={Boolean(session?.user)} />;
}
