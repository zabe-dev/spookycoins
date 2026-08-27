import type { MarketDataProvider, ProviderMarket, ProviderPlatform } from '../provider';

const API_BASE = process.env.MARKET_DATA_API_URL ?? 'https://api.coingecko.com/api/v3';

type MarketResponse = {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number | null;
  market_cap: number | null;
  market_cap_rank: number | null;
  total_volume: number | null;
  price_change_percentage_24h: number | null;
};

async function request<T>(path: string): Promise<T> {
  const headers: HeadersInit = { accept: 'application/json' };
  const apiKey = process.env.MARKET_DATA_API_KEY;
  if (apiKey) headers['x-cg-demo-api-key'] = apiKey;

  const response = await fetch(`${API_BASE}${path}`, {
    headers,
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) throw new Error(`Market data request failed (${response.status})`);
  return response.json() as Promise<T>;
}

export const publicMarketProvider: MarketDataProvider = {
  async getMarkets(page, perPage) {
    const rows = await request<MarketResponse[]>(
      `/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${perPage}&page=${page}&sparkline=false&price_change_percentage=24h`,
    );
    return rows.map((row): ProviderMarket => ({
      id: row.id,
      symbol: row.symbol,
      name: row.name,
      image: row.image,
      currentPrice: row.current_price,
      marketCap: row.market_cap,
      marketCapRank: row.market_cap_rank,
      volume24h: row.total_volume,
      change24h: row.price_change_percentage_24h,
    }));
  },

  getPlatforms() {
    return request<ProviderPlatform[]>('/coins/list?include_platform=true');
  },
};
