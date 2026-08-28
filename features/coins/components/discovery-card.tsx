'use client';
/* eslint-disable @next/next/no-img-element -- URLs come from replaceable market-data providers. */

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
        <div className="mini-coin" key={coin.symbol}>
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
        </div>
      ))}
    </article>
  );
}
