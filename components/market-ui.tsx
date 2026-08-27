'use client';
/* eslint-disable @next/next/no-img-element -- URLs come from replaceable market-data providers. */

import { useRef, type ReactNode, type WheelEvent } from 'react';
import Link from 'next/link';
import { VoteButton, WatchlistButton } from '@/components/actions/action-buttons';
import {
  formatVotes,
  type ProjectListItem as Coin,
  type ProjectSortKey as SortKey,
} from '@/lib/projects/view';

export function BoltIcon() {
  return (
    <svg className="bolt-icon" aria-hidden="true" viewBox="0 0 448 512">
      <path
        fill="currentColor"
        d="M349.4 44.6c5.9-13.7 1.5-29.7-10.6-38.5s-28.6-8-39.9 1.8l-256 224c-10 8.8-13.6 22.9-8.9 35.3S50.7 288 64 288h111.5L98.6 467.4c-5.9 13.7-1.5 29.7 10.6 38.5s28.6 8 39.9-1.8l256-224c10-8.8 13.6-22.9 8.9-35.3S397.3 224 384 224H272.5l76.9-179.4z"
      />
    </svg>
  );
}

export function BannerAd() {
  return (
    <div className="banner-ad">
      <small>AD SPACE</small>
      <div className="ad-placeholder-copy">
        <b>Reach crypto&apos;s earliest project hunters.</b>
        <span>Premium inventory · Measured impressions and clicks</span>
      </div>
      <button>View ad packages ↗</button>
    </div>
  );
}

export function TableScroller({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  function handleWheel(event: WheelEvent<HTMLDivElement>) {
    const scroller = scrollerRef.current;
    if (!scroller || Math.abs(event.deltaX) >= Math.abs(event.deltaY)) return;

    const maxScroll = scroller.scrollWidth - scroller.clientWidth;
    if (maxScroll <= 0) return;

    const movingRight = event.deltaY > 0;
    const canMove = movingRight ? scroller.scrollLeft < maxScroll : scroller.scrollLeft > 0;
    if (!canMove) return;

    event.preventDefault();
    scroller.scrollLeft += event.deltaY;
  }

  return (
    <div className={`table-frame ${className}`}>
      <div ref={scrollerRef} className="table-wrap" onWheel={handleWheel}>
        {children}
      </div>
    </div>
  );
}

export function SectionTitle({
  kicker,
  title,
  subtitle,
  action,
}: {
  kicker: string;
  title: string;
  subtitle?: string;
  action: string;
}) {
  return (
    <div className="section-title">
      <div>
        <small>{kicker}</small>
        <h1>{title}</h1>
        {subtitle && <p className="section-subtitle">{subtitle}</p>}
      </div>
      <span>{action}</span>
    </div>
  );
}

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

export function CoinCells({ coin }: { coin: Coin }) {
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
            <Link
              href={`/coin/${coin.projectId}`}
              className={coin.boost === 500 ? 'gold-name gold-name-animated' : ''}
            >
              <b>{coin.name}</b>
            </Link>
            <span>
              {coin.symbol} · {coin.category}
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

export { ActionBurst as LineBurst } from '@/components/actions/action-buttons';
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

export type MarketTableProps = {
  coins: Coin[];
  watchlist: string[];
  watchAnimating: string | null;
  voted: string[];
  animating: string | null;
  watch: (symbol: string) => void;
  vote: (symbol: string) => void;
  header?: ReactNode;
  className?: string;
};

export function MarketTable({
  coins,
  watchlist,
  watchAnimating,
  voted,
  animating,
  watch,
  vote,
  header,
  className,
}: MarketTableProps) {
  return (
    <TableScroller className={className}>
      <table className="coins-table">
        <thead>
          {header ?? (
            <tr>
              <th>#</th>
              <th>Project</th>
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
                <CoinCells coin={coin} />
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

export function DiscoveryCard({
  icon,
  title,
  sub,
  coins,
}: {
  icon: 'new' | 'trend' | 'watch';
  title: string;
  sub: string;
  coins: Coin[];
}) {
  return (
    <article className="discovery-card">
      <div className="discovery-heading">
        <DiscoveryIcon type={icon} />
        <span>
          <h3>{title}</h3>
          <small>{sub}</small>
        </span>
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

function DiscoveryIcon({ type }: { type: 'new' | 'trend' | 'watch' }) {
  if (type === 'new')
    return (
      <svg className="discovery-icon new-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3v18M3 12h18" />
        <path d="m17 4 .7 1.8L20 7l-2.3 1.2L17 10l-.7-1.8L14 7l2.3-1.2L17 4Z" />
      </svg>
    );
  if (type === 'trend')
    return (
      <svg className="discovery-icon trend-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 17 9 12l4 3 7-9" />
        <path d="M15 6h5v5" />
      </svg>
    );
  return (
    <svg className="discovery-icon watch-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 20s-8-4.6-8-10a4.4 4.4 0 0 1 8-2.5A4.4 4.4 0 0 1 20 10c0 5.4-8 10-8 10Z" />
      <path d="m9.2 11.8 1.8 1.8 4-4" />
    </svg>
  );
}

export function InfoRow({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <b>{title}</b>
      <span>{text}</span>
    </div>
  );
}
