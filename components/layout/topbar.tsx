'use client';

import { useEffect, useState } from 'react';

type MarketTicker = { symbol: string; price: number | null; change: number | null };

export function Topbar() {
  const [tickers, setTickers] = useState<MarketTicker[]>([]);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/market/tickers', { signal: controller.signal })
      .then((response) => response.json() as Promise<{ data: MarketTicker[] }>)
      .then(({ data }) => setTickers(data))
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  const visibleTickers = tickers.length
    ? tickers
    : [
        { symbol: 'BTC', price: null, change: null },
        { symbol: 'ETH', price: null, change: null },
        { symbol: 'BNB', price: null, change: null },
      ];

  return (
    <div className="topbar-band">
      <div className="container topbar">
        <div className="ticker">
          <TickerItems tickers={visibleTickers} />
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
              <TickerItems tickers={visibleTickers} />
              <PlatformItems />
            </div>
            <div className="topbar-marquee-group" aria-hidden="true">
              <TickerItems tickers={visibleTickers} />
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
