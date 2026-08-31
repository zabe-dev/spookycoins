import { HomeClient } from '@/app/home-client';
import { getPublicCoinListItems } from '@/features/coins/server/coin-list';
import { auth } from '@/lib/auth/server';
import { headers } from 'next/headers';
import './market.css';
import './scroll-fix.css';

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });
  const marketCoins = await getPublicCoinListItems(session?.user.id);
  return <HomeClient initialCoins={marketCoins} isSignedIn={Boolean(session?.user)} />;
}
