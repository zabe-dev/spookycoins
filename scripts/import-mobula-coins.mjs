#!/usr/bin/env node

/**
 * Imports random non-major tokens from Mobula into the current EndorseCoin schema.
 *
 * Usage:
 *   npm run import:mobula
 *   npm run import:mobula -- 10000
 *   npm run import:mobula -- --limit=150
 *   npm run import:mobula -- --dry-run
 *   npm run import:mobula -- --dry-run --debug
 *   npm run import:mobula:random
 *   npm run import:mobula -- --random --limit=150
 *
 * This script writes only to tables the app currently reads:
 *   - coins
 *   - market_snapshots
 *   - coin_links
 *
 * It intentionally does not write market_sources because the current app pulls
 * market data from coins.chain + coins.contract_address. Chart and DEX links
 * are generated only when market data confirms a usable route. Project
 * links are imported only when Mobula provides usable URLs.
 */

import { createHash, createHmac, randomUUID } from 'crypto';
import postgres from 'postgres';

const MOBULA_BASE_URL = 'https://api.mobula.io/api/1/all';
const MOBULA_DETAILS_URL = 'https://api.mobula.io/api/2/asset/details';
const MOBULA_METADATA_URL = 'https://api.mobula.io/api/1/multi-metadata';
const MOBULA_MARKET_DETAILS_URL = 'https://api.mobula.io/api/2/market/details';
const DATABASE_URL = process.env.DATABASE_URL;
let mobulaApiKeyIndex = 0;

// Used by log()/formatDuration() below so every log line shows elapsed time
// since the script started, making it obvious whether things are progressing
// or stalled during a long run.
const scriptStartTime = Date.now();

const args = process.argv.slice(2);
const limitArg = args.find((arg) => arg.startsWith('--limit='));
const positionalLimitArg = args.find((arg) => /^\d+$/.test(arg));
const TARGET_COUNT = readPositiveInteger(limitArg?.split('=')[1] || positionalLimitArg, 250);
const DRY_RUN = args.includes('--dry-run');
const DEBUG = args.includes('--debug');
const RANDOM_IMPORT = args.includes('--random');
const RANDOMIZE = RANDOM_IMPORT && !args.includes('--no-random');
const DETAILS_BATCH_SIZE = Math.min(
  readPositiveInteger(
    args.find((arg) => arg.startsWith('--details-batch-size='))?.split('=')[1],
    10,
  ),
  10,
);
// Market-details batching uses its own size, since Mobula hasn't publicly documented
// the max batch size for this endpoint. Defaults to the same conservative size as
// the other batched endpoints; override with --market-batch-size=N to experiment
// with a larger value (test with --dry-run first).
const MARKET_DETAILS_BATCH_SIZE = readPositiveInteger(
  args.find((arg) => arg.startsWith('--market-batch-size='))?.split('=')[1],
  DETAILS_BATCH_SIZE,
);
const EXCLUDE_TOP_RANK = readPositiveInteger(
  args.find((arg) => arg.startsWith('--exclude-top-rank='))?.split('=')[1],
  150,
);
const SKIP_R2_LOGO_UPLOAD = args.includes('--skip-r2-logo-upload');
const NEW_POPULAR_ONLY = !RANDOM_IMPORT;
const NEW_POPULAR_MAX_AGE_DAYS = readPositiveInteger(
  args.find((arg) => arg.startsWith('--new-popular-max-age-days='))?.split('=')[1] ||
    process.env.MOBULA_NEW_POPULAR_MAX_AGE_DAYS,
  daysSinceStartOfYear(),
);
const NEW_POPULAR_EXCLUDE_OLDER_THAN_DAYS = 730;
const NEW_POPULAR_MAX_RANK = 5_000;
const NEW_POPULAR_MIN_VOLUME_USD = 10_000;
const NEW_POPULAR_MIN_LIQUIDITY_USD = 10_000;
const NEW_POPULAR_OVERSAMPLE_FACTOR = 6;

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

const mobulaAssetBlockchains = {
  ethereum: 'ethereum',
  bsc: 'bsc',
  polygon: 'polygon',
  arbitrum: 'arbitrum',
  base: 'base',
  solana: 'solana',
};

const mobulaMetadataBlockchains = {
  ethereum: '1',
  bsc: '56',
  polygon: '137',
  arbitrum: '42161',
  base: '8453',
  solana: 'solana',
};

