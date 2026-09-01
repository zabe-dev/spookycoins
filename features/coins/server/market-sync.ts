import 'server-only';

import { db } from '@/lib/db/client';
import { coins, marketSnapshots } from '@/lib/db/schema';
import type { NetworkId } from '@/features/coins/types';
import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';

type MarketSyncCoin = Pick<
  typeof coins.$inferSelect,
  'id' | 'chain' | 'contractAddress' | 'listingStatus'
>;
type MarketSnapshotRow = typeof marketSnapshots.$inferSelect;

type MobulaTokenDetails = {
  priceUSD?: unknown;
  marketCapUSD?: unknown;
  marketCapDilutedUSD?: unknown;
  volume24hUSD?: unknown;
  priceChange24hPercentage?: unknown;
  liquidityUSD?: unknown;
  totalSupply?: unknown;
  holdersCount?: unknown;
  rank?: unknown;
};

const mobulaChainIds: Partial<Record<NetworkId, string>> = {
  ethereum: 'evm:1',
  bsc: 'evm:56',
  polygon: 'evm:137',
  avalanche: 'evm:43114',
  arbitrum: 'evm:42161',
  base: 'evm:8453',
  optimism: 'evm:10',
  fantom: 'evm:250',
  kcc: 'evm:321',
  hood: 'evm:4663',
  tron: 'tron:728126428',
  solana: 'solana:solana',
  sui: 'sui:sui',
};

const syncState = globalThis as typeof globalThis & {
  spookycoinsMobulaInFlight?: Promise<Map<number, MarketSnapshotRow>>;
  spookycoinsMobulaNextAllowedAt?: number;
};

const apiBaseUrl = process.env.MOBULA_API_BASE_URL || 'https://api.mobula.io';
const requestTimeoutMs = Number(process.env.MOBULA_REQUEST_TIMEOUT_MS || 8_000);
const cacheSeconds = Number(process.env.MARKET_DATA_CACHE_SECONDS || 900);
const defaultSyncLimit = Number(process.env.MARKET_DATA_SYNC_LIMIT || 1);
const requestSpacingMs = Math.max(1_050, Number(process.env.MOBULA_REQUEST_SPACING_MS || 1_050));
const lockId = 880_550_110;

export async function refreshStaleMarketSnapshots(
  coinRows: MarketSyncCoin[],
  latestSnapshots: Map<number, MarketSnapshotRow>,
) {
  try {
    const staleCoins = coinRows
      .filter((coin) => shouldRefreshCoin(coin, latestSnapshots.get(coin.id)))
      .slice(0, defaultSyncLimit);

    if (!staleCoins.length) return new Map<number, MarketSnapshotRow>();

    return await runDedupeSync(() => syncCoinMarketData(staleCoins));
  } catch (error) {
    if (isMissingMarketSnapshotColumnError(error)) return new Map<number, MarketSnapshotRow>();
    throw error;
  }
}

export async function syncMobulaMarketData(limit = defaultSyncLimit) {
  const coinRows = await db
    .select()
    .from(coins)
    .where(and(eq(coins.listingStatus, 'active'), sql`${coins.contractAddress} is not null`))
    .orderBy(asc(coins.updatedAt))
    .limit(Math.max(1, Math.min(60, limit)));

  const coinIds = coinRows.map((coin) => coin.id);
  if (!coinIds.length) return { checked: 0, updated: 0 };

  const snapshotRows = await db
    .select()
    .from(marketSnapshots)
    .where(inArray(marketSnapshots.coinId, coinIds))
    .orderBy(desc(marketSnapshots.recordedAt));
  const latestByCoin = firstByCoinId(snapshotRows);
  const refreshed = await refreshStaleMarketSnapshots(coinRows, latestByCoin);

  return { checked: coinRows.length, updated: refreshed.size };
}

async function runDedupeSync(fetcher: () => Promise<Map<number, MarketSnapshotRow>>) {
  if (syncState.spookycoinsMobulaInFlight) return syncState.spookycoinsMobulaInFlight;

  syncState.spookycoinsMobulaInFlight = withAdvisoryLock(fetcher).finally(() => {
    syncState.spookycoinsMobulaInFlight = undefined;
  });

  return syncState.spookycoinsMobulaInFlight;
}

