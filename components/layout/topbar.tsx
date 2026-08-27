'use client';

import { useEffect, useState } from 'react';

type MarketTicker = { symbol: string; price: number | null; change: number | null };

export function Topbar() {
  const [tickers, setTickers] = useState<MarketTicker[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/market/tickers', { signal: controller.signal })
      .then((response) => response.json() as Promise<{ data: MarketTicker[] }>)
      .then(({ data }) => setTickers(data))
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  return (
    <div className="topbar-band">
      <div className="container topbar">
        <div className="ticker">
          {(tickers.length
            ? tickers
            : [
                { symbol: 'BTC', price: null, change: null },
                { symbol: 'ETH', price: null, change: null },
                { symbol: 'BNB', price: null, change: null },
              ]
          ).map((coin) => (
            <span key={coin.symbol}>
              {coin.symbol} <b>{formatTickerPrice(coin.price)}</b>{' '}
              <i className={(coin.change ?? 0) < 0 ? 'down' : ''}>
                {(coin.change ?? 0) >= 0 ? '+' : ''}
                {(coin.change ?? 0).toFixed(2)}%
              </i>
            </span>
          ))}
        </div>
        <div className="platform-stats">
          <span>
            Projects <b>14,892</b>
          </span>
          <span>
            Users <b>84.2K</b>
          </span>
          <span>
            Total votes <b>12.48M</b>
          </span>
        </div>
      </div>
    </div>
  );
}

function formatTickerPrice(value: number | null) {
  if (value === null) return '—';
  return `$${value.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
}
