import { HomeClient } from '@/app/home-client';
import { SiteHeader } from '@/components/layout/site-header';
import { getActiveBannerAds } from '@/features/ads/server/banner-ads';
import { getPublicCoinListItems } from '@/features/coins/server/coin-list';
import { auth } from '@/lib/auth/server';
import { headers } from 'next/headers';
import './market.css';
import './scroll-fix.css';

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });
  const [marketCoins, bannerAds] = await Promise.all([
    getPublicCoinListItems(session?.user.id),
    getActiveBannerAds(),
  ]);
  return (
    <>
      <SiteHeader />
      <HomeClient
        initialCoins={marketCoins}
        isSignedIn={Boolean(session?.user)}
        bannerAds={bannerAds}
      />
    </>
  );
}
