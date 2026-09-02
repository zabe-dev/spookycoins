#!/usr/bin/env node

/**
 * Imports random non-major tokens from Mobula into the current SpookyCoins schema.
 *
 * Usage:
 *   npm run import:mobula
 *   npm run import:mobula -- --limit=150
 *   npm run import:mobula -- --dry-run
 *   npm run import:mobula -- --dry-run --debug
 *
 * This script writes only to tables the app currently reads:
 *   - coins
 *   - market_snapshots
 *   - coin_links
 *
 * It intentionally does not write market_sources because the current app pulls
 * market data from coins.chain + coins.contract_address. Chart and DEX links
 * are generated as best-effort defaults from chain + contract address.
 */

import postgres from 'postgres';

const MOBULA_BASE_URL = 'https://api.mobula.io/api/1/all';
const MOBULA_API_KEY = process.env.MOBULA_API_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

const args = process.argv.slice(2);
const limitArg = args.find((arg) => arg.startsWith('--limit='));
const TARGET_COUNT = readPositiveInteger(limitArg?.split('=')[1], 250);
const DRY_RUN = args.includes('--dry-run');
const DEBUG = args.includes('--debug');
const RANDOMIZE = !args.includes('--no-random');
const EXCLUDE_TOP_RANK = readPositiveInteger(
  args.find((arg) => arg.startsWith('--exclude-top-rank='))?.split('=')[1],
  150,
);

if (!DATABASE_URL && !DRY_RUN) {
  throw new Error('DATABASE_URL is required for a real import. Use --dry-run to preview only.');
}

const db = DATABASE_URL
  ? postgres(DATABASE_URL, {
      max: 1,
      transform: postgres.camel,
    })
  : null;

const chainKeys = ['ethereum', 'bsc', 'polygon', 'arbitrum', 'base', 'solana'];

const chainAliases = {
  ethereum: (name) => name === 'ethereum',
  bsc: (name) =>
    name === 'bsc' ||
    name === 'bnb' ||
    name.includes('bnb smart chain') ||
    name.includes('binance smart chain'),
  polygon: (name) => name === 'polygon' || name === 'matic' || name.includes('polygon'),
  arbitrum: (name) => name.includes('arbitrum'),
  base: (name) => name === 'base',
  solana: (name) => name === 'solana',
};

const dexSwapUrlBuilders = {
  solana: (address) => `https://raydium.io/swap/?inputMint=sol&outputMint=${address}`,
  ethereum: (address) => `https://app.uniswap.org/swap?outputCurrency=${address}&chain=mainnet`,
  arbitrum: (address) => `https://app.uniswap.org/swap?outputCurrency=${address}&chain=arbitrum`,
  base: (address) => `https://app.uniswap.org/swap?outputCurrency=${address}&chain=base`,
  bsc: (address) => `https://pancakeswap.finance/swap?outputCurrency=${address}`,
  polygon: (address) => `https://quickswap.exchange/#/swap?outputCurrency=${address}`,
};

const chartUrlBuilders = {
  ethereum: (address) => `https://dexscreener.com/ethereum/${address}`,
  bsc: (address) => `https://dexscreener.com/bsc/${address}`,
  polygon: (address) => `https://dexscreener.com/polygon/${address}`,
  arbitrum: (address) => `https://dexscreener.com/arbitrum/${address}`,
  base: (address) => `https://dexscreener.com/base/${address}`,
  solana: (address) => `https://dexscreener.com/solana/${address}`,
};

const symbolDenylist = new Set(
  [
    'USDT',
    'USDC',
    'USDC.E',
    'DAI',
    'BUSD',
    'TUSD',
    'USDD',
    'FDUSD',
    'USDE',
    'PYUSD',
    'WETH',
    'WBTC',
    'WBNB',
    'WSOL',
    'WMATIC',
    'WAVAX',
    'ETH',
    'BNB',
    'SOL',
    'BTC',
    'MATIC',
    'AVAX',
    'STETH',
    'WSTETH',
    'WEETH',
    'CBBTC',
    'CBETH',
    'RETH',
    'LINK',
    'UNI',
    'AAVE',
    'MKR',
    'LDO',
    'ARB',
    'OP',
  ].map((symbol) => symbol.toUpperCase()),
);

function matchChain(blockchainName) {
  const normalized = blockchainName.toLowerCase().trim();
  return chainKeys.find((chain) => chainAliases[chain](normalized));
}