async function withAdvisoryLock(fetcher: () => Promise<Map<number, MarketSnapshotRow>>) {
  const lockRows = await db.execute<{ locked: boolean }>(
    sql`select pg_try_advisory_lock(${lockId}) as locked`,
  );
  const locked = Boolean(lockRows[0]?.locked);
  if (!locked) return new Map<number, MarketSnapshotRow>();

  try {
    return await fetcher();
  } finally {
    await db.execute(sql`select pg_advisory_unlock(${lockId})`);
  }
}

async function syncCoinMarketData(coinRows: MarketSyncCoin[]) {
  const refreshed = new Map<number, MarketSnapshotRow>();

  for (const coin of coinRows) {
    const chainId = getMobulaChainId(coin.chain);
    const address = coin.contractAddress?.trim();
    if (!chainId || !address) continue;

    const details = await fetchMobulaTokenDetails(chainId, address);
    if (!details) continue;

    const [snapshot] = await db
      .insert(marketSnapshots)
      .values({
        coinId: coin.id,
        priceUsd: toDbNumber(details.priceUSD),
        marketCapUsd: toDbNumber(details.marketCapUSD),
        volume24hUsd: toDbNumber(details.volume24hUSD),
        change24h: toDbNumber(details.priceChange24hPercentage),
        liquidityUsd: toDbNumber(details.liquidityUSD),
        fdvUsd: toDbNumber(details.marketCapDilutedUSD),
        totalSupply: toDbNumber(details.totalSupply),
        holdersCount: toInteger(details.holdersCount),
        marketRank: toInteger(details.rank),
      })
      .returning();

    if (snapshot) refreshed.set(coin.id, snapshot);
  }

  return refreshed;
}

async function fetchMobulaTokenDetails(chainId: string, address: string) {
  const apiKey = process.env.MOBULA_API_KEY;
  if (!apiKey) return null;

  await waitForMobulaSlot();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);

  try {
    const url = new URL('/api/2/token/details', apiBaseUrl);
    url.searchParams.set('chainId', chainId);
    url.searchParams.set('address', address);

    const response = await fetch(url, {
      headers: {
        accept: 'application/json',
        Authorization: apiKey,
      },
      signal: controller.signal,
      cache: 'no-store',
    });

    if (!response.ok) return null;

    const payload = await response.json();
    return isRecord(payload?.data) ? (payload.data as MobulaTokenDetails) : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function shouldRefreshCoin(coin: MarketSyncCoin, snapshot: MarketSnapshotRow | undefined) {
  if (coin.listingStatus !== 'active') return false;
  if (!coin.contractAddress?.trim()) return false;
  if (!getMobulaChainId(coin.chain)) return false;
  if (!snapshot) return true;
  return Date.now() - snapshot.recordedAt.getTime() > cacheSeconds * 1_000;
}

function getMobulaChainId(chain: string | null) {
  if (!chain || !(chain in mobulaChainIds)) return '';
  return mobulaChainIds[chain as NetworkId] || '';
}

async function waitForMobulaSlot() {
  const now = Date.now();
  const nextAllowedAt = syncState.spookycoinsMobulaNextAllowedAt || 0;
  const delay = Math.max(0, nextAllowedAt - now);

  syncState.spookycoinsMobulaNextAllowedAt = Math.max(now, nextAllowedAt) + requestSpacingMs;
  if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
}

function firstByCoinId<T extends { coinId: number }>(rows: T[]) {
  const map = new Map<number, T>();
  rows.forEach((row) => {
    if (!map.has(row.coinId)) map.set(row.coinId, row);
  });
  return map;
}

function toDbNumber(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? String(number) : null;
}

function toInteger(value: unknown) {
  const number = Number(value);
  return Number.isSafeInteger(number) ? number : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isMissingMarketSnapshotColumnError(error: unknown): boolean {
  if (!isRecord(error)) return false;
  if (error.code === '42703') return true;
  return isMissingMarketSnapshotColumnError(error.cause);
}
