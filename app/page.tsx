import { HomeClient } from '@/app/home-client';
import { SiteHeader } from '@/components/layout/site-header';
import { getActiveBannerAds } from '@/features/ads/server/banner-ads';
import { getPublicCoinListItems } from '@/features/coins/server/coin-list';
import { getCurrentSession } from '@/lib/auth/session';
import './market.css';
import './scroll-fix.css';

export default async function Home() {
  const session = await getCurrentSession();
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