async function fetchMobulaAssets() {
  const url = new URL(MOBULA_BASE_URL);
  url.searchParams.set(
    'fields',
    [
      'price',
      'market_cap',
      'market_cap_diluted',
      'liquidity',
      'volume',
      'price_change_24h',
      'blockchains',
      'contracts',
      'logo',
      'rank',
      'total_supply',
      'holders_count',
      'description',
    ].join(','),
  );

  const response = await fetch(url, {
    headers: MOBULA_API_KEY ? { Authorization: MOBULA_API_KEY } : {},
  });

  if (!response.ok) {
    throw new Error(`Mobula request failed: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();
  const list = Array.isArray(json) ? json : json?.data;

  if (!Array.isArray(list)) {
    console.error('Unexpected Mobula response shape:', JSON.stringify(json).slice(0, 1500));
    throw new Error('Mobula response was not a token list.');
  }

  if (DEBUG && list.length) {
    console.log('Sample Mobula item:');
    console.log(JSON.stringify(list[0], null, 2));
  }

  return list;
}

function findTargetContract(item) {
  const blockchains = pickStringArray(item, ['blockchains']);
  const contracts = pickStringArray(item, ['contracts']);

  for (let index = 0; index < blockchains.length; index += 1) {
    const chain = matchChain(blockchains[index]);
    const address = contracts[index]?.trim();
    if (chain && address) return { blockchain: blockchains[index], address, chain };
  }

  return null;
}

function buildToken(item) {
  const contract = findTargetContract(item);
  if (!contract) return null;

  const price = pickNumber(item, ['price']);
  if (price === null || price <= 0) return null;

  const marketCap = pickNumber(item, ['market_cap', 'marketCap']);
  if (marketCap === null || marketCap <= 0) return null;

  const symbol = pickString(item, ['symbol']) || '???';
  if (symbolDenylist.has(symbol.toUpperCase())) return null;

  const rank = pickNumber(item, ['rank']);
  if (EXCLUDE_TOP_RANK > 0 && rank !== null && rank <= EXCLUDE_TOP_RANK) return null;

  return {
    mobulaId: pickNumber(item, ['id']),
    name: pickString(item, ['name']) || 'Unknown',
    symbol,
    logo: pickString(item, ['logo', 'logoUrl', 'logo_url']),
    description: pickString(item, ['description']),
    price,
    marketCap,
    fdv: pickNumber(item, ['market_cap_diluted', 'marketCapDiluted', 'fully_diluted_valuation']),
    volume: pickNumber(item, ['volume', 'volume24h', 'volume_24h']),
    change24h: pickNumber(item, ['price_change_24h', 'priceChange24h']),
    liquidity: pickNumber(item, ['liquidity']),
    totalSupply: pickNumber(item, ['total_supply', 'totalSupply']),
    holdersCount: pickInteger(item, ['holders_count', 'holdersCount']),
    rank,
    contract,
    chartUrl: chartUrlBuilders[contract.chain](contract.address),
    dexUrl: dexSwapUrlBuilders[contract.chain](contract.address),
    launchDate: null,
  };
}

async function upsertToken(token, slug) {
  if (!db) throw new Error('DATABASE_URL is required.');

  await db.begin(async (tx) => {
    const existing = await tx`
      select id
      from coins
      where lower(chain) = lower(${token.contract.chain})
        and lower(contract_address) = lower(${token.contract.address})
      limit 1
    `;
    const coinId = existing[0]?.id || (await readNextCoinId(tx));
    const now = new Date();

    await tx`
      insert into coins (
        id, slug, name, symbol, logo_url, description, category, chain, contract_address,
        launch_date, listing_source, listing_status, is_presale, submitted_at, created_at, updated_at
      )
      values (
        ${coinId}, ${slug}, ${token.name}, ${token.symbol}, ${token.logo}, ${token.description},
        'Other', ${token.contract.chain}, ${token.contract.address}, ${token.launchDate},
        'imported', 'active', false, ${now}, ${now}, ${now}
      )
      on conflict (id) do update set
        name = excluded.name,
        symbol = excluded.symbol,
        logo_url = excluded.logo_url,
        description = excluded.description,
        chain = excluded.chain,
        contract_address = excluded.contract_address,
        launch_date = excluded.launch_date,
        listing_source = excluded.listing_source,
        listing_status = excluded.listing_status,
        is_presale = excluded.is_presale,
        updated_at = excluded.updated_at
    `;

    await tx`
      insert into market_snapshots (
        coin_id, price_usd, market_cap_usd, volume_24h_usd, change_24h,
        liquidity_usd, fdv_usd, total_supply, holders_count, market_rank, recorded_at
      )
      values (
        ${coinId}, ${toDbNumber(token.price)}, ${toDbNumber(token.marketCap)},
        ${toDbNumber(token.volume)}, ${toDbNumber(token.change24h)}, ${toDbNumber(token.liquidity)},
        ${toDbNumber(token.fdv)}, ${toDbNumber(token.totalSupply)}, ${token.holdersCount},
        ${token.rank}, ${now}
      )
    `;

    await upsertCoinLink(tx, coinId, 'dex', token.dexUrl, now);
    if (token.chartUrl) await upsertCoinLink(tx, coinId, 'chart', token.chartUrl, now);

    return coinId;
  });
}

async function readNextCoinId(tx) {
  const rows = await tx`select coalesce(max(id), 999) + 1 as next_id from coins`;
  return rows[0].nextId;
}

async function upsertCoinLink(tx, coinId, type, url, now) {
  await tx`
    insert into coin_links (coin_id, type, url, created_at, updated_at)
    values (${coinId}, ${type}, ${url}, ${now}, ${now})
    on conflict (coin_id, type) do update set
      url = excluded.url,
      updated_at = excluded.updated_at
  `;
}

async function loadExistingSlugs() {
  if (!db) return new Set();
  const rows = await db`select slug from coins`;
  return new Set(rows.map((row) => row.slug));
}

function uniqueSlug(base, taken) {
  const safeBase = base || 'token';
  let slug = safeBase;
  let index = 2;

  while (taken.has(slug)) {
    slug = `${safeBase}-${index}`;
    index += 1;
  }

  taken.add(slug);
  return slug;
}

function slugify(input) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function randomSplit(total, keys, available) {
  const weights = keys.map(() => Math.random() + 0.1);
  const weightSum = weights.reduce((sum, weight) => sum + weight, 0);
  const split = Object.fromEntries(
    keys.map((key, index) => [
      key,
      Math.min(available[key], Math.round((weights[index] / weightSum) * total)),
    ]),
  );

  let assigned = keys.reduce((sum, key) => sum + split[key], 0);
  let guard = 0;

  while (assigned !== total && guard < 10_000) {
    guard += 1;

    if (assigned < total) {
      const candidates = keys.filter((key) => split[key] < available[key]);
      if (!candidates.length) break;
      split[randomItem(candidates)] += 1;
      assigned += 1;
    } else {
      const candidates = keys.filter((key) => split[key] > 0);
      if (!candidates.length) break;
      split[randomItem(candidates)] -= 1;
      assigned -= 1;
    }
  }

  return split;
}

function shuffle(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function pick(obj, keys) {
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null) return obj[key];
  }
  return undefined;
}

function pickNumber(obj, keys) {
  const value = pick(obj, keys);
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function pickInteger(obj, keys) {
  const value = pickNumber(obj, keys);
  return Number.isSafeInteger(value) ? value : null;
}

function pickString(obj, keys) {
  const value = pick(obj, keys);
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function pickStringArray(obj, keys) {
  const value = pick(obj, keys);
  return Array.isArray(value) ? value.filter((item) => typeof item === 'string') : [];
}

function toDbNumber(value) {
  return Number.isFinite(value) ? String(value) : null;
}

function readPositiveInteger(value, fallback) {
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0 ? number : fallback;
}

async function main() {
  console.log('Fetching assets from Mobula...');
  const raw = await fetchMobulaAssets();
  const matchedAll = raw.map(buildToken).filter(Boolean);

  const byChain = Object.fromEntries(chainKeys.map((chain) => [chain, []]));
  for (const token of matchedAll) byChain[token.contract.chain].push(token);

  const available = Object.fromEntries(chainKeys.map((chain) => [chain, byChain[chain].length]));
  const emptyChains = chainKeys.filter((chain) => available[chain] === 0);
  if (emptyChains.length) console.warn(`No eligible tokens found for: ${emptyChains.join(', ')}`);

  console.log(
    `Matched ${matchedAll.length} eligible tokens: ${chainKeys
      .map((chain) => `${chain}=${available[chain]}`)
      .join(', ')}. Excluding rank <= ${EXCLUDE_TOP_RANK}.`,
  );

  const perChainCount = randomSplit(TARGET_COUNT, chainKeys, available);
  const selectedByChain = chainKeys.flatMap((chain) => {
    const pool = RANDOMIZE
      ? shuffle(byChain[chain])
      : [...byChain[chain]].sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity));
    return pool.slice(0, perChainCount[chain]);
  });
  const tokens = RANDOMIZE ? shuffle(selectedByChain) : selectedByChain;

  console.log(
    `Selected ${tokens.length}/${TARGET_COUNT}: ${chainKeys
      .map((chain) => `${chain}=${perChainCount[chain]}`)
      .join(', ')}.`,
  );

  console.log('Chart and DEX links will be generated as best-effort defaults.');

  if (DRY_RUN) {
    console.table(
      tokens.map((token) => ({
        mobulaId: token.mobulaId,
        chain: token.contract.chain,
        symbol: token.symbol,
        name: token.name,
        price: token.price,
        marketCap: token.marketCap,
        fdv: token.fdv,
        liquidity: token.liquidity,
        holders: token.holdersCount,
        rank: token.rank,
        launchDate: token.launchDate?.toISOString().slice(0, 10) || null,
        chartUrl: token.chartUrl,
        dexUrl: token.dexUrl,
        contract: token.contract.address,
      })),
    );
    console.log('Dry run — no rows written.');
    return;
  }

  const existingSlugs = await loadExistingSlugs();
  let success = 0;
  let failed = 0;

  for (const token of tokens) {
    try {
      const slug = uniqueSlug(slugify(`${token.symbol}-${token.name}`), existingSlugs);
      await upsertToken(token, slug);
      success += 1;
      console.log(`✔ [${token.contract.chain}] ${token.symbol} (${token.name})`);
    } catch (error) {
      failed += 1;
      console.error(`✘ Failed to import ${token.symbol}:`, error);
    }
  }

  console.log(`Done. ${success} imported/updated, ${failed} failed.`);
}

main()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db?.end();
  });
