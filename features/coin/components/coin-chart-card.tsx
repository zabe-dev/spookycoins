'use client';

import type { CanonicalCoin, ChartRange, CoinDetailView } from '../types';

export function CoinChartCard({
  coin,
  canonicalCoin,
  range,
  chartPath,
  onRangeChange,
}: {
  coin: CoinDetailView;
  canonicalCoin: CanonicalCoin;
  range: ChartRange;
  chartPath: string;
  onRangeChange: (range: ChartRange) => void;
}) {
  return (
    <section className="detail-card chart-card">
      <div className="chart-head">
        <div>
          <small>{coin.symbol} / USD</small>
          <strong>{coin.price}</strong>
          <span className={coin.change >= 0 ? 'positive' : 'negative'}>
            {coin.change >= 0 ? '+' : ''}
            {coin.change}%
          </span>
        </div>
        <div className="range-tabs">
          {(['1H', '4H', '24H', '7D', '30D'] as ChartRange[]).map((item) => (
            <button
              key={item}
              className={range === item ? 'active' : ''}
              onClick={() => onRangeChange(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      <div className="price-chart" aria-label={`${coin.name} price chart for ${range}`}>
        <div className="chart-grid" />
        <svg viewBox="0 0 900 300" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="chartArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#c4ff44" stopOpacity=".25" />
              <stop offset="1" stopColor="#c4ff44" stopOpacity="0" />
            </linearGradient>
          </defs>
          {chartPath && <path className="chart-area" d={`${chartPath} L900 300 L0 300Z`} />}
          {chartPath && <path className="chart-line" d={chartPath} />}
        </svg>
        {chartPath ? (
          <span className="chart-price-marker">{coin.price}</span>
        ) : (
          <span className="chart-unavailable">Historical chart unavailable</span>
        )}
      </div>
      <div className="chart-foot">
        <span>Historical market chart · {range}</span>
        {canonicalCoin.dex.available && (
          <a href={canonicalCoin.dex.url} target="_blank" rel="noreferrer">
            Open DEX ↗
          </a>
        )}
      </div>
    </section>
  );
}
