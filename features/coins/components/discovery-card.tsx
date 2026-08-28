'use client';
/* eslint-disable @next/next/no-img-element -- Project logos can come from submitted URLs later. */

import Link from 'next/link';
import type { CoinListItem as Coin } from '@/features/coins/view';
import { DiscoveryIcon } from './icons';

export function DiscoveryCard({
  icon,
  title,
  sub,
  coins,
  viewMoreHref,
}: {
  icon: 'new' | 'trend' | 'watch';
  title: string;
  sub: string;
  coins: Coin[];
  viewMoreHref: string;
}) {
  return (
    <article className="discovery-card">
      <div className="discovery-heading">
        <DiscoveryIcon type={icon} />
        <span>
          <h3>{title}</h3>
          <small>{sub}</small>
        </span>
        <a className="discovery-view-more" href={viewMoreHref}>
          View more →
        </a>
      </div>
      {coins.map((coin, index) => (
        <Link className="mini-coin" href={`/coin/${coin.coinId}`} key={coin.symbol}>
          <b>{index + 1}</b>
          <div className={`coin-logo ${coin.color}`}>
            {coin.image ? <img src={coin.image} alt="" /> : coin.logo}
          </div>
          <span>
            <strong>{coin.name}</strong>
            <small>
              {coin.symbol} · {coin.chain}
            </small>
          </span>
          <em className={coin.change >= 0 ? 'positive' : 'negative'}>
            {coin.change >= 0 ? '+' : ''}
            {coin.change}%
          </em>
        </Link>
      ))}
    </article>
  );
}
