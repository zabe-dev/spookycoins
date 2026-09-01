import 'server-only';

import { unstable_cache } from 'next/cache';
import type { TopbarPriceTicker } from '@/features/topbar/types';

const symbols = ['BTC', 'ETH', 'SOL', 'BNB'] as const;
const binanceSymbols = symbols.map((symbol) => `${symbol}USDT`);
const fallbackPrices = symbols.map((symbol) => ({ symbol, price: null, change: null }));
const providerState = globalThis as typeof globalThis & {
  spookycoinsTopbarPriceFetches?: number[];
  spookycoinsTopbarPriceInFlight?: Promise<TopbarPriceTicker[]>;
};

const requestTimeoutMs = 4_000;
const maxRequestsPerDay = Number(process.env.TOPBAR_PRICE_DAILY_LIMIT || 480);
const cacheSeconds = Number(process.env.TOPBAR_PRICE_CACHE_SECONDS || 120);

export const getCachedTopbarPrices = unstable_cache(
  () => getSafeTopbarPrices(),
  ['topbar-market-prices-v1'],
  { revalidate: cacheSeconds },
);

async function getSafeTopbarPrices(): Promise<TopbarPriceTicker[]> {
  try {
    return await dedupeFetch('binance-topbar-prices', () => fetchBinancePrices());
  } catch {
    return fallbackPrices;
  }
}

async function fetchBinancePrices(): Promise<TopbarPriceTicker[]> {
  if (!canUsePriceProvider()) return fallbackPrices;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);

  try {
    const response = await fetch(
      `https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(
        JSON.stringify(binanceSymbols),
      )}`,
      {
        headers: { accept: 'application/json' },
        next: { revalidate: cacheSeconds },
        signal: controller.signal,
      },
    );

    if (!response.ok) return fallbackPrices;

    const payload = await response.json();
    if (!Array.isArray(payload)) return fallbackPrices;

    const tickers = new Map<string, TopbarPriceTicker>(
      payload.map((item) => {
        const symbol = String(item.symbol || '').replace(
          /USDT$/,
          '',
        ) as TopbarPriceTicker['symbol'];
        return [
          symbol,
          {
            symbol,
            price: readNumber(item.lastPrice),
            change: readNumber(item.priceChangePercent),
          },
        ];
      }),
    );

    return symbols.map((symbol) => tickers.get(symbol) || { symbol, price: null, change: null });
  } finally {
    clearTimeout(timeout);
  }
}

async function dedupeFetch(_key: string, fetcher: () => Promise<TopbarPriceTicker[]>) {
  if (providerState.spookycoinsTopbarPriceInFlight) {
    return providerState.spookycoinsTopbarPriceInFlight;
  }

  providerState.spookycoinsTopbarPriceInFlight = fetcher().finally(() => {
    providerState.spookycoinsTopbarPriceInFlight = undefined;
  });

  return providerState.spookycoinsTopbarPriceInFlight;
}

function canUsePriceProvider() {
  const dayAgo = Date.now() - 86_400_000;
  const attempts = (providerState.spookycoinsTopbarPriceFetches || []).filter(
    (timestamp) => timestamp > dayAgo,
  );

  if (attempts.length >= maxRequestsPerDay) {
    providerState.spookycoinsTopbarPriceFetches = attempts;
    return false;
  }

  providerState.spookycoinsTopbarPriceFetches = [...attempts, Date.now()];
  return true;
}

function readNumber(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}
