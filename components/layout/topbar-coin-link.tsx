/* eslint-disable @next/next/no-img-element */

import Link from 'next/link';
import { Crown, Flame } from 'lucide-react';
import type { TopbarCoinLink as TopbarCoinLinkData } from '@/features/topbar/types';

type TopbarCoinLinkProps = {
  coin: TopbarCoinLinkData;
  kind: 'trending' | 'top-voted';
};

const labels = {
  trending: 'Trending',
  'top-voted': 'Top voted',
} as const;

export function TopbarCoinLink({ coin, kind }: TopbarCoinLinkProps) {
  if (!coin) return null;

  const Icon = kind === 'trending' ? Flame : Crown;

  return (
    <Link className="topbar-coin-link" href={`/coin/${coin.id}`}>
      <Icon
        className={kind === 'trending' ? 'topbar-flame-icon' : 'topbar-crown-icon'}
        aria-hidden="true"
      />
      <span className="topbar-coin-label">{labels[kind]}</span>
      {coin.logoUrl ? (
        <img className="topbar-coin-logo" src={coin.logoUrl} alt="" />
      ) : (
        <span className="topbar-coin-logo topbar-coin-logo-fallback">
          {coin.symbol.slice(0, 1)}
        </span>
      )}
      <b>{coin.name}</b>
    </Link>
  );
}
