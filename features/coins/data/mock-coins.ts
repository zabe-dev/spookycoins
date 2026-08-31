import { validateCoin } from '../schemas/validation';
import type { BoostMultiplier, Coin, CoinCategory, NetworkId } from '../types';
import { toCoinListItem } from '../view';

export const MOCK_DATASET_POPULATED_AT = '2026-08-28T00:00:00.000Z';

// Flip this to true to simulate an empty leaderboard (no mock coins at all).
const USE_EMPTY_DATASET = false;

const boostWindow = {
  startsAt: '2026-08-24T00:00:00.000Z',
  endsAt: '2026-08-31T00:00:00.000Z',
};

type MockCoinInput = {
  id: number;
  name: string;
  symbol: string;
  lifecycle?: 'launched' | 'presale';
  network: NetworkId;
  category: CoinCategory;
  rank: number;
  price: number | null;
  marketCap: number | null;
  volume: number | null;
  change: number;
  votes: number;
  watchers: number;
  submittedDaysAgo: number;
  launchDate?: string | null;
  boost?: BoostMultiplier;
  promoted?: boolean;
};

const populatedProjects: MockCoinInput[] = [
  {
    id: 1000,
    name: 'SPOOKY',
    symbol: 'SPKY',
    network: 'solana',
    category: 'Memecoins',
    rank: 1,
    price: 0.00042,
    marketCap: 420000,
    volume: 92000,
    change: 18.4,
    votes: 1840,
    watchers: 1260,
    submittedDaysAgo: 1,
    boost: 500,
    promoted: true,
  },
  {
    id: 1001,
    name: 'MoonPump',
    symbol: 'MPUMP',
    network: 'solana',
    category: 'Pump.fun Tokens',
    rank: 1,
    price: 0.0031,
    marketCap: 1550000,
    volume: 238000,
    change: 42.8,
    votes: 9420,
    watchers: 5190,
    submittedDaysAgo: 2,
    boost: 10,
  },
  {
    id: 1002,
    name: 'ByteGoblin',
    symbol: 'BYTEG',
    network: 'base',
    category: 'Gaming',
    rank: 2,
    price: 0.017,
    marketCap: 3200000,
    volume: 412000,
    change: 16.6,
    votes: 8210,
    watchers: 4470,
    submittedDaysAgo: 4,
    boost: 30,
  },
  {
    id: 1003,
    name: 'Vaultly',
    symbol: 'VLT',
    network: 'ethereum',
    category: 'DeFi',
    rank: 3,
    price: 0.24,
    marketCap: 9800000,
    volume: 1200000,
    change: 6.9,
    votes: 7780,
    watchers: 3910,
    submittedDaysAgo: 6,
    boost: 50,
  },
  {
    id: 1004,
    name: 'GhostNode',
    symbol: 'GHNODE',
    network: 'bsc',
    category: 'Utility Token',
    rank: 4,
    price: 0.081,
    marketCap: 6600000,
    volume: 870000,
    change: 11.2,
    votes: 7215,
    watchers: 3685,
    submittedDaysAgo: 3,
    boost: 100,
  },
  {
    id: 1005,
    name: 'GoldenTicker',
    symbol: 'GTICK',
    network: 'polygon',
    category: 'Memecoins',
    rank: 5,
    price: 0.0068,
    marketCap: 4100000,
    volume: 554000,
    change: 25.3,
    votes: 6890,
    watchers: 3440,
    submittedDaysAgo: 5,
    boost: 500,
  },
  {
    id: 1006,
    name: 'Orbit Arcade',
    symbol: 'ORBIT',
    network: 'avalanche',
    category: 'Play To Earn',
    rank: 6,
    price: 0.034,
    marketCap: 2750000,
    volume: 188000,
    change: -2.1,
    votes: 5140,
    watchers: 2890,
    submittedDaysAgo: 8,
  },
  {
    id: 1007,
    name: 'FreshFi',
    symbol: 'FRESH',
    network: 'base',
    category: 'DeFi',
    rank: 7,
    lifecycle: 'presale',
    price: null,
    marketCap: null,
    volume: null,
    change: 0,
    votes: 3310,
    watchers: 2760,
    submittedDaysAgo: 0,
    launchDate: null,
  },
  {
    id: 1008,
    name: 'PixelHaunt',
    symbol: 'PXH',
    network: 'ethereum',
    category: 'NFT Platform',
    rank: 8,
    lifecycle: 'presale',
    price: null,
    marketCap: null,
    volume: null,
    change: 0,
    votes: 4090,
    watchers: 3105,
    submittedDaysAgo: 1,
    launchDate: null,
  },
  {
    id: 1009,
    name: 'CasinoCrow',
    symbol: 'CROW',
    network: 'tron',
    category: 'Gambling',
    rank: 9,
    price: 0.0044,
    marketCap: 740000,
    volume: 88000,
    change: 5.5,
    votes: 2875,
    watchers: 1980,
    submittedDaysAgo: 2,
  },
  {
    id: 1010,
    name: 'FanForge',
    symbol: 'FORGE',
    network: 'arbitrum',
    category: 'Fan Token',
    rank: 10,
    lifecycle: 'presale',
    price: null,
    marketCap: null,
    volume: null,
    change: 0,
    votes: 2595,
    watchers: 1640,
    submittedDaysAgo: 1,
    launchDate: null,
  },
  {
    id: 1011,
    name: 'SuiSpecter',
    symbol: 'SPECT',
    network: 'sui',
    category: 'Gaming',
    rank: 11,
    lifecycle: 'presale',
    price: null,
    marketCap: null,
    volume: null,
    change: 0,
    votes: 6025,
    watchers: 4200,
    submittedDaysAgo: 3,
    launchDate: null,
  },
  {
    id: 1012,
    name: 'MaticMischief',
    symbol: 'MISCH',
    network: 'polygon',
    category: 'Memecoins',
    rank: 12,
    price: 0.0019,
    marketCap: 530000,
    volume: 72000,
    change: 31.4,
    votes: 5870,
    watchers: 3860,
    submittedDaysAgo: 4,
  },
  {
    id: 1013,
    name: 'BaseBats',
    symbol: 'BATS',
    network: 'base',
    category: 'Memecoins',
    rank: 13,
    price: 0.0077,
    marketCap: 880000,
    volume: 99000,
    change: 22.2,
    votes: 5445,
    watchers: 4645,
    submittedDaysAgo: 2,
  },
  {
    id: 1014,
    name: 'TronTavern',
    symbol: 'TAV',
    network: 'tron',
    category: 'Other',
    rank: 14,
    price: 0.011,
    marketCap: 970000,
    volume: 121000,
    change: 4.4,
    votes: 2310,
    watchers: 5025,
    submittedDaysAgo: 7,
  },
  {
    id: 1015,
    name: 'ArbiOwls',
    symbol: 'OWLS',
    network: 'arbitrum',
    category: 'NFT Platform',
    rank: 15,
    price: 0.029,
    marketCap: 1650000,
    volume: 201000,
    change: -3.8,
    votes: 1980,
    watchers: 4740,
    submittedDaysAgo: 5,
  },
  {
    id: 1016,
    name: 'Presale Phantom',
    symbol: 'PHANT',
    network: 'bsc',
    category: 'Utility Token',
    rank: 16,
    price: null,
    marketCap: null,
    volume: null,
    change: 0,
    votes: 1410,
    watchers: 1175,
    submittedDaysAgo: 0,
    lifecycle: 'presale',
    launchDate: null,
  },
];

