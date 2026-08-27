import { coins as fallbackCoins, type Coin } from '@/lib/market-data';
import { cached } from './cache';
import { mapConcurrent } from './concurrency';
import { publicMarketProvider } from './providers/public-provider';

const MARKET_TTL = 5 * 60_000;
const METADATA_TTL = 24 * 60 * 60_000;
const STALE_WINDOW = 60 * 60_000;
const pageSize = 250;

const chainLabels: Record<string, string> = {
  ethereum: 'ETH',
  'binance-smart-chain': 'BSC',
  'polygon-pos': 'MATIC',
  solana: 'SOL',
  avalanche: 'AVAX',
  'arbitrum-one': 'ARB',
  base: 'BASE',
  'optimistic-ethereum': 'OP',
  tron: 'TRX',
  sui: 'SUI',
  'xdc-network': 'XRPL',
};

function compactMoney(value: number | null) {
  if (value === null) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(value);
}

function price(value: number | null) {
  if (value === null) return '—';
  const digits = value >= 1 ? 2 : value >= 0.01 ? 4 : 8;
  return `$${value.toLocaleString('en-US', { maximumFractionDigits: digits })}`;
}

export async function getMarketCoins(limit = 100): Promise<Coin[]> {
  const safeLimit = Math.min(Math.max(limit, 1), 500);
  try {
    const pages = Array.from({ length: Math.ceil(safeLimit / pageSize) }, (_, index) => index + 1);
    const [marketPages, platforms] = await Promise.all([
      mapConcurrent(pages, 2, (page) =>
        cached(`markets:${page}`, MARKET_TTL, STALE_WINDOW, () =>
          publicMarketProvider.getMarkets(page, pageSize),
        ),
      ),
      cached('platforms', METADATA_TTL, STALE_WINDOW, () => publicMarketProvider.getPlatforms()),
    ]);

    const platformMap = new Map(platforms.map((item) => [item.id, item.platforms]));
    return marketPages
      .flat()
      .slice(0, safeLimit)
      .map((item, index) => {
        const platformEntries = Object.entries(platformMap.get(item.id) ?? {}).filter(
          ([, address]) => Boolean(address),
        );
        const [platform = '', contractAddress = ''] = platformEntries[0] ?? [];
        const change = Number((item.change24h ?? 0).toFixed(2));
        return {
          externalId: item.id,
          rank: item.marketCapRank ?? index + 1,
          name: item.name,
          symbol: item.symbol.toUpperCase(),
          chain: chainLabels[platform] ?? (platform ? platform.slice(0, 6).toUpperCase() : 'COIN'),
          contractAddress,
          image: item.image,
          logo: item.symbol.slice(0, 1).toUpperCase(),
          color: 'market-logo',
          cap: compactMoney(item.marketCap),
          capN: item.marketCap ?? 0,
          price: price(item.currentPrice),
          change,
          launch: '—',
          votes: 0,
          age: 'Imported',
          category: 'Other',
          trend: Math.abs(change) + Math.log10(Math.max(item.volume24h ?? 1, 1)),
        } satisfies Coin;
      });
  } catch (error) {
    console.error('Using fallback market data:', error);
    return fallbackCoins;
  }
}
