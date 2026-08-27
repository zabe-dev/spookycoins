'use client';

import { useEffect, useState } from 'react';
import type { Coin } from '@/lib/market-data';

export function Topbar() {
  const [tickers, setTickers] = useState<Coin[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/market/coins?limit=10', { signal: controller.signal })
      .then((response) => response.json() as Promise<{ data: Coin[] }>)
      .then(({ data }) =>
        setTickers(
          ['BTC', 'ETH', 'BNB']
            .map((symbol) => data.find((coin) => coin.symbol === symbol))
            .filter((coin): coin is Coin => Boolean(coin)),
        ),
      )
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
                { symbol: 'BTC', price: '—', change: 0 },
                { symbol: 'ETH', price: '—', change: 0 },
                { symbol: 'BNB', price: '—', change: 0 },
              ]
          ).map((coin) => (
            <span key={coin.symbol}>
              {coin.symbol} <b>{coin.price}</b>{' '}
              <i className={coin.change < 0 ? 'down' : ''}>
                {coin.change >= 0 ? '+' : ''}
                {coin.change}%
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
