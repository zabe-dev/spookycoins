'use client';

import { useState } from 'react';

type MarketTicker = { symbol: string; price: number | null; change: number | null };

const mockTickers: MarketTicker[] = [
  { symbol: 'BTC', price: 113240.18, change: 1.42 },
  { symbol: 'ETH', price: 4385.72, change: 2.08 },
  { symbol: 'BNB', price: 862.34, change: -0.36 },
];

export function Topbar() {
  const [paused, setPaused] = useState(false);

  return (
    <div className="topbar-band">
      <div className="container topbar">
        <div className="ticker">
          <TickerItems tickers={mockTickers} />
        </div>
        <div className="platform-stats">
          <span>
            Coins <b>14,892</b>
          </span>
          <span>
            Users <b>84.2K</b>
          </span>
          <span>
            Total votes <b>12.48M</b>
          </span>
        </div>
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
              <TickerItems tickers={mockTickers} />
              <PlatformItems />
            </div>
            <div className="topbar-marquee-group" aria-hidden="true">
              <TickerItems tickers={mockTickers} />
              <PlatformItems />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TickerItems({ tickers }: { tickers: MarketTicker[] }) {
  return tickers.map((coin) => (
    <span key={coin.symbol}>
      {coin.symbol} <b>{formatTickerPrice(coin.price)}</b>{' '}
      <i className={(coin.change ?? 0) < 0 ? 'down' : ''}>
        {(coin.change ?? 0) >= 0 ? '+' : ''}
        {(coin.change ?? 0).toFixed(2)}%
      </i>
    </span>
  ));
}

function PlatformItems() {
  return (
    <>
      <span>
        Coins <b>14,892</b>
      </span>
      <span>
        Users <b>84.2K</b>
      </span>
      <span>
        Total votes <b>12.48M</b>
      </span>
    </>
  );
}

function formatTickerPrice(value: number | null) {
  if (value === null) return '—';
  return `$${value.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
}
