'use client';
/* eslint-disable @next/next/no-img-element -- Project logos can come from submitted URLs later. */

import Link from 'next/link';
import { formatVotes, type CoinListItem as Coin } from '@/features/coins/view';
import { DiscoveryIcon } from './icons';

export function DiscoveryCard({
  icon,
  title,
  sub,
  coins,
  viewMoreHref,
  metric = 'votes',
}: {
  icon: 'new' | 'presale' | 'watch';
  title: string;
  sub: string;
  coins: Coin[];
  viewMoreHref: string;
  metric?: 'votes' | 'added';
}) {
  const rows = Array.from({ length: 5 }, (_, index) => coins[index] || null);

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
      {rows.map((coin, index) =>
        coin ? (
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
            <em>{metric === 'added' ? coin.age : `${formatVotes(coin.votes)} votes`}</em>
          </Link>
        ) : (
          <div className="mini-coin mini-coin-empty" key={`empty-${index}`}>
            <b>{index + 1}</b>
            <div className="coin-logo">-</div>
            <span>
              <strong>-</strong>
              <small>-</small>
            </span>
            <em>-</em>
          </div>
        ),
      )}
    </article>
  );
}
