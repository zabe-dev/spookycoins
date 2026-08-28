import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const apiBase = process.env.MARKET_DATA_API_URL || 'https://api.coingecko.com/api/v3';
const apiKey = process.env.MARKET_DATA_API_KEY;
const populatedAt = process.env.DATASET_POPULATED_AT || new Date().toISOString();
const outputPath = resolve('lib/projects/initial-dataset.generated.ts');

const platformNetworks = {
  ethereum: ['ethereum', 'ETH', 'ethereum'],
  'binance-smart-chain': ['bsc', 'BSC', 'bsc'],
  solana: ['solana', 'SOL', 'solana'],
  'polygon-pos': ['polygon', 'MATIC', 'polygon'],
  avalanche: ['avalanche', 'AVAX', 'avalanche'],
  'arbitrum-one': ['arbitrum', 'ARB', 'arbitrum'],
  base: ['base', 'BASE', 'base'],
  'optimistic-ethereum': ['optimism', 'OP', 'optimism'],
  dogechain: ['dogecoin', 'DOGE', 'dogechain'],
  tron: ['tron', 'TRX', 'tron'],
  fantom: ['fantom', 'FTM', 'fantom'],
  'kucoin-community-chain': ['kcc', 'KCC', 'kcc'],
  sui: ['sui', 'SUI', 'sui'],
  xrp: ['xrpl', 'XRPL', 'xrpl'],
};

const nativeCoinIds = new Set([
  'bitcoin',
  'ethereum',
  'binancecoin',
  'solana',
  'ripple',
  'cardano',
  'dogecoin',
  'tron',
  'avalanche-2',
  'matic-network',
  'polkadot',
  'bitcoin-cash',
  'litecoin',
  'sui',
  'fantom',
]);

async function request(path) {
  const headers = { accept: 'application/json' };
  if (apiKey) headers['x-cg-demo-api-key'] = apiKey;
  const response = await fetch(`${apiBase}${path}`, {
    headers,
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`Dataset request failed (${response.status})`);
  return response.json();
}

const [firstPage, secondPage, platformRows] = await Promise.all([
  request(
    '/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=false&price_change_percentage=24h',
  ),
  request(
    '/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=2&sparkline=false&price_change_percentage=24h',
  ),
  request('/coins/list?include_platform=true'),
]);

const platformsById = new Map(platformRows.map((row) => [row.id, row.platforms || {}]));
const realProjects = [...firstPage, ...secondPage]
  .filter((coin) => !nativeCoinIds.has(coin.id))
  .map((coin) => {
    const supportedPlatform = Object.entries(platformsById.get(coin.id) || {}).find(
      ([platformId, address]) => platformNetworks[platformId] && String(address).trim(),
    );
    if (!supportedPlatform) return null;
    const [platformId, contractAddress] = supportedPlatform;
    const [network, , dexSlug] = platformNetworks[platformId];
    return { coin, network, contractAddress: String(contractAddress), dexSlug };
  })
  .filter(Boolean)
  .slice(0, 99)
  .map(({ coin, network, contractAddress, dexSlug }, index) => ({
    id: 1001 + index,
    externalId: coin.id,
    name: coin.name,
    symbol: String(coin.symbol).toUpperCase(),
    slug: coin.id,
    assetType: 'token',
    network,
    contractAddress,
    logoUrl: coin.image || null,
    description: null,
    category: 'Other',
    launchDate: null,
    submittedAt: populatedAt,
    populatedAt,
    chart: { source: 'market', externalId: coin.id },
    dex: {
      available: true,
      provider: 'dexscreener',
      url: `https://dexscreener.com/${dexSlug}/${contractAddress}`,
    },
    boost: { active: false },
    promoted: { active: false },
    market: {
      priceUsd: coin.current_price ?? null,
      marketCapUsd: coin.market_cap ?? null,
      volume24hUsd: coin.total_volume ?? null,
      change24h: coin.price_change_percentage_24h ?? null,
      marketRank: coin.market_cap_rank ?? null,
      lastUpdatedAt: coin.last_updated ?? populatedAt,
    },
    community: { weeklyVotes: 0, totalVotes: 0, watchlistCount: 0 },
  }));

if (realProjects.length !== 99) {
  throw new Error(`Expected 99 supported token projects, received ${realProjects.length}.`);
}

const promotionEndsAt = new Date(
  new Date(populatedAt).getTime() + 7 * 24 * 60 * 60 * 1000,
).toISOString();
const dummyPromotedProject = {
  id: 1000,
  externalId: 'spookycoins-promoted-demo',
  name: 'Spooky',
  symbol: 'SPOOKY',
  slug: 'spooky-promoted-demo',
  assetType: 'token',
  network: 'solana',
  contractAddress: 'Spooky11111111111111111111111111111111111111',
  logoUrl: null,
  description: 'Demonstration listing used to preview promoted-project advertising.',
  category: 'Other',
  launchDate: null,
  submittedAt: populatedAt,
  populatedAt,
  chart: { source: 'unavailable' },
  dex: { available: false },
  boost: { active: true, multiplier: 500, startsAt: populatedAt, endsAt: promotionEndsAt },
  promoted: {
    active: true,
    startsAt: populatedAt,
    endsAt: promotionEndsAt,
    placement: 'promoted-table',
    priority: 1,
  },
  market: {
    priceUsd: null,
    marketCapUsd: null,
    volume24hUsd: null,
    change24h: null,
    marketRank: null,
    lastUpdatedAt: null,
  },
  community: { weeklyVotes: 0, totalVotes: 0, watchlistCount: 0 },
};

const projects = [dummyPromotedProject, ...realProjects];
const source = `/* This file is generated by scripts/generate-initial-dataset.mjs. */
import type { Project } from './types';

export const INITIAL_DATASET_POPULATED_AT = ${JSON.stringify(populatedAt)};

export const initialProjects = ${JSON.stringify(projects, null, 2)} satisfies Project[];
`;

await writeFile(outputPath, source, 'utf8');
console.log(`Generated ${projects.length} canonical token projects at ${outputPath}.`);
