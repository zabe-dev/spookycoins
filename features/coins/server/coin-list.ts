import 'server-only';

import { db } from '@/lib/db/client';
import {
  coinBoosts,
  coinLinks,
  coinPromotions,
  coins,
  coinSubmissions,
  marketSnapshots,
} from '@/lib/db/schema';
import { NETWORKS } from '@/features/coins/networks';
import { processExpiredCoinDeletionRequests } from '@/features/coins/server/delete-requests';
import { getCoinInteractionSummaries } from '@/features/coins/server/interactions';
import type {
  BoostMultiplier,
  Coin,
  CoinCategory,
  DexConfig,
  NetworkId,
} from '@/features/coins/types';
import { toCoinListItem, type CoinListItem } from '@/features/coins/view';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';

const boostMultipliers = [10, 30, 50, 100, 500] as const;

type DbCoin = typeof coins.$inferSelect;
type DbMarketSnapshot = typeof marketSnapshots.$inferSelect;
type DbCoinBoost = typeof coinBoosts.$inferSelect;
type DbCoinPromotion = typeof coinPromotions.$inferSelect;
type DbCoinLink = typeof coinLinks.$inferSelect;
type DbCoinSubmission = typeof coinSubmissions.$inferSelect;
type InteractionSummary = NonNullable<
  Awaited<ReturnType<typeof getCoinInteractionSummaries>> extends Map<number, infer Summary>
    ? Summary
    : never
>;

export async function getPublicCoinListItems(userId?: string | null): Promise<CoinListItem[]> {
  const coinRecords = await getPublicCoinRecords(undefined, userId);
  return coinRecords.map((coin, index) => toCoinListItem(coin, index));
}

export async function getPublicCoinById(id: number, userId?: string | null): Promise<Coin | null> {
  const [coin] = await getPublicCoinRecords(id, userId);
  return coin || null;
}

async function getPublicCoinRecords(coinId?: number, userId?: string | null): Promise<Coin[]> {
  await processExpiredCoinDeletionRequests();

  const now = new Date();
  const nowIso = now.toISOString();
  const coinRows = await db
    .select()
    .from(coins)
    .where(coinId ? eq(coins.id, coinId) : eq(coins.listingStatus, 'active'))
    .orderBy(desc(coins.submittedAt))
    .limit(coinId ? 1 : 500);

  if (!coinRows.length) return [];

  const coinIds = coinRows.map((coin) => coin.id);
  const [snapshotRows, boostRows, promotionRows, linkRows, submissionRows] = await Promise.all([
    db
      .select()
      .from(marketSnapshots)
      .where(inArray(marketSnapshots.coinId, coinIds))
      .orderBy(desc(marketSnapshots.recordedAt)),
    db
      .select()
      .from(coinBoosts)
      .where(
        and(
          inArray(coinBoosts.coinId, coinIds),
          eq(coinBoosts.status, 'active'),
          sql`${coinBoosts.expiresAt} > ${nowIso}::timestamptz`,
        ),
      )
      .orderBy(desc(coinBoosts.expiresAt)),
    db
      .select()
      .from(coinPromotions)
      .where(
        and(
          inArray(coinPromotions.coinId, coinIds),
          eq(coinPromotions.status, 'active'),
          sql`${coinPromotions.expiresAt} > ${nowIso}::timestamptz`,
        ),
      )
      .orderBy(desc(coinPromotions.expiresAt)),
    db.select().from(coinLinks).where(inArray(coinLinks.coinId, coinIds)),
    db
      .select()
      .from(coinSubmissions)
      .where(
        and(
          inArray(coinSubmissions.coinId, coinIds),
          eq(coinSubmissions.submissionType, 'new-coin'),
        ),
      )
      .orderBy(desc(coinSubmissions.createdAt)),
  ]);

  const snapshotByCoin = firstByCoinId(snapshotRows);
  const boostByCoin = firstByCoinId(boostRows);
  const promotionByCoin = firstByCoinId(promotionRows);
  const linksByCoin = groupLinksByCoinId(linkRows);
  const submissionByCoin = firstByCoinId(submissionRows.filter(hasLinkedCoinId));
  const interactionsByCoin = await getCoinInteractionSummaries(coinIds, userId);

  return coinRows.map((coin, index) =>
    mapDbCoinToCoin({
      coin,
      index,
      snapshot: snapshotByCoin.get(coin.id) || null,
      boost: boostByCoin.get(coin.id) || null,
      promotion: promotionByCoin.get(coin.id) || null,
      links: linksByCoin.get(coin.id) || new Map(),
      submission: submissionByCoin.get(coin.id) || null,
      interactions: interactionsByCoin.get(coin.id) || null,
    }),
  );
}

