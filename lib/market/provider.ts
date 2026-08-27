export type ProviderMarket = {
  id: string;
  symbol: string;
  name: string;
  image: string;
  currentPrice: number | null;
  marketCap: number | null;
  marketCapRank: number | null;
  volume24h: number | null;
  change24h: number | null;
};

export type ProviderPlatform = {
  id: string;
  platforms: Record<string, string>;
};

export interface MarketDataProvider {
  getMarkets(page: number, perPage: number): Promise<ProviderMarket[]>;
  getPlatforms(): Promise<ProviderPlatform[]>;
}
