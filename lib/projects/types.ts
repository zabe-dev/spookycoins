export type ProjectId = number;

/** UUID string used for private or sensitive records; never expose sequential IDs for these. */
export type PrivateRecordId = string;

export type NetworkId =
  | 'ethereum'
  | 'bsc'
  | 'solana'
  | 'polygon'
  | 'avalanche'
  | 'arbitrum'
  | 'base'
  | 'optimism'
  | 'dogecoin'
  | 'tron'
  | 'fantom'
  | 'kcc'
  | 'sui'
  | 'hood'
  | 'xrpl'
  | 'other';

export type ProjectCategory =
  | 'AI'
  | 'DeFi'
  | 'Fan Token'
  | 'Gambling'
  | 'Gaming'
  | 'Memecoins'
  | 'NFT Platform'
  | 'Other'
  | 'Play To Earn'
  | 'Pump.fun Tokens'
  | 'Utility Token';

export type ChartConfig =
  | { source: 'market'; externalId: string }
  | { source: 'dex'; network: NetworkId; poolAddress: string }
  | { source: 'external'; url: string }
  | { source: 'unavailable' };

export type DexConfig =
  | {
      available: true;
      provider: 'dexscreener' | 'geckoterminal' | 'custom';
      url: string;
      pairAddress?: string;
    }
  | { available: false };

export type BoostMultiplier = 10 | 30 | 50 | 100 | 500;

export type BoostState =
  | { active: false }
  | {
      active: true;
      multiplier: BoostMultiplier;
      startsAt: string;
      endsAt: string;
    };

export type PromotedState =
  | { active: false }
  | {
      active: true;
      startsAt: string;
      endsAt: string;
      placement: 'promoted-table';
      priority: number;
    };

export type ProjectMarketData = {
  priceUsd: number | null;
  marketCapUsd: number | null;
  volume24hUsd: number | null;
  change24h: number | null;
  marketRank: number | null;
  lastUpdatedAt: string | null;
};

export type ProjectCommunityData = {
  weeklyVotes: number;
  totalVotes: number;
  watchlistCount: number;
};

export type Project = {
  id: ProjectId;
  externalId: string;
  name: string;
  symbol: string;
  slug: string;
  assetType: 'token';
  network: NetworkId;
  contractAddress: string;
  logoUrl: string | null;
  description: string | null;
  category: ProjectCategory;
  launchDate: string | null;
  submittedAt: string;
  populatedAt: string;
  chart: ChartConfig;
  dex: DexConfig;
  boost: BoostState;
  promoted: PromotedState;
  market: ProjectMarketData;
  community: ProjectCommunityData;
};

export function isProjectId(value: unknown): value is ProjectId {
  return Number.isSafeInteger(value) && Number(value) >= 1000;
}
