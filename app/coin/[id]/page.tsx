import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SiteHeader } from '@/components/layout/site-header';
import { CoinDetailPage } from '@/features/coin/components/coin-detail-page';
import { getActiveBannerAds } from '@/features/ads/server/banner-ads';
import { getPublicCoinById, getPublicCoinListItems } from '@/features/coins/server/coin-list';
import { NETWORKS } from '@/features/coins/networks';
import { getCurrentSession } from '@/lib/auth/session';
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
  const session = await getCurrentSession();
  const coin = await getPublicCoinById(Number(id), session?.user.id);
  if (!coin) notFound();
  const [allCoins, bannerAds] = await Promise.all([
    getPublicCoinListItems(session?.user.id),
    getActiveBannerAds(),
  ]);
  const promotedCoins = allCoins
    .filter((item) => item.promoted)
    .sort((a, b) => b.votes - a.votes || a.name.localeCompare(b.name))
    .map((item, index) => ({ ...item, rank: index + 1 }));

  return (
    <>
      <SiteHeader active="none" />
      <CoinDetailPage
        coinRecord={coin}
        promotedCoins={promotedCoins}
        premiumBannerAds={bannerAds.premium}
        isSignedIn={Boolean(session?.user)}
      />
    </>
  );
}
