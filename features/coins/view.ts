import { NETWORKS } from './networks';
import type { Coin, CoinCategory } from './types';

export type CoinListItem = {
  coinId: number;
  externalId: string;
  rank: number;
  name: string;
  symbol: string;
  lifecycle: 'launched' | 'presale';
  chain: string;
  networkName: string;
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
  boost?: number;
  promoted: boolean;
  votes: number;
  watchCount: number;
  age: string;
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
    .filter((network) => network.enabled && network.id !== 'other')
    .map((network) => network.shortName),
];

export function toCoinListItem(coin: Coin, index: number): CoinListItem {
  const marketCap = coin.market.marketCapUsd ?? 0;
  const priceUsd = coin.market.priceUsd;
  const change = Number((coin.market.change24h ?? 0).toFixed(2));
  return {
    coinId: coin.id,
    externalId: coin.externalId,
    rank: coin.promoted.active ? coin.promoted.priority : (coin.market.marketRank ?? index + 1),
    name: coin.name,
    symbol: coin.symbol,
    lifecycle: coin.lifecycle,
    chain: NETWORKS[coin.network].shortName,
    networkName: NETWORKS[coin.network].name,
    logo: coin.symbol.slice(0, 1),
    ...(coin.logoUrl ? { image: coin.logoUrl } : {}),
    description: coin.description,
    color: coin.promoted.active ? 'violet' : 'market-logo',
    cap: formatMoney(coin.market.marketCapUsd),
    capN: marketCap,
    volume24h: formatMoney(coin.market.volume24hUsd),
    price: formatPrice(priceUsd),
    change,
    launch: coin.launchDate ? formatAge(coin.launchDate) : '—',
    ...(coin.boost.active ? { boost: coin.boost.multiplier } : {}),
    promoted: coin.promoted.active,
    votes: coin.community.weeklyVotes,
    watchCount: coin.community.watchlistCount,
    age: formatAge(coin.submittedAt),
    category: coin.category,
    trend:
      Math.abs(change) +
      Math.log10(Math.max(coin.market.volume24hUsd ?? 1, 1)) +
      coin.community.weeklyVotes,
    contractAddress: coin.contractAddress,
    ...(coin.dex.available ? { buyUrl: coin.dex.url } : {}),
  };
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
  const days = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000));
  if (days === 0) return 'Today';
  if (days < 30) return `${days}d ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;

  const years = Math.floor(months / 12);
  return `${years}y ago`;
}
