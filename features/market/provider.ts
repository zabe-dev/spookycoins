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

export type ProviderChartPoint = {
  timestamp: number;
  price: number;
};

export interface MarketDataProvider {
  getMarkets(page: number, perPage: number): Promise<ProviderMarket[]>;
  getChart(externalId: string, days: number): Promise<ProviderChartPoint[]>;
}
