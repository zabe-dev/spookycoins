import { NETWORKS } from './networks';
import type { Coin, CoinCategory } from './types';

const logoColors = ['cyan', 'orange', 'pink', 'blue', 'green', 'yellow', 'red', 'violet'] as const;

export type CoinListItem = {
  coinId: number;
  externalId: string;
  rank: number;
  name: string;
  symbol: string;
  lifecycle: 'launched' | 'presale';
  chain: string;
  networkName: string;
  chainIcon: string | null;
  logo: string;
  image?: string;
  description: string | null;
  color: string;
  cap: string;
  capN: number;
  volume24h: string;
  price: string;
  change: number;
  launch: string;
  launchTimestamp: string | null;
  boost?: number;
  promoted: boolean;
  rawVotes: number;
  votes: number;
  watchCount: number;
  hasVoted: boolean;
  isWatching: boolean;
  age: string;
  submittedTimestamp: string;
  category: CoinCategory;
  trend: number;
  contractAddress: string;
  buyUrl?: string;
};

export type CoinSortKey =
  'rank' | 'name' | 'capN' | 'price' | 'change' | 'launch' | 'boost' | 'votes' | 'age';

export const coinCategories: Array<'All' | CoinCategory> = [
  'All',
  'AI',
  'DeFi',
  'Fan Token',
  'Gambling',
  'Gaming',
  'Memecoins',
  'NFT Platform',
  'Other',
  'Play To Earn',
  'Pump.fun Tokens',
  'Utility Token',
];

export const coinChainOptions = [
  'All chains',
  ...Object.values(NETWORKS)
    .filter((network) => network.enabled)
    .map((network) => network.shortName),
];

const otherChainIconUrl = 'https://api.iconify.design/mdi:help-circle-outline.svg?color=%23a8b0bd';

export const coinChainChoices = [
  { label: 'All chains', iconUrl: null },
  ...Object.values(NETWORKS)
    .filter((network) => network.enabled)
    .map((network) => ({
      label: network.shortName,
      iconUrl: network.id === 'other' ? otherChainIconUrl : network.iconUrl,
    })),
];

export function toCoinListItem(coin: Coin, index: number): CoinListItem {
  const marketCap = coin.market.marketCapUsd ?? 0;
  const priceUsd = coin.market.priceUsd;
  const change = Number((coin.market.change24h ?? 0).toFixed(2));
  const boostPackage = coin.boost.active ? coin.boost.multiplier : null;
  const rawVotes = coin.community.weeklyVotes;
  const boostedVotes = rawVotes * getBoostVoteFactor(boostPackage);
  return {
    coinId: coin.id,
    externalId: coin.externalId,
    rank: coin.promoted.active ? coin.promoted.priority : (coin.market.marketRank ?? index + 1),
    name: coin.name,
    symbol: coin.symbol,
    lifecycle: coin.lifecycle,
    chain: NETWORKS[coin.network].shortName,
    networkName: NETWORKS[coin.network].name,
    chainIcon: NETWORKS[coin.network].iconUrl,
    logo: coin.symbol.slice(0, 1),
    ...(coin.logoUrl ? { image: coin.logoUrl } : {}),
    description: coin.description,
    color: coin.promoted.active ? 'yellow' : logoColors[coin.id % logoColors.length],
    cap: formatMoney(coin.market.marketCapUsd),
    capN: marketCap,
    volume24h: formatMoney(coin.market.volume24hUsd),
    price: formatPrice(priceUsd),
    change,
    launch: coin.launchDate ? formatAge(coin.launchDate) : '—',
    launchTimestamp: coin.launchDate,
    ...(boostPackage ? { boost: boostPackage } : {}),
    promoted: coin.promoted.active,
    rawVotes,
    votes: boostedVotes,
    watchCount: coin.community.watchlistCount,
    hasVoted: Boolean(coin.community.userHasVoted),
    isWatching: Boolean(coin.community.userWatching),
    age: formatAge(coin.submittedAt),
    submittedTimestamp: coin.submittedAt,
    category: coin.category,
    trend: Math.abs(change) + Math.log10(Math.max(coin.market.volume24hUsd ?? 1, 1)) + boostedVotes,
    contractAddress: coin.contractAddress,
    ...(coin.dex.available ? { buyUrl: coin.dex.url } : {}),
  };
}

export function getBoostVoteFactor(boostPackage: number | null | undefined) {
  if (boostPackage === 10 || boostPackage === 30) return 2;
  if (boostPackage === 50 || boostPackage === 100) return 3;
  if (boostPackage === 500) return 5;
  return 1;
}

export function formatVotes(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}

function formatMoney(value: number | null) {
  if (value === null) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPrice(value: number | null) {
  if (value === null) return '—';
  const digits = value >= 1 ? 2 : value >= 0.01 ? 4 : 8;
  return `$${value.toLocaleString('en-US', { maximumFractionDigits: digits })}`;
}

function formatAge(value: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;

  const hours = Math.floor(seconds / 3_600);
  if (hours < 24) return `${Math.max(1, hours)}h ago`;

  const days = Math.floor(seconds / 86_400);
  if (days < 30) return `${days}d ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}m ago`;

  const years = Math.floor(months / 12);
  return `${years}y ago`;
}
