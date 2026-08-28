'use client';
/* eslint-disable @next/next/no-img-element -- Project logos can come from submitted URLs later. */

import type { ReactNode } from 'react';
import Link from 'next/link';
import { VoteButton, WatchlistButton } from '@/components/ui/action-buttons';
import {
  formatVotes,
  type CoinListItem as Coin,
  type CoinSortKey as SortKey,
} from '@/features/coins/view';
import { BoltIcon } from './icons';
import { TableScroller } from './table-scroller';

export function SortHeader({
  l,
  k,
  s,
  go,
}: {
  l: string;
  k: SortKey;
  s: { key: SortKey; dir: 1 | -1 };
  go: (key: SortKey) => void;
}) {
  return (
    <th>
      <button className="sort-head" onClick={() => go(k)}>
        {l}
        <span>{s.key === k ? (s.dir === 1 ? '↑' : '↓') : '↕'}</span>
      </button>
    </th>
  );
}

export function CoinCells({ coin, linkEnabled = true }: { coin: Coin; linkEnabled?: boolean }) {
  const nameClass = coin.boost === 500 ? 'gold-name gold-name-animated' : '';

  return (
    <>
      <td>
        <span className={`rank-number ${coin.rank < 4 ? 'top' : ''}`}>{coin.rank}</span>
      </td>
      <td>
        <div className="coin-cell">
          <div className={`coin-logo ${coin.color}`}>
            {coin.image ? <img src={coin.image} alt="" /> : coin.logo}
            <span className="chain-badge">{coin.chain[0]}</span>
          </div>
          <div>
            {linkEnabled ? (
              <Link
                href={`/coin/${coin.coinId}`}
                className={nameClass}
                title={coin.name}
                aria-label={coin.name}
              >
                <b>{coin.name}</b>
              </Link>
            ) : (
              <span className={`coin-name-static ${nameClass}`} title={coin.name}>
                <b>{coin.name}</b>
              </span>
            )}
            <span>
              {coin.promoted
                ? `$${coin.symbol} · ${coin.networkName}`
                : `${coin.symbol} · ${coin.category}`}
            </span>
          </div>
        </div>
      </td>
      <td className="numeric">{coin.cap}</td>
      <td className="numeric">{coin.price}</td>
      <td>
        <span className={coin.change >= 0 ? 'positive' : 'negative'}>
          {coin.change >= 0 ? '+' : ''}
          {coin.change}%
        </span>
      </td>
      <td className="muted-cell">{coin.launch}</td>
      <td>
        {coin.boost ? (
          <span className={`boost-badge boost-${coin.boost}`}>
            <BoltIcon />
            {coin.boost}×
          </span>
        ) : (
          <span className="no-boost">—</span>
        )}
      </td>
      <td>
        <div className="vote-total">
          <b>{formatVotes(coin.votes)}</b>
          <span>this week</span>
        </div>
      </td>
      <td className="muted-cell">{coin.age}</td>
    </>
  );
}

export { ActionBurst as LineBurst } from '@/components/ui/action-buttons';

export function WatchButton({
  active,
  bursting,
  onClick,
}: {
  active: boolean;
  bursting: boolean;
  onClick: () => void;
}) {
  return <WatchlistButton active={active} animating={bursting} onClick={onClick} />;
}

export type CoinTableProps = {
  coins: Coin[];
  watchlist: string[];
  watchAnimating: string | null;
  voted: string[];
  animating: string | null;
  watch: (symbol: string) => void;
  vote: (symbol: string) => void;
  header?: ReactNode;
  className?: string;
  coinLinks?: boolean;
};

export function CoinTable({
  coins,
  watchlist,
  watchAnimating,
  voted,
  animating,
  watch,
  vote,
  header,
  className,
  coinLinks = true,
}: CoinTableProps) {
  return (
    <TableScroller className={className}>
      <table className="coins-table">
        <thead>
          {header ?? (
            <tr>
              <th>#</th>
              <th>Coin</th>
              <th>Market cap</th>
              <th>Price</th>
              <th>24h</th>
              <th>Launch</th>
              <th>Boost</th>
              <th>Weekly votes</th>
              <th>Submitted</th>
              <th>Watch</th>
              <th />
            </tr>
          )}
        </thead>
        <tbody>
          {coins.map((coin) => {
            const hasVoted = voted.includes(coin.symbol);
            return (
              <tr key={coin.symbol} className={coin.boost ? 'boosted-row' : ''}>
                <CoinCells coin={coin} linkEnabled={coinLinks} />
                <td>
                  <WatchlistButton
                    active={watchlist.includes(coin.symbol)}
                    animating={watchAnimating === coin.symbol}
                    onClick={() => watch(coin.symbol)}
                  />
                </td>
                <td>
                  <VoteButton
                    active={hasVoted}
                    animating={animating === coin.symbol}
                    onClick={() => vote(coin.symbol)}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </TableScroller>
  );
}