const mobulaMarketBlockchains = {
  ethereum: 'ethereum',
  bsc: 'bsc',
  polygon: 'polygon',
  arbitrum: 'arbitrum',
  base: 'base',
  solana: 'solana',
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

const supportedExchangeMatchers = {
  ethereum: [/uniswap/i],
  arbitrum: [/uniswap/i],
  base: [/uniswap/i],
  bsc: [/pancakeswap/i],
  polygon: [/quickswap/i],
  solana: [/raydium/i],
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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// --- Logging helpers -----------------------------------------------------
//
// Every log line is prefixed with elapsed time since the script started
// (e.g. "12:04") so it's obvious from the output alone whether a long run
// is progressing normally or has stalled somewhere.

const COLOR = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
};

const useColor = process.stdout.isTTY;
function paint(color, text) {
  return useColor ? `${color}${text}${COLOR.reset}` : text;
}

function formatDuration(ms) {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function timestamp() {
  return paint(COLOR.dim, `[${formatDuration(Date.now() - scriptStartTime)}]`);
}

function log(message) {
  console.log(`${timestamp()} ${message}`);
}

function logSection(title) {
  console.log(`\n${timestamp()} ${paint(COLOR.bold + COLOR.cyan, title)}`);
}

function warn(message) {
  console.warn(`${timestamp()} ${paint(COLOR.yellow, 'WARN')}  ${message}`);
}

function fail(message) {
  console.error(`${timestamp()} ${paint(COLOR.red, 'ERROR')} ${message}`);
}

function logBatchProgress(
  label,
  batchNumber,
  totalBatches,
  tokensSoFar,
  totalTokens,
  phaseStartedAt,
) {
  const logEvery = Math.max(1, Math.round(totalBatches / 20));
  const isFirst = batchNumber === 1;
  const isLast = batchNumber === totalBatches;

  if (!isFirst && !isLast && batchNumber % logEvery !== 0) return;

  const elapsedMs = Date.now() - phaseStartedAt;
  const pct = ((tokensSoFar / totalTokens) * 100).toFixed(0).padStart(3);
  const ratePerMs = tokensSoFar / elapsedMs;
  const remainingTokens = totalTokens - tokensSoFar;
  const etaMs = ratePerMs > 0 ? remainingTokens / ratePerMs : 0;
  const tail = isLast
    ? paint(COLOR.green, `done in ${formatDuration(elapsedMs)}`)
    : `eta ${formatDuration(etaMs)}`;

  log(
    `  ${label.padEnd(14)} ${pct}%  ${tokensSoFar}/${totalTokens} tokens  ` +
      `(batch ${batchNumber}/${totalBatches})  ${tail}`,
  );
}

function logImportProgress(current, total, phaseStartedAt) {
  const every = Math.max(1, Math.round(total / 20));
  const isFirst = current === 1;
  const isLast = current === total;
  if (!isFirst && !isLast && current % every !== 0) return;

  const elapsedMs = Date.now() - phaseStartedAt;
  const pct = ((current / total) * 100).toFixed(1).padStart(5);
  const ratePerMs = current / elapsedMs;
  const remaining = total - current;
  const etaMs = ratePerMs > 0 ? remaining / ratePerMs : 0;
  const tail = isLast
    ? paint(COLOR.green, `done in ${formatDuration(elapsedMs)}`)
    : `eta ${formatDuration(etaMs)}`;

  log(`  write  ${pct}%  ${current}/${total}  ${tail}`);
}

function logCoinWrite(result, token, current, total) {
  const progress = `${String(current).padStart(String(total).length)}/${total}`;
  const icon = paint(COLOR.green, '✓');
  const action = result.action.padEnd(8);
  const id = `#${result.id}`.padEnd(7);
  const name = tokenLabel(token).padEnd(28);
  const where = `${token.contract.chain}:${shortAddress(token.contract.address)}`;

  log(`${icon} ${progress}  ${action} ${id} ${name} ${where}`);
}

function logWriteFailure(token, current, total, error) {
  const progress = `${String(current).padStart(String(total).length)}/${total}`;
  const icon = paint(COLOR.red, '✗');
  const name = tokenLabel(token).padEnd(28);
  const where = `${token.contract.chain}:${shortAddress(token.contract.address)}`;

  fail(`${icon} ${progress}  ${name} ${where} — ${errorMessage(error)}`);
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
      'listed_at',
      'listedAt',
      'total_supply',
      'holders_count',
      'description',
      'socials',
      'website',
      'twitter',
      'telegram',
      'discord',
      'github',
    ].join(','),
  );

  const response = await fetch(url, {
    headers: mobulaAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Mobula request failed: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();
  const list = Array.isArray(json) ? json : json?.data;

  if (!Array.isArray(list)) {
    fail(`Unexpected Mobula response shape: ${JSON.stringify(json).slice(0, 500)}`);
    throw new Error('Mobula response was not a token list.');
  }

  if (DEBUG && list.length) {
    console.log('Sample Mobula item:');
    console.log(JSON.stringify(list[0], null, 2));
  }

  return list;
}

async function enrichTokensWithMobulaDetails(tokens) {
  if (!tokens.length) return tokens;

  const totalBatches = Math.ceil(tokens.length / DETAILS_BATCH_SIZE);
  logSection(
    `Phase 1/3: Asset details (dates + links) · ${tokens.length} tokens, ${totalBatches} batch(es) of ${DETAILS_BATCH_SIZE}`,
  );

  let enrichedCount = 0;
  let batchNumber = 0;
  const phaseStartedAt = Date.now();

  for (let index = 0; index < tokens.length; index += DETAILS_BATCH_SIZE) {
    batchNumber += 1;
    const batch = tokens.slice(index, index + DETAILS_BATCH_SIZE);
    const details = await fetchMobulaAssetDetailsBatch(batch);

    details.forEach((detail, detailIndex) => {
      const token = batch[detailIndex];
      if (!token || !detail) return;

      if (applyMobulaAssetDetails(token, detail)) enrichedCount += 1;
    });

    logBatchProgress(
      'Asset details',
      batchNumber,
      totalBatches,
      Math.min(index + DETAILS_BATCH_SIZE, tokens.length),
      tokens.length,
      phaseStartedAt,
    );

    if (index + DETAILS_BATCH_SIZE < tokens.length) {
      await sleep(1100);
    }
  }

  log(
    `Phase 1/3 done: applied asset details to ${enrichedCount}/${tokens.length} token(s) in ${formatDuration(Date.now() - phaseStartedAt)}.`,
  );
  return tokens;
}

async function enrichTokensWithMobulaMetadata(tokens) {
  if (!tokens.length) return tokens;

  const totalBatches = Math.ceil(tokens.length / DETAILS_BATCH_SIZE);
  logSection(
    `Phase 2/3: Metadata (trust + social links) · ${tokens.length} tokens, ${totalBatches} batch(es) of ${DETAILS_BATCH_SIZE}`,
  );

  let enrichedCount = 0;
  let batchNumber = 0;
  const phaseStartedAt = Date.now();

  for (let index = 0; index < tokens.length; index += DETAILS_BATCH_SIZE) {
    batchNumber += 1;
    const batch = tokens.slice(index, index + DETAILS_BATCH_SIZE);
    const details = await fetchMobulaMetadataBatch(batch);

    details.forEach((detail, detailIndex) => {
      const token = batch[detailIndex];
      if (!token || !detail) return;

      if (applyMobulaMetadata(token, detail)) enrichedCount += 1;
    });

    logBatchProgress(
      'Metadata',
      batchNumber,
      totalBatches,
      Math.min(index + DETAILS_BATCH_SIZE, tokens.length),
      tokens.length,
      phaseStartedAt,
    );

    if (index + DETAILS_BATCH_SIZE < tokens.length) {
      await sleep(1100);
    }
  }

  log(
    `Phase 2/3 done: applied metadata to ${enrichedCount}/${tokens.length} token(s) in ${formatDuration(Date.now() - phaseStartedAt)}.`,
  );
  return tokens;
}

// --- Market details enrichment -------------------------------------------------
//
// Mobula's /api/2/market/details endpoint supports a POST batch mode ("Support
// batch queries via POST for fetching multiple markets in one request" per their
// docs), just like /api/2/asset/details above. Batching this the same way turns
// what used to be one request per token (thousands of sequential 1rps calls) into
// one request per MARKET_DETAILS_BATCH_SIZE tokens - the same shape as the other
// two enrichment passes. This keeps the 1 request/sec pacing intact; it just cuts
// the *number* of requests needed, which is what actually blew up runtime on large
// imports. If a batch ever comes back malformed (wrong item count, request error),
// we fall back to the original one-at-a-time calls for just that batch so no data
// is silently dropped.
async function enrichTokensWithMobulaMarketDetails(tokens) {
  if (!tokens.length) return tokens;

  const usableTokens = tokens.filter((token) => mobulaMarketBlockchains[token.contract.chain]);
  const skippedCount = tokens.length - usableTokens.length;

  if (!usableTokens.length) {
    log('Phase 3/3: Market details — skipped, no tokens on a supported chain.');
    return tokens;
  }

  const totalBatches = Math.ceil(usableTokens.length / MARKET_DETAILS_BATCH_SIZE);
  logSection(
    `Phase 3/3: Market details (chart/DEX links) · ${usableTokens.length} tokens, ${totalBatches} batch(es) of ${MARKET_DETAILS_BATCH_SIZE}` +
      (skippedCount ? ` (${skippedCount} skipped, unsupported chain)` : ''),
  );

  let enrichedCount = 0;
  let batchNumber = 0;
  const phaseStartedAt = Date.now();

  for (let index = 0; index < usableTokens.length; index += MARKET_DETAILS_BATCH_SIZE) {
    batchNumber += 1;
    const batch = usableTokens.slice(index, index + MARKET_DETAILS_BATCH_SIZE);
    const details = await fetchMobulaMarketDetailsBatch(batch);

    details.forEach((detail, detailIndex) => {
      const token = batch[detailIndex];
      if (!token || !detail) return;
      if (applyMobulaMarketDetails(token, detail)) enrichedCount += 1;
    });

    logBatchProgress(
      'Market details',
      batchNumber,
      totalBatches,
      Math.min(index + MARKET_DETAILS_BATCH_SIZE, usableTokens.length),
      usableTokens.length,
      phaseStartedAt,
    );

    if (index + MARKET_DETAILS_BATCH_SIZE < usableTokens.length) {
      await sleep(1100);
    }
  }

  log(
    `Phase 3/3 done: applied market details to ${enrichedCount}/${tokens.length} token(s) in ${formatDuration(
      Date.now() - phaseStartedAt,
    )}.`,
  );
  return tokens;
}

async function fetchMobulaMetadataBatch(tokens) {
  const usableTokens = tokens.filter((token) => mobulaMetadataBlockchains[token.contract.chain]);
  if (!usableTokens.length) return [];

  const url = new URL(MOBULA_METADATA_URL);
  url.searchParams.set('assets', usableTokens.map((token) => token.contract.address).join(','));
  url.searchParams.set(
    'blockchains',
    usableTokens.map((token) => mobulaMetadataBlockchains[token.contract.chain]).join(','),
  );

  try {
    const response = await fetch(url, {
      headers: mobulaAuthHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(
        `Mobula metadata request failed: ${response.status} ${response.statusText}${
          errorText ? ` — ${errorText.slice(0, 500)}` : ''
        }`,
      );
    }

    const json = await response.json();
    const payload = Array.isArray(json?.data) ? json.data : [];
    const details = payload.map((item) => item?.data || item || null);

    return tokens.map((token) => {
      const expectedIndex = usableTokens.findIndex((usable) => usable === token);
      return expectedIndex >= 0 ? details[expectedIndex] || null : null;
    });
  } catch (error) {
    warn(`Mobula metadata batch failed; keeping existing trust/link data. ${errorMessage(error)}`);
    if (DEBUG) console.warn(error);
    return tokens.map(() => null);
  }
}

async function fetchMobulaMarketDetails(token) {
  const blockchain = mobulaMarketBlockchains[token.contract.chain];
  if (!blockchain) return null;

  const url = new URL(MOBULA_MARKET_DETAILS_URL);
  url.searchParams.set('blockchain', blockchain);
  url.searchParams.set('address', token.contract.address);

  try {
    const response = await fetch(url, {
      headers: mobulaAuthHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      if (DEBUG) {
        warn(
          `Market details failed for ${tokenLabel(token)}: ${response.status} ${response.statusText}${
            errorText ? ` — ${errorText.slice(0, 500)}` : ''
          }`,
        );
      }
      return null;
    }

    const json = await response.json();
    return json?.data || null;
  } catch (error) {
    if (DEBUG) warn(`Market details failed for ${tokenLabel(token)}: ${errorMessage(error)}`);
    return null;
  }
}

async function fetchMobulaMarketDetailsBatch(tokens) {
  const body = {
    items: tokens.map((token) => ({
      blockchain: mobulaMarketBlockchains[token.contract.chain],
      address: token.contract.address,
    })),
  };

  try {
    const response = await fetch(MOBULA_MARKET_DETAILS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...mobulaAuthHeaders(),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(
        `Mobula market details batch failed: ${response.status} ${response.statusText}${
          errorText ? ` — ${errorText.slice(0, 500)}` : ''
        }`,
      );
    }

    const json = await response.json();
    const payload = Array.isArray(json?.payload)
      ? json.payload
      : Array.isArray(json?.data)
        ? json.data
        : [];

    if (payload.length !== tokens.length) {
      warn(
        `Market details batch mismatch: expected ${tokens.length}, got ${payload.length}; retrying individually.`,
      );
      return fetchMarketDetailsIndividually(tokens);
    }

    return payload;
  } catch (error) {
    warn(
      `Market details batch failed: ${errorMessage(error)}; retrying ${tokens.length} individually.`,
    );
    if (DEBUG) console.warn(error);
    return fetchMarketDetailsIndividually(tokens);
  }
}

async function fetchMarketDetailsIndividually(tokens) {
  const details = [];
  for (const token of tokens) {
    details.push(await fetchMobulaMarketDetails(token));
    await sleep(1100);
  }
  return details;
}

function applyMobulaMarketDetails(token, details) {
  if (!details || typeof details !== 'object') return false;

  const pairAddress = pickString(details, ['address']);
  const dexscreenerListed = pickOptionalBoolean(details, [
    'dexscreenerListed',
    'dexscreener_listed',
  ]);
  const exchangeName = pickString(details.exchange || {}, ['name']);
  const exchangeIsSupported = isSupportedExchange(token.contract.chain, exchangeName);
  const knownUnsupportedExchange = Boolean(exchangeName && !exchangeIsSupported);
  const customChartUrl = findChartUrl(details);
  const customDexUrl = findDexUrl(details);
  const before = JSON.stringify({
    chartUrl: token.chartUrl,
    dexUrl: token.dexUrl,
    price: token.price,
    marketCap: token.marketCap,
    liquidity: token.liquidity,
    volume: token.volume,
    change24h: token.change24h,
    projectLinks: token.projectLinks,
  });

  if (
    canUseDexScreenerChart(token, { pairAddress, dexscreenerListed }) &&
    chartUrlBuilders[token.contract.chain]
  ) {
    token.chartUrl = chartUrlBuilders[token.contract.chain](pairAddress || token.contract.address);
    token.chartPairAddress = pairAddress;
  } else if (knownUnsupportedExchange && customChartUrl) {
    token.chartUrl = customChartUrl;
  } else {
    token.chartUrl = '';
  }

  if (exchangeIsSupported && dexSwapUrlBuilders[token.contract.chain]) {
    token.dexUrl = dexSwapUrlBuilders[token.contract.chain](token.contract.address);
  } else if (knownUnsupportedExchange && customDexUrl) {
    token.dexUrl = customDexUrl;
  } else {
    token.dexUrl = '';
  }

  token.price = pickNumber(details, ['priceUSD', 'price_usd']) ?? token.price;
  token.marketCap =
    pickNumber(details, ['marketCapUSD', 'market_cap_usd']) ??
    pickNumber(details.base || {}, ['marketCapUSD', 'market_cap_usd']) ??
    token.marketCap;
  token.fdv =
    pickNumber(details, ['marketCapDilutedUSD', 'market_cap_diluted_usd']) ??
    pickNumber(details.base || {}, ['marketCapDilutedUSD', 'market_cap_diluted_usd']) ??
    token.fdv;
  token.volume = pickNumber(details, ['volume24hUSD', 'volume_24h_usd']) ?? token.volume;
  token.change24h =
    pickNumber(details, ['priceChange24hPercentage', 'price_change_24h_percentage']) ??
    token.change24h;
  token.liquidity = pickNumber(details, ['liquidityUSD', 'liquidity_usd']) ?? token.liquidity;
  token.totalSupply =
    pickNumber(details, ['totalSupply', 'total_supply']) ??
    pickNumber(details.base || {}, ['totalSupply', 'total_supply']) ??
    token.totalSupply;
  token.holdersCount =
    pickInteger(details, ['holdersCount', 'holders_count']) ??
    pickInteger(details.base || {}, ['holdersCount', 'holders_count']) ??
    token.holdersCount;
  token.logo =
    pickString(details.base || {}, ['logo', 'logoUrl', 'logo_url']) ||
    pickString(details, ['logo', 'logoUrl', 'logo_url']) ||
    token.logo;
  token.description =
    sanitizePlainText(
      pickString(details, ['description']) || pickString(details.base || {}, ['description']),
    ) || token.description;
  token.projectLinks = {
    ...token.projectLinks,
    ...extractProjectLinks(details),
    ...extractProjectLinks(details.base),
  };
  token.marketExchangeName = exchangeName || token.marketExchangeName;
  token.marketExchangeSupported = exchangeIsSupported;

  return (
    before !==
    JSON.stringify({
      chartUrl: token.chartUrl,
      dexUrl: token.dexUrl,
      price: token.price,
      marketCap: token.marketCap,
      liquidity: token.liquidity,
      volume: token.volume,
      change24h: token.change24h,
      projectLinks: token.projectLinks,
    })
  );
}

async function fetchMobulaAssetDetailsBatch(tokens) {
  const body = tokens.map((token) => ({
    blockchain: mobulaAssetBlockchains[token.contract.chain] || token.contract.blockchain,
    address: token.contract.address,
    tokensLimit: 1,
  }));

  try {
    const response = await fetch(MOBULA_DETAILS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...mobulaAuthHeaders(),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(
        `Mobula details request failed: ${response.status} ${response.statusText}${
          errorText ? ` — ${errorText.slice(0, 500)}` : ''
        }`,
      );
    }

    const json = await response.json();
    const payload = Array.isArray(json?.payload)
      ? json.payload
      : Array.isArray(json?.data)
        ? json.data
        : Array.isArray(json?.data?.payload)
          ? json.data.payload
          : [];

    if (!Array.isArray(payload)) return [];
    return payload;
  } catch (error) {
    warn(`Mobula details batch failed; keeping list-level date data. ${errorMessage(error)}`);
    if (DEBUG) console.warn(error);
    return fetchMobulaAssetDetailsIndividually(tokens);
  }
}

async function fetchMobulaAssetDetailsIndividually(tokens) {
  const details = [];

  for (const token of tokens) {
    const url = new URL(MOBULA_DETAILS_URL);
    url.searchParams.set(
      'blockchain',
      mobulaAssetBlockchains[token.contract.chain] || token.contract.blockchain,
    );
    url.searchParams.set('address', token.contract.address);
    url.searchParams.set('tokensLimit', '1');

    try {
      const response = await fetch(url, {
        headers: mobulaAuthHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        if (DEBUG) {
          warn(
            `Details failed for ${tokenLabel(token)}: ${response.status} ${response.statusText}${
              errorText ? ` — ${errorText.slice(0, 500)}` : ''
            }`,
          );
        }
        details.push(null);
        continue;
      }

      const json = await response.json();
      details.push(json?.data || null);
    } catch (error) {
      if (DEBUG) warn(`Details failed for ${tokenLabel(token)}: ${errorMessage(error)}`);
      details.push(null);
    }

    await sleep(1100);
  }

  return details;
}

function applyMobulaAssetDetails(token, detail) {
  const asset = detail?.asset || detail?.data?.asset;
  if (!asset || typeof asset !== 'object') return false;

  const matchingToken = findMatchingDetailToken(detail, token.contract.address);

  token.name = pickString(asset, ['name']) || token.name;
  token.symbol = pickString(asset, ['symbol']) || token.symbol;
  token.logo =
    pickString(matchingToken || {}, ['logo', 'logoUrl', 'logo_url']) ||
    pickString(asset, ['logo', 'logoUrl', 'logo_url']) ||
    token.logo;
  token.description =
    sanitizePlainText(
      pickString(matchingToken || {}, ['description']) || pickString(asset, ['description']),
    ) || token.description;
  token.rank = pickNumber(asset, ['rank']) ?? token.rank;
  token.price = pickNumber(asset, ['priceUSD', 'price_usd']) ?? token.price;
  token.marketCap = pickNumber(asset, ['marketCapUSD', 'market_cap_usd']) ?? token.marketCap;
  token.fdv = pickNumber(asset, ['marketCapDilutedUSD', 'market_cap_diluted_usd']) ?? token.fdv;
  token.totalSupply = pickNumber(asset, ['totalSupply', 'total_supply']) ?? token.totalSupply;

  const listedAt = pickDate(asset, ['listedAt', 'listed_at']);
  const createdAt = pickDate(asset, ['createdAt', 'created_at']);
  const nextLaunchDate = listedAt || createdAt || token.launchDate;
  const hadLaunchDate = Boolean(token.launchDate);
  token.launchDate = nextLaunchDate;

  const before = JSON.stringify(token.projectLinks);
  token.projectLinks = {
    ...token.projectLinks,
    ...extractProjectLinks(asset),
    ...extractProjectLinks(matchingToken),
  };

  return (
    (!hadLaunchDate && Boolean(nextLaunchDate)) || before !== JSON.stringify(token.projectLinks)
  );
}

function applyMobulaMetadata(token, metadata) {
  if (!metadata || typeof metadata !== 'object') return false;

  const before = JSON.stringify({
    name: token.name,
    symbol: token.symbol,
    logo: token.logo,
    description: token.description,
    price: token.price,
    marketCap: token.marketCap,
    fdv: token.fdv,
    liquidity: token.liquidity,
    volume: token.volume,
    totalSupply: token.totalSupply,
    launchDate: token.launchDate,
    projectLinks: token.projectLinks,
  });

  token.name = pickString(metadata, ['name']) || token.name;
  token.symbol = pickString(metadata, ['symbol']) || token.symbol;
  token.logo = pickString(metadata, ['logo', 'logoUrl', 'logo_url']) || token.logo;
  token.description = sanitizePlainText(pickString(metadata, ['description'])) || token.description;
  token.price = pickNumber(metadata, ['price']) ?? token.price;
  token.marketCap = pickNumber(metadata, ['market_cap', 'marketCap']) ?? token.marketCap;
  token.liquidity = pickNumber(metadata, ['liquidity']) ?? token.liquidity;
  token.volume = pickNumber(metadata, ['volume', 'volume24h', 'volume_24h']) ?? token.volume;
  token.totalSupply = pickNumber(metadata, ['total_supply', 'totalSupply']) ?? token.totalSupply;
  token.fdv = pickNumber(metadata, ['fully_diluted_valuation', 'fdv']) ?? token.fdv;
  token.rank = pickNumber(metadata, ['rank']) ?? token.rank;
  token.launchDate = pickDate(metadata, ['listed_at', 'listedAt']) || token.launchDate;
  token.projectLinks = {
    ...token.projectLinks,
    ...extractProjectLinks(metadata),
  };
  token.dexscreenerListed =
    pickOptionalBoolean(metadata, ['dexscreenerListed', 'dexscreener_listed']) ??
    token.dexscreenerListed;

  return (
    before !==
    JSON.stringify({
      name: token.name,
      symbol: token.symbol,
      logo: token.logo,
      description: token.description,
      price: token.price,
      marketCap: token.marketCap,
      fdv: token.fdv,
      liquidity: token.liquidity,
      volume: token.volume,
      totalSupply: token.totalSupply,
      launchDate: token.launchDate,
      projectLinks: token.projectLinks,
    })
  );
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
  if (price !== null && price <= 0) return null;

  const marketCap = pickNumber(item, ['market_cap', 'marketCap']);
  if (marketCap !== null && marketCap <= 0) return null;

  const symbol = pickString(item, ['symbol']) || '???';
  if (symbolDenylist.has(symbol.toUpperCase())) return null;

  const rank = pickNumber(item, ['rank']);
  if (EXCLUDE_TOP_RANK > 0 && rank !== null && rank <= EXCLUDE_TOP_RANK) return null;

  return {
    mobulaId: pickNumber(item, ['id']),
    name: pickString(item, ['name']) || 'Unknown',
    symbol,
    logo: pickString(item, ['logo', 'logoUrl', 'logo_url']),
    description: sanitizePlainText(pickString(item, ['description'])),
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
    chartUrl: '',
    dexUrl: '',
    launchDate: pickDate(item, ['listed_at', 'listedAt', 'launch_date', 'launchDate']),
    projectLinks: extractProjectLinks(item),
  };
}

async function upsertToken(token, slug) {
  if (!db) throw new Error('DATABASE_URL is required.');
  const logoUrl = await resolveLogoUrl(token);

  return db.begin(async (tx) => {
    const existing = await tx`
      select id
      from coins
      where lower(chain) = lower(${token.contract.chain})
        and lower(contract_address) = lower(${token.contract.address})
      limit 1
    `;
    const existingCoinId = existing[0]?.id;
    const coinId = existingCoinId || (await readNextCoinId(tx));
    const now = new Date();

    await tx`
      insert into coins (
        id, slug, name, symbol, logo_url, description, category, chain, contract_address,
        launch_date, listing_source, listing_status, is_presale, submitted_at, created_at, updated_at
      )
      values (
        ${coinId}, ${slug}, ${token.name}, ${token.symbol}, ${logoUrl}, ${token.description},
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
    await upsertProjectLinks(tx, coinId, token.projectLinks, now);

    return { id: coinId, action: existingCoinId ? 'updated' : 'inserted' };
  });
}

async function resolveLogoUrl(token) {
  if (!token.logo || SKIP_R2_LOGO_UPLOAD) return token.logo || null;

  try {
    const uploaded = await mirrorRemoteImageToR2(token.logo, {
      chain: token.contract.chain,
    });
    return uploaded.url;
  } catch (error) {
    throw new Error(`Could not mirror logo to R2 for ${tokenLabel(token)}: ${errorMessage(error)}`);
  }
}

async function readNextCoinId(tx) {
  const rows = await tx`select coalesce(max(id), 999) + 1 as next_id from coins`;
  return rows[0].nextId;
}

async function upsertCoinLink(tx, coinId, type, url, now) {
  const safeUrl = normalizeUrl(url);
  if (!safeUrl) return;

  await tx`
    insert into coin_links (coin_id, type, url, created_at, updated_at)
    values (${coinId}, ${type}, ${safeUrl}, ${now}, ${now})
    on conflict (coin_id, type) do update set
      url = excluded.url,
      updated_at = excluded.updated_at
  `;
}

async function upsertProjectLinks(tx, coinId, links, now) {
  for (const [type, url] of Object.entries(links || {})) {
    await upsertCoinLink(tx, coinId, type, url, now);
  }
}

async function loadExistingSlugs() {
  if (!db) return new Set();
  const rows = await db`select slug from coins`;
  return new Set(rows.map((row) => row.slug));
}

async function loadExistingContracts() {
  if (!db || DRY_RUN) return new Set();
  const rows = await db`
    select lower(chain) as chain, lower(contract_address) as contract_address
    from coins
    where contract_address is not null and contract_address <> ''
  `;
  return new Set(rows.map((row) => contractKey(row.chain, row.contractAddress)));
}

function hasExistingContract(existingContracts, token) {
  return existingContracts.has(contractKey(token.contract.chain, token.contract.address));
}

function contractKey(chain, address) {
  return `${String(chain || '').toLowerCase()}:${String(address || '').toLowerCase()}`;
}

function selectNewPopularCandidatePool(tokens) {
  const candidates = tokens.filter(couldBecomeNewPopularToken).sort(compareNewPopularTokens);
  const maxCandidates = Math.max(TARGET_COUNT, TARGET_COUNT * NEW_POPULAR_OVERSAMPLE_FACTOR);
  return candidates.slice(0, maxCandidates);
}

function couldBecomeNewPopularToken(token) {
  if (!hasPopularitySignal(token)) return false;
  if (!token.launchDate) return true;
  return isRecentLaunchDate(token.launchDate);
}

function isNewPopularToken(token) {
  return Boolean(
    token.launchDate && isRecentLaunchDate(token.launchDate) && hasPopularitySignal(token),
  );
}

function isRecentLaunchDate(date) {
  const timestamp = date instanceof Date ? date.getTime() : new Date(date).getTime();
  if (!Number.isFinite(timestamp)) return false;

  const now = Date.now();
  const maxAgeMs = NEW_POPULAR_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
  const maxAllowedAgeMs = NEW_POPULAR_EXCLUDE_OLDER_THAN_DAYS * 24 * 60 * 60 * 1000;
  const oneDayMs = 24 * 60 * 60 * 1000;
  return timestamp >= now - Math.min(maxAgeMs, maxAllowedAgeMs) && timestamp <= now + oneDayMs;
}

function hasPopularitySignal(token) {
  return (
    (token.rank !== null && token.rank <= NEW_POPULAR_MAX_RANK) ||
    (token.volume !== null && token.volume >= NEW_POPULAR_MIN_VOLUME_USD) ||
    (token.liquidity !== null && token.liquidity >= NEW_POPULAR_MIN_LIQUIDITY_USD)
  );
}

function compareNewPopularTokens(a, b) {
  return (
    newPopularScore(b) - newPopularScore(a) || newestFirst(a, b) || a.name.localeCompare(b.name)
  );
}

function newestFirst(a, b) {
  return (b.launchDate?.getTime() || 0) - (a.launchDate?.getTime() || 0);
}

function newPopularScore(token) {
  const rankScore = token.rank ? Math.max(0, NEW_POPULAR_MAX_RANK - token.rank) * 100 : 0;
  const volumeScore = Math.log10(Math.max(1, token.volume || 0)) * 1_000;
  const liquidityScore = Math.log10(Math.max(1, token.liquidity || 0)) * 900;
  const marketCapScore = Math.log10(Math.max(1, token.marketCap || 0)) * 500;
  const ageScore = token.launchDate
    ? Math.max(0, NEW_POPULAR_MAX_AGE_DAYS - ageInDays(token.launchDate)) * 50
    : 0;

  return rankScore + volumeScore + liquidityScore + marketCapScore + ageScore;
}

function ageInDays(date) {
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / (24 * 60 * 60 * 1000)));
}

function daysSinceStartOfYear() {
  const now = new Date();
  const startOfYear = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
  return Math.max(1, Math.ceil((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000)));
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

function pickOptionalBoolean(obj, keys) {
  const value = pick(obj, keys);
  return typeof value === 'boolean' ? value : null;
}

function pickString(obj, keys) {
  const value = pick(obj, keys);
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function pickDate(obj, keys) {
  const value = pick(obj, keys);
  if (typeof value !== 'string' && typeof value !== 'number') return null;

  const date = typeof value === 'number' ? new Date(value) : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function pickStringArray(obj, keys) {
  const value = pick(obj, keys);
  return Array.isArray(value) ? value.filter((item) => typeof item === 'string') : [];
}

function findMatchingDetailToken(detail, address) {
  const tokens = Array.isArray(detail?.tokens)
    ? detail.tokens
    : Array.isArray(detail?.data?.tokens)
      ? detail.data.tokens
      : [];
  const normalizedAddress = address.toLowerCase();

  return (
    tokens.find((token) => {
      const tokenAddress = pickString(token, ['address', 'contractAddress', 'contract_address']);
      return tokenAddress?.toLowerCase() === normalizedAddress;
    }) || tokens[0]
  );
}

function isSupportedExchange(chain, exchangeName) {
  const matchers = supportedExchangeMatchers[chain] || [];
  if (!exchangeName) return false;
  if (!matchers.length) return false;
  return matchers.some((matcher) => matcher.test(exchangeName));
}

function canUseDexScreenerChart(token, { pairAddress, dexscreenerListed }) {
  if (!chartUrlBuilders[token.contract.chain]) return false;
  if (dexscreenerListed === true || token.dexscreenerListed === true) return true;
  if (dexscreenerListed === false || token.dexscreenerListed === false) return false;
  return Boolean(pairAddress);
}

function findChartUrl(details) {
  return firstUrl('market', [
    pickString(details, [
      'chartUrl',
      'chart_url',
      'marketUrl',
      'market_url',
      'pairUrl',
      'pair_url',
    ]),
    pickString(details.exchange || {}, [
      'chartUrl',
      'chart_url',
      'marketUrl',
      'market_url',
      'pairUrl',
      'pair_url',
    ]),
    findNestedUrl(details, [
      'chartUrl',
      'chart_url',
      'marketUrl',
      'market_url',
      'pairUrl',
      'pair_url',
    ]),
  ]);
}

function findDexUrl(details) {
  return firstUrl('market', [
    pickString(details, ['tradeUrl', 'trade_url', 'swapUrl', 'swap_url', 'dexUrl', 'dex_url']),
    pickString(details.exchange || {}, [
      'tradeUrl',
      'trade_url',
      'swapUrl',
      'swap_url',
      'dexUrl',
      'dex_url',
    ]),
    findNestedUrl(details, ['tradeUrl', 'trade_url', 'swapUrl', 'swap_url', 'dexUrl', 'dex_url']),
  ]);
}

function extractProjectLinks(source) {
  if (!source || typeof source !== 'object') return {};

  const socials = source.socials && typeof source.socials === 'object' ? source.socials : {};
  const others = socials.others && typeof socials.others === 'object' ? socials.others : {};

  return compactObject({
    website: firstUrl('website', [
      pickString(socials, ['website', 'site', 'homepage', 'home']),
      pickString(source, ['website', 'site', 'homepage', 'home']),
      findNestedUrl(others, ['website', 'site', 'homepage', 'official']),
    ]),
    telegram: firstUrl('telegram', [
      pickString(socials, ['telegram', 'chat']),
      pickString(source, ['telegram', 'chat']),
      findNestedUrl(others, ['telegram', 'tg', 'chat']),
    ]),
    x: firstUrl('x', [
      pickString(socials, ['twitter', 'x']),
      pickString(source, ['twitter', 'x']),
      findNestedUrl(others, ['twitter', 'x']),
    ]),
    discord: firstUrl('discord', [
      pickString(socials, ['discord']),
      pickString(source, ['discord']),
      findNestedUrl(others, ['discord']),
    ]),
    github: firstUrl('github', [
      pickString(socials, ['github']),
      pickString(source, ['github']),
      findNestedUrl(others, ['github', 'repo', 'repository']),
    ]),
    whitepaper: firstUrl('whitepaper', [
      pickString(socials, ['whitepaper', 'whitePaper', 'docs', 'documentation']),
      pickString(source, ['whitepaper', 'whitePaper', 'docs', 'documentation']),
      findNestedUrl(others, ['whitepaper', 'whitePaper', 'docs', 'documentation', 'litepaper']),
    ]),
    kyc: firstUrl('kyc', [
      pickString(socials, ['kyc']),
      pickString(source, ['kyc']),
      findNestedUrl(others, ['kyc']),
    ]),
    audit: firstUrl('audit', [
      pickString(socials, ['audit']),
      pickString(source, ['audit']),
      findNestedUrl(others, ['audit', 'security']),
    ]),
  });
}

function firstUrl(kind, values) {
  for (const value of values) {
    const url = normalizeUrl(value, kind);
    if (url) return url;
  }
  return '';
}

function normalizeUrl(value, kind = '') {
  if (typeof value !== 'string') return '';
  const trimmed = sanitizePlainText(value).trim();
  if (!trimmed || trimmed.length > 2048) return '';
  if (/^(javascript|data|vbscript):/i.test(trimmed)) return '';

  const handleUrl = socialHandleUrl(kind, trimmed);
  if (handleUrl) return handleUrl;

  const withProtocol =
    /^[a-z][a-z\d+\-.]*:\/\//i.test(trimmed) || trimmed.startsWith('mailto:')
      ? trimmed
      : `https://${trimmed}`;

  try {
    const url = new URL(withProtocol);
    if (!['http:', 'https:', 'mailto:'].includes(url.protocol)) return '';
    if (url.protocol !== 'mailto:' && !url.hostname.includes('.')) return '';
    return url.toString();
  } catch {
    return '';
  }
}

function socialHandleUrl(kind, value) {
  if (kind === 'telegram') {
    const telegramMatch = value.match(/^@?([a-zA-Z0-9_]{5,32})$/);
    if (telegramMatch) return `https://t.me/${telegramMatch[1]}`;
  }

  if (kind === 'x') {
    const xMatch = value.match(/^@?([a-zA-Z0-9_]{1,15})$/);
    if (xMatch) return `https://x.com/${xMatch[1]}`;
  }

  return '';
}

function findNestedUrl(value, needles, depth = 0) {
  if (!value || depth > 3) return '';

  if (typeof value === 'string') {
    return normalizeUrl(value);
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const nested = findNestedUrl(item, needles, depth + 1);
      if (nested) return nested;
    }
    return '';
  }

  if (typeof value !== 'object') return '';

  for (const [key, nestedValue] of Object.entries(value)) {
    const normalizedKey = key.toLowerCase();
    if (needles.some((needle) => normalizedKey.includes(needle.toLowerCase()))) {
      const nested = findNestedUrl(nestedValue, needles, depth + 1);
      if (nested) return nested;
    }
  }

  return '';
}

function compactObject(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => typeof item === 'string' && item.trim()),
  );
}

function mobulaAuthHeaders() {
  const apiKey = getNextMobulaApiKey();
  return apiKey ? { Authorization: apiKey } : {};
}

function getNextMobulaApiKey() {
  const keys = getMobulaApiKeys();
  if (!keys.length) return '';

  const index = mobulaApiKeyIndex;
  mobulaApiKeyIndex = (index + 1) % keys.length;

  return keys[index % keys.length];
}

function getMobulaApiKeys() {
  return uniqueStrings([
    ...splitEnvList(process.env.MOBULA_API_KEYS),
    ...splitEnvList(process.env.MOBULA_API_KEY),
  ]);
}

function splitEnvList(value) {
  return (value || '')
    .split(/[\n,]/)
    .map((key) => key.trim())
    .filter(Boolean);
}

function uniqueStrings(values) {
  return Array.from(new Set(values));
}

function sanitizePlainText(value) {
  if (typeof value !== 'string') return '';

  return decodeHtmlEntities(value)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/(?:javascript|data|vbscript):/gi, '')
    .replace(/\bon\w+\s*=/gi, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{4,}/g, '\n\n\n')
    .trim();
}

function decodeHtmlEntities(value) {
  return value
    .replace(/&#(\d+);?/g, (_, code) => codePointToString(Number(code)))
    .replace(/&#x([\da-f]+);?/gi, (_, code) => codePointToString(Number.parseInt(code, 16)))
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

function codePointToString(number) {
  if (!Number.isInteger(number) || number < 0 || number > 0x10ffff) return '';
  return String.fromCodePoint(number);
}

async function mirrorRemoteImageToR2(sourceUrl, { chain }) {
  const storage = getR2Config();
  const image = await fetchRemoteImage(sourceUrl);
  const extension = extensionForMime(image.mimeType);
  const key = `assets/${chain}/logos/${randomUUID()}.${extension}`;
  const requestUrl = objectRequestUrl(storage.endpoint, storage.bucket, key);

  const response = await fetch(requestUrl, {
    method: 'PUT',
    headers: signedPutHeaders({
      body: image.body,
      contentType: image.mimeType,
      requestUrl,
      storage,
    }),
    body: image.body,
  });

  if (!response.ok) {
    throw new Error(`R2 upload failed with status ${response.status}.`);
  }

  return {
    key,
    url: storage.publicBaseUrl
      ? publicObjectUrl(storage.publicBaseUrl, key)
      : objectRequestUrl(storage.endpoint, storage.bucket, key),
  };
}

async function fetchRemoteImage(sourceUrl) {
  const url = normalizeUrl(sourceUrl);
  if (!url) throw new Error('Invalid source image URL.');

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Image fetch failed with status ${response.status}.`);

  const mimeType = response.headers.get('content-type')?.split(';')[0]?.toLowerCase() || '';
  if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(mimeType)) {
    throw new Error(`Unsupported image type "${mimeType || 'unknown'}".`);
  }

  const body = Buffer.from(await response.arrayBuffer());
  if (!body.length) throw new Error('Image was empty.');
  if (body.length > 1_500_000) throw new Error('Image is larger than 1.5MB.');

  return { body, mimeType };
}

function getR2Config() {
  const endpoint = process.env.R2_ENDPOINT || r2EndpointFromAccountId(process.env.R2_ACCOUNT_ID);
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET_NAME;
  const publicBaseUrl = process.env.R2_PUBLIC_URL || '';

  if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error('Cloudflare R2 storage is not configured.');
  }

  return {
    endpoint: trimTrailingSlash(endpoint),
    bucket,
    accessKeyId,
    secretAccessKey,
    publicBaseUrl: publicBaseUrl ? trimTrailingSlash(publicBaseUrl) : '',
  };
}

function signedPutHeaders({ body, contentType, requestUrl, storage }) {
  const parsedUrl = new URL(requestUrl);
  const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = sha256Hex(body);
  const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date';
  const credentialScope = `${dateStamp}/auto/s3/aws4_request`;
  const canonicalRequest = [
    'PUT',
    parsedUrl.pathname,
    parsedUrl.searchParams.toString(),
    `content-type:${contentType}`,
    `host:${parsedUrl.host}`,
    `x-amz-content-sha256:${payloadHash}`,
    `x-amz-date:${amzDate}`,
    '',
    signedHeaders,
    payloadHash,
  ].join('\n');
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join('\n');
  const signature = hmacHex(getSigningKey(storage.secretAccessKey, dateStamp), stringToSign);

  return {
    Authorization: [
      `AWS4-HMAC-SHA256 Credential=${storage.accessKeyId}/${credentialScope}`,
      `SignedHeaders=${signedHeaders}`,
      `Signature=${signature}`,
    ].join(', '),
    'Content-Type': contentType,
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': amzDate,
  };
}

function getSigningKey(secretAccessKey, dateStamp) {
  const dateKey = hmacBuffer(`AWS4${secretAccessKey}`, dateStamp);
  const regionKey = hmacBuffer(dateKey, 'auto');
  const serviceKey = hmacBuffer(regionKey, 's3');
  return hmacBuffer(serviceKey, 'aws4_request');
}

function objectRequestUrl(endpoint, bucket, key) {
  const url = new URL(`${trimTrailingSlash(endpoint)}/`);
  url.pathname = joinPath(url.pathname, bucket, key);
  return url.toString();
}

function publicObjectUrl(baseUrl, key) {
  const url = new URL(`${trimTrailingSlash(baseUrl)}/`);
  url.pathname = joinPath(url.pathname, key);
  return url.toString();
}

function joinPath(...parts) {
  return `/${parts
    .flatMap((part) => part.split('/'))
    .map((part) => part.trim())
    .filter(Boolean)
    .map(encodeURIComponent)
    .join('/')}`;
}

function extensionForMime(mimeType) {
  if (mimeType === 'image/jpeg') return 'jpg';
  if (mimeType === 'image/webp') return 'webp';
  if (mimeType === 'image/gif') return 'gif';
  return 'png';
}

function trimTrailingSlash(value) {
  return value.replace(/\/+$/g, '');
}

function r2EndpointFromAccountId(accountId) {
  return accountId ? `https://${accountId}.r2.cloudflarestorage.com` : '';
}

function sha256Hex(value) {
  return createHash('sha256').update(value).digest('hex');
}

function hmacBuffer(key, value) {
  return createHmac('sha256', key).update(value).digest();
}

function hmacHex(key, value) {
  return createHmac('sha256', key).update(value).digest('hex');
}

function toDbNumber(value) {
  return Number.isFinite(value) ? String(value) : null;
}

function tokenLabel(token) {
  return `${token.symbol} (${token.name})`;
}

function shortAddress(address) {
  if (!address || address.length <= 14) return address || 'no-address';
  return `${address.slice(0, 6)}…${address.slice(-6)}`;
}

function errorMessage(error) {
  if (error instanceof Error) {
    const cause = error.cause instanceof Error ? `; cause: ${error.cause.message}` : '';
    return `${error.message}${cause}`;
  }

  if (typeof error === 'object' && error !== null) {
    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }

  return String(error);
}

function logImportPlan({
  rawCount,
  matchedCount,
  existingCount,
  candidateCount,
  selectedCount,
  selectionTarget,
  targetCount,
  perChainCount,
}) {
  const mode = NEW_POPULAR_ONLY ? 'new-popular' : 'random';
  const writeMode = DRY_RUN ? 'preview' : 'write';
  const chainSummary = chainKeys
    .filter((chain) => perChainCount[chain] > 0)
    .map((chain) => `${chain}: ${perChainCount[chain]}`)
    .join(', ');

  logSection('Import plan');
  if (NEW_POPULAR_ONLY) {
    log(`  mode      ${mode} (${writeMode})`);
    log(
      `  target    up to ${targetCount} tokens, checked ${selectedCount}/${selectionTarget} candidates`,
    );
    log(
      `  filters   this-year age, no >2y, rank > ${EXCLUDE_TOP_RANK}, skip existing (${existingCount})`,
    );
  } else {
    log(`  mode      ${mode} (${writeMode})`);
    log(`  target    ${selectedCount}/${selectionTarget} tokens`);
    log(`  filters   rank > ${EXCLUDE_TOP_RANK}`);
  }
  log(`  pool      raw ${rawCount} · eligible ${matchedCount} · candidates ${candidateCount}`);
  log(`  chains    ${chainSummary || 'none'}`);
}

function readPositiveInteger(value, fallback) {
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0 ? number : fallback;
}

async function main() {
  log('Mobula import has started');

  const raw = await fetchMobulaAssets();
  const matchedAll = raw.map(buildToken).filter(Boolean);
  const existingContracts = NEW_POPULAR_ONLY ? await loadExistingContracts() : new Set();
  const importableAll = NEW_POPULAR_ONLY
    ? matchedAll.filter((token) => !hasExistingContract(existingContracts, token))
    : matchedAll;

  const candidatePool = NEW_POPULAR_ONLY
    ? selectNewPopularCandidatePool(importableAll)
    : importableAll;

  const byChain = Object.fromEntries(chainKeys.map((chain) => [chain, []]));
  for (const token of candidatePool) byChain[token.contract.chain].push(token);

  const available = Object.fromEntries(chainKeys.map((chain) => [chain, byChain[chain].length]));
  const emptyChains = chainKeys.filter((chain) => available[chain] === 0);
  if (emptyChains.length) {
    warn(`No eligible tokens found for: ${emptyChains.join(', ')}`);
  }

  const selectionTarget = NEW_POPULAR_ONLY
    ? Math.min(
        candidatePool.length,
        Math.max(TARGET_COUNT, TARGET_COUNT * NEW_POPULAR_OVERSAMPLE_FACTOR),
      )
    : TARGET_COUNT;
  const perChainCount = randomSplit(selectionTarget, chainKeys, available);
  const selectedByChain = chainKeys.flatMap((chain) => {
    const pool = NEW_POPULAR_ONLY
      ? [...byChain[chain]].sort(compareNewPopularTokens)
      : RANDOMIZE
        ? shuffle(byChain[chain])
        : [...byChain[chain]].sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity));
    return pool.slice(0, perChainCount[chain]);
  });
  let tokens = NEW_POPULAR_ONLY
    ? selectedByChain.sort(compareNewPopularTokens)
    : RANDOMIZE
      ? shuffle(selectedByChain)
      : selectedByChain;

  if (tokens.length < selectionTarget) {
    warn(`Only ${tokens.length}/${selectionTarget} tokens available; some chains ran out.`);
  }

  logImportPlan({
    rawCount: raw.length,
    matchedCount: matchedAll.length,
    existingCount: matchedAll.length - importableAll.length,
    candidateCount: candidatePool.length,
    selectedCount: tokens.length,
    selectionTarget,
    targetCount: TARGET_COUNT,
    perChainCount,
  });

  await enrichTokensWithMobulaDetails(tokens);
  await enrichTokensWithMobulaMetadata(tokens);
  await enrichTokensWithMobulaMarketDetails(tokens);

  if (NEW_POPULAR_ONLY) {
    const enrichedCount = tokens.length;
    tokens = tokens.filter(isNewPopularToken).sort(compareNewPopularTokens).slice(0, TARGET_COUNT);

    log(
      `Final selection: ${tokens.length}/${TARGET_COUNT} tokens kept from ${enrichedCount} checked`,
    );
  }

  if (DRY_RUN) {
    logSection(`Dry run: previewing ${tokens.length} enriched token(s) — no rows will be written`);
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
        website: token.projectLinks.website || null,
        telegram: token.projectLinks.telegram || null,
        x: token.projectLinks.x || null,
        discord: token.projectLinks.discord || null,
        github: token.projectLinks.github || null,
        whitepaper: token.projectLinks.whitepaper || null,
        kyc: token.projectLinks.kyc || null,
        audit: token.projectLinks.audit || null,
        pair: token.chartPairAddress || null,
        exchange: token.marketExchangeName || null,
        supportedExchange: token.marketExchangeSupported ?? null,
        chartUrl: token.chartUrl,
        dexUrl: token.dexUrl,
        contract: token.contract.address,
      })),
    );
    log(
      `Dry run complete — no rows written. (Total time: ${formatDuration(Date.now() - scriptStartTime)})`,
    );
    return;
  }

  logSection(`Writing ${tokens.length} token(s) to the database`);
  const existingSlugs = await loadExistingSlugs();
  log(`Loaded ${existingSlugs.size} existing slug(s) for de-duplication.`);

  let success = 0;
  let failed = 0;
  let current = 0;
  const writePhaseStartedAt = Date.now();

  for (const token of tokens) {
    current += 1;
    try {
      const slug = uniqueSlug(slugify(`${token.symbol}-${token.name}`), existingSlugs);
      const result = await upsertToken(token, slug);
      success += 1;
      logCoinWrite(result, token, current, tokens.length);
    } catch (error) {
      failed += 1;
      logWriteFailure(token, current, tokens.length, error);
    }

    logImportProgress(current, tokens.length, writePhaseStartedAt);
  }

  logSection(
    `Import finished: ${success} imported/updated, ${failed} failed, out of ${tokens.length} total. ` +
      `Total run time: ${formatDuration(Date.now() - scriptStartTime)}.`,
  );
}

main()
  .catch((error) => {
    fail(`fatal: ${errorMessage(error)}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db?.end();
  });