function mapDbCoinToCoin({
  coin,
  index,
  snapshot,
  boost,
  promotion,
  links,
  submission,
  interactions,
}: {
  coin: DbCoin;
  index: number;
  snapshot: DbMarketSnapshot | null;
  boost: DbCoinBoost | null;
  promotion: DbCoinPromotion | null;
  links: Map<string, DbCoinLink>;
  submission: DbCoinSubmission | null;
  interactions: InteractionSummary | null;
}): Coin {
  const network = toNetworkId(coin.chain);
  const dexLink = links.get('dex');
  const websiteLink = links.get('website');

  return {
    id: coin.id,
    externalId: `spookycoins-db-${coin.id}`,
    name: coin.name,
    symbol: coin.symbol,
    slug: coin.slug,
    assetType: 'token',
    lifecycle: coin.isPresale ? 'presale' : 'launched',
    network,
    contractAddress: coin.contractAddress || '',
    logoUrl: coin.logoUrl,
    description: coin.description,
    category: toCoinCategory(coin.category),
    launchDate: coin.launchDate ? coin.launchDate.toISOString() : null,
    presaleEndDate: readPresaleEndDate(submission?.coinData),
    submittedAt: coin.submittedAt.toISOString(),
    populatedAt: coin.updatedAt.toISOString(),
    chart: buildChartConfig(links),
    dex: buildDexConfig(dexLink, websiteLink),
    boost:
      boost && isBoostMultiplier(boost.multiplier)
        ? {
            active: true,
            multiplier: boost.multiplier,
            startsAt: boost.startsAt.toISOString(),
            endsAt: boost.expiresAt.toISOString(),
          }
        : { active: false },
    promoted: promotion
      ? {
          active: true,
          startsAt: promotion.startsAt.toISOString(),
          endsAt: promotion.expiresAt.toISOString(),
          placement: 'promoted-table',
          priority: promotion.priority,
        }
      : { active: false },
    market: {
      priceUsd: toNumber(snapshot?.priceUsd),
      marketCapUsd: toNumber(snapshot?.marketCapUsd),
      volume24hUsd: toNumber(snapshot?.volume24hUsd),
      change24h: toNumber(snapshot?.change24h),
      marketRank: snapshot?.marketRank ?? index + 1,
      lastUpdatedAt: snapshot?.recordedAt.toISOString() ?? null,
    },
    community: {
      weeklyVotes: interactions?.weeklyVotes || 0,
      totalVotes: interactions?.totalVotes || 0,
      watchlistCount: interactions?.watchlistCount || 0,
      userHasVoted: interactions?.userHasVoted || false,
      userWatching: interactions?.userWatching || false,
    },
  };
}

function firstByCoinId<T extends { coinId: number }>(rows: T[]) {
  const map = new Map<number, T>();
  rows.forEach((row) => {
    if (!map.has(row.coinId)) map.set(row.coinId, row);
  });
  return map;
}

function hasLinkedCoinId(row: DbCoinSubmission): row is DbCoinSubmission & { coinId: number } {
  return typeof row.coinId === 'number';
}

function readPresaleEndDate(value: unknown) {
  if (!isRecord(value)) return null;
  const market = isRecord(value.market) ? value.market : {};
  const presale = isRecord(market.presale) ? market.presale : {};
  const endDate = typeof presale.endDate === 'string' ? presale.endDate : '';
  return endDate || null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function groupLinksByCoinId(rows: DbCoinLink[]) {
  const map = new Map<number, Map<string, DbCoinLink>>();
  rows.forEach((row) => {
    const links = map.get(row.coinId) || new Map<string, DbCoinLink>();
    links.set(row.type, row);
    map.set(row.coinId, links);
  });
  return map;
}

function buildChartConfig(links: Map<string, DbCoinLink>): Coin['chart'] {
  const chart = links.get('chart');
  if (chart?.url) return { source: 'external', url: chart.url };
  return { source: 'unavailable' };
}

function buildDexConfig(
  dexLink: DbCoinLink | undefined,
  websiteLink: DbCoinLink | undefined,
): DexConfig {
  if (dexLink?.url) return { available: true, provider: 'custom', url: dexLink.url };
  if (websiteLink?.url) return { available: true, provider: 'custom', url: websiteLink.url };
  return { available: false };
}

function toNetworkId(value: string | null): NetworkId {
  if (value && value in NETWORKS) return value as NetworkId;
  return 'other';
}

function toCoinCategory(value: string): CoinCategory {
  const categories: CoinCategory[] = [
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
  return categories.includes(value as CoinCategory) ? (value as CoinCategory) : 'Other';
}

function isBoostMultiplier(value: number): value is BoostMultiplier {
  return boostMultipliers.includes(value as BoostMultiplier);
}

function toNumber(value: string | number | null | undefined) {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
