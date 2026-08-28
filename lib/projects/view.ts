import { NETWORKS } from './networks';
import type { Project, ProjectCategory } from './types';

export type ProjectListItem = {
  projectId: number;
  externalId: string;
  rank: number;
  name: string;
  symbol: string;
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
  category: ProjectCategory;
  trend: number;
  contractAddress: string;
  buyUrl?: string;
};

export type ProjectSortKey =
  'rank' | 'name' | 'capN' | 'price' | 'change' | 'launch' | 'boost' | 'votes' | 'age';

export const projectCategories: Array<'All' | ProjectCategory> = [
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

export const projectChainOptions = [
  'All chains',
  ...Object.values(NETWORKS)
    .filter((network) => network.enabled && network.id !== 'other')
    .map((network) => network.shortName),
];

export function toProjectListItem(project: Project, index: number): ProjectListItem {
  const marketCap = project.market.marketCapUsd ?? 0;
  const priceUsd = project.market.priceUsd;
  const change = Number((project.market.change24h ?? 0).toFixed(2));
  return {
    projectId: project.id,
    externalId: project.externalId,
    rank: project.promoted.active
      ? project.promoted.priority
      : (project.market.marketRank ?? index + 1),
    name: project.name,
    symbol: project.symbol,
    chain: NETWORKS[project.network].shortName,
    networkName: NETWORKS[project.network].name,
    logo: project.symbol.slice(0, 1),
    ...(project.logoUrl ? { image: project.logoUrl } : {}),
    description: project.description,
    color: project.promoted.active ? 'violet' : 'market-logo',
    cap: formatMoney(project.market.marketCapUsd),
    capN: marketCap,
    volume24h: formatMoney(project.market.volume24hUsd),
    price: formatPrice(priceUsd),
    change,
    launch: project.launchDate ? formatDate(project.launchDate) : '—',
    ...(project.boost.active ? { boost: project.boost.multiplier } : {}),
    promoted: project.promoted.active,
    votes: project.community.weeklyVotes,
    watchCount: project.community.watchlistCount,
    age: formatAge(project.submittedAt),
    category: project.category,
    trend:
      Math.abs(change) +
      Math.log10(Math.max(project.market.volume24hUsd ?? 1, 1)) +
      project.community.weeklyVotes,
    contractAddress: project.contractAddress,
    ...(project.dex.available ? { buyUrl: project.dex.url } : {}),
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit' }).format(
    new Date(value),
  );
}

function formatAge(value: string) {
  const days = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000));
  return days === 0 ? 'Today' : `${days}d ago`;
}