const mockProjects: MockCoinInput[] = USE_EMPTY_DATASET ? [] : populatedProjects;

export const mockCoins = mockProjects.map(toMockCoin) satisfies Coin[];
export const INITIAL_DATASET_POPULATED_AT = MOCK_DATASET_POPULATED_AT;
export const mockCoinListItems = mockCoins.map(toCoinListItem);

const ids = mockCoins.map((coin) => coin.id);
const promoted = mockCoins.filter((coin) => coin.promoted.active);
const invalid = mockCoins.flatMap((coin) =>
  validateCoin(coin).map((error) => `${coin.id}: ${error}`),
);

if (new Set(ids).size !== ids.length) throw new Error('Mock coin IDs must be unique.');

// Skip the "exactly one promoted coin" check entirely when testing an empty dataset.
if (!USE_EMPTY_DATASET) {
  if (promoted.length !== 1 || promoted[0].externalId !== 'spookycoins-promoted-demo') {
    throw new Error('Mock dataset must contain exactly one dummy promoted coin.');
  }
}

if (invalid.length) throw new Error(`Invalid mock dataset:\n${invalid.join('\n')}`);

function toMockCoin(project: MockCoinInput): Coin {
  const submittedAt = daysAgo(project.submittedDaysAgo);
  const contractAddress = `${project.symbol}${String(project.id).padEnd(38, '0')}`;

  return {
    id: project.id,
    externalId: project.promoted
      ? 'spookycoins-promoted-demo'
      : `mock-${project.symbol.toLowerCase()}`,
    name: project.name,
    symbol: project.symbol,
    slug: project.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, ''),
    assetType: 'token',
    lifecycle: project.lifecycle ?? 'launched',
    network: project.network,
    contractAddress,
    logoUrl: null,
    description: `${project.name} is a mock community-submitted crypto project used for the SpookyCoins homepage prototype.`,
    category: project.category,
    launchDate:
      project.launchDate === undefined
        ? daysAgo(project.submittedDaysAgo + 14)
        : project.launchDate,
    presaleEndDate:
      (project.lifecycle ?? 'launched') === 'presale'
        ? daysAgo(project.submittedDaysAgo - 7)
        : null,
    submittedAt,
    populatedAt: MOCK_DATASET_POPULATED_AT,
    chart: { source: 'unavailable' },
    dex: {
      available: true,
      provider: 'dexscreener',
      url: `https://dexscreener.com/${project.network}/${contractAddress}`,
    },
    boost: project.boost
      ? {
          active: true,
          multiplier: project.boost,
          ...boostWindow,
        }
      : { active: false },
    promoted: project.promoted
      ? {
          active: true,
          placement: 'promoted-table',
          priority: 1,
          ...boostWindow,
        }
      : { active: false },
    market: {
      priceUsd: project.price,
      marketCapUsd: project.marketCap,
      volume24hUsd: project.volume,
      change24h: project.change,
      marketRank: project.rank,
      lastUpdatedAt: MOCK_DATASET_POPULATED_AT,
    },
    community: {
      weeklyVotes: project.votes,
      totalVotes: project.votes * 8,
      watchlistCount: project.watchers,
    },
  };
}

function daysAgo(days: number) {
  const date = new Date(MOCK_DATASET_POPULATED_AT);
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString();
}
