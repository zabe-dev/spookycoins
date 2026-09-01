'use client';

import { TopbarCoinLink } from '@/components/layout/topbar-coin-link';
import type { TopbarSummary } from '@/features/topbar/types';
import { useState } from 'react';

export function TopbarMarquee({ summary }: { summary: TopbarSummary }) {
  const [paused, setPaused] = useState(false);

  return (
    <div
      className={`topbar-marquee ${paused ? 'paused' : ''}`}
      onPointerDown={() => setPaused(true)}
      onPointerUp={() => setPaused(false)}
      onPointerCancel={() => setPaused(false)}
      onPointerLeave={() => setPaused(false)}
      aria-label="Live market and platform statistics. Hold to pause or swipe to browse."
    >
      <div className="topbar-marquee-track">
        <div className="topbar-marquee-group">
          <TopbarItems summary={summary} />
        </div>
        <div
          className="topbar-marquee-group"
          aria-hidden="true"
          ref={(el) => {
            if (el) el.inert = true;
          }}
        >
          <TopbarItems summary={summary} duplicate />
        </div>
      </div>
    </div>
  );
}

export function TopbarItems({
  summary,
  duplicate = false,
  pricesOnly = false,
}: {
  summary: TopbarSummary;
  duplicate?: boolean;
  pricesOnly?: boolean;
}) {
  return (
    <>
      {summary.prices.map((coin) => (
        <span key={`${duplicate ? 'copy-' : ''}${coin.symbol}`}>
          {coin.symbol} <b>{formatTickerPrice(coin.price)}</b>{' '}
          <i className={(coin.change ?? 0) < 0 ? 'down' : ''}>
            {coin.change === null
              ? '—'
              : `${coin.change >= 0 ? '+' : ''}${coin.change.toFixed(2)}%`}
          </i>
        </span>
      ))}
      {pricesOnly ? null : (
        <>
          <TopbarCoinLink coin={summary.topVotedCoin} kind="top-voted" />
          <TopbarCoinLink coin={summary.trendingCoin} kind="trending" />
          <span>
            Users <b>{formatCompactNumber(summary.users)}</b>
          </span>
          <span>
            Projects <b>{formatCompactNumber(summary.projects)}</b>
          </span>
          <span>
            Total votes <b>{formatCompactNumber(summary.totalVotes)}</b>
          </span>
        </>
      )}
    </>
  );
}

function formatTickerPrice(value: number | null) {
  if (value === null) return '—';
  return `$${value.toLocaleString('en-US', {
    maximumFractionDigits: value >= 100 ? 0 : 2,
  })}`;
}

function formatCompactNumber(value: number | null) {
  if (value === null) return '—';
  return Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: value >= 1000 ? 1 : 0,
  }).format(value);
}
