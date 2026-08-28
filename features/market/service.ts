import { initialCoins } from '@/features/coins/data/initial-dataset';
import type { Coin } from '@/features/coins/types';
import { cached } from './cache';
import { mapConcurrent } from './concurrency';
import { publicMarketProvider } from './providers/public-provider';
import type { ProviderMarket } from './provider';
import type { ProviderChartPoint } from './provider';

const MARKET_TTL = 5 * 60_000;
const STALE_WINDOW = 60 * 60_000;
const PAGE_SIZE = 250;

export async function getMarketCoins(limit = 100): Promise<Coin[]> {
  const safeLimit = Math.min(Math.max(limit, 1), initialCoins.length);
  const canonical = initialCoins.slice(0, safeLimit);

  try {
    const liveRows = await getLiveMarketRows(2);
    const liveById = new Map(liveRows.map((row) => [row.id, row]));
    return canonical.map((coin) => enrichCoin(coin, liveById.get(coin.externalId)));
  } catch (error) {
    console.error('Live market refresh unavailable; serving the canonical snapshot.', error);
    return canonical;
  }
}

export async function getMarketTickers(symbols: string[]): Promise<ProviderMarket[]> {
  const rows = await getLiveMarketRows(1);
  const wanted = new Set(symbols.map((symbol) => symbol.toLowerCase()));
  return rows.filter((row) => wanted.has(row.symbol.toLowerCase()));
}

export async function getMarketCoin(coinId: number): Promise<Coin | null> {
  const coin = initialCoins.find((item) => item.id === coinId);
  if (!coin) return null;
  try {
    const liveRows = await getLiveMarketRows(2);
    return enrichCoin(
      coin,
      liveRows.find((row) => row.id === coin.externalId),
    );
  } catch {
    return coin;
  }
}

export async function getCoinChart(
  coinId: number,
  range: '1H' | '4H' | '24H' | '7D' | '30D',
): Promise<ProviderChartPoint[]> {
  const coin = initialCoins.find((item) => item.id === coinId);
  if (!coin || coin.chart.source !== 'market') return [];
  const chartExternalId = coin.chart.externalId;
  const days = range === '7D' ? 7 : range === '30D' ? 30 : 1;
  const points = await cached(`chart:${coin.id}:${range}`, MARKET_TTL, STALE_WINDOW, () =>
    publicMarketProvider.getChart(chartExternalId, days),
  );
  if (range === '7D' || range === '30D' || range === '24H') return points;
  const hours = range === '1H' ? 1 : 4;
  const cutoff = Date.now() - hours * 60 * 60_000;
  return points.filter((point) => point.timestamp >= cutoff);
}

async function getLiveMarketRows(pageCount: number) {
  const pages = Array.from({ length: pageCount }, (_, index) => index + 1);
  const results = await mapConcurrent(pages, 2, (page) =>
    cached(`markets:${page}`, MARKET_TTL, STALE_WINDOW, () =>
      publicMarketProvider.getMarkets(page, PAGE_SIZE),
    ),
  );
  return results.flat();
}

function enrichCoin(coin: Coin, market?: ProviderMarket): Coin {
  if (!market) return coin;
  return {
    ...coin,
    logoUrl: market.image || coin.logoUrl,
    market: {
      ...coin.market,
      priceUsd: market.currentPrice,
      marketCapUsd: market.marketCap,
      volume24hUsd: market.volume24h,
      change24h: market.change24h,
      marketRank: market.marketCapRank,
      lastUpdatedAt: new Date().toISOString(),
    },
  };
}
