import 'server-only';

import { db } from '@/lib/db/client';
import { coinVotes, coinWatchlists, coins, users } from '@/lib/db/schema';
import { and, desc, eq, gt, gte, inArray, sql } from 'drizzle-orm';

export const voteCooldownHours = 12;

type InteractionSummary = {
  weeklyVotes: number;
  totalVotes: number;
  watchlistCount: number;
  userHasVoted: boolean;
  userWatching: boolean;
};

export async function getCoinInteractionSummaries(coinIds: number[], userId?: string | null) {
  const summaries = new Map<number, InteractionSummary>();
  const uniqueIds = Array.from(new Set(coinIds));
  if (!uniqueIds.length) return summaries;

  uniqueIds.forEach((coinId) => {
    summaries.set(coinId, {
      weeklyVotes: 0,
      totalVotes: 0,
      watchlistCount: 0,
      userHasVoted: false,
      userWatching: false,
    });
  });

  const cooldownStart = addHours(new Date(), -voteCooldownHours);
  const weekStart = getCurrentVoteWeekStart();
  const interactionRows = await Promise.all([
    db
      .select({ coinId: coinVotes.coinId, count: sql<number>`count(*)::int` })
      .from(coinVotes)
      .where(and(inArray(coinVotes.coinId, uniqueIds), gte(coinVotes.createdAt, weekStart)))
      .groupBy(coinVotes.coinId),
    db
      .select({ coinId: coinVotes.coinId, count: sql<number>`count(*)::int` })
      .from(coinVotes)
      .where(inArray(coinVotes.coinId, uniqueIds))
      .groupBy(coinVotes.coinId),
    db
      .select({ coinId: coinWatchlists.coinId, count: sql<number>`count(*)::int` })
      .from(coinWatchlists)
      .where(inArray(coinWatchlists.coinId, uniqueIds))
      .groupBy(coinWatchlists.coinId),
    userId
      ? db
          .select({ coinId: coinVotes.coinId })
          .from(coinVotes)
          .where(
            and(
              eq(coinVotes.userId, userId),
              inArray(coinVotes.coinId, uniqueIds),
              gt(coinVotes.createdAt, cooldownStart),
            ),
          )
      : Promise.resolve([]),
    userId
      ? db
          .select({ coinId: coinWatchlists.coinId })
          .from(coinWatchlists)
          .where(and(eq(coinWatchlists.userId, userId), inArray(coinWatchlists.coinId, uniqueIds)))
      : Promise.resolve([]),
  ]).catch((error) => {
    if (isMissingInteractionTableError(error)) {
      return [[], [], [], [], []] as const;
    }
    throw error;
  });

  const [weeklyVotes, totalVotes, watchCounts, userVotes, userWatchlist] = interactionRows;

  weeklyVotes.forEach((row) => setSummaryValue(summaries, row.coinId, 'weeklyVotes', row.count));
  totalVotes.forEach((row) => setSummaryValue(summaries, row.coinId, 'totalVotes', row.count));
  watchCounts.forEach((row) => setSummaryValue(summaries, row.coinId, 'watchlistCount', row.count));
  userVotes.forEach((row) => setSummaryValue(summaries, row.coinId, 'userHasVoted', true));
  userWatchlist.forEach((row) => setSummaryValue(summaries, row.coinId, 'userWatching', true));

  return summaries;
}

export async function recordCoinVote({
  coinId,
  userId,
  ipAddress,
  userAgent,
}: {
  coinId: number;
  userId: string;
  ipAddress: string | null;
  userAgent: string | null;
}) {
  await assertActiveUser(userId);
  await assertActiveCoin(coinId);

  const cooldownStart = addHours(new Date(), -voteCooldownHours);
  const [recentVote] = await db
    .select({ createdAt: coinVotes.createdAt })
    .from(coinVotes)
    .where(
      and(
        eq(coinVotes.userId, userId),
        eq(coinVotes.coinId, coinId),
        gt(coinVotes.createdAt, cooldownStart),
      ),
    )
    .orderBy(desc(coinVotes.createdAt))
    .limit(1);

  if (recentVote) {
    const nextVoteAt = addHours(recentVote.createdAt, voteCooldownHours);
    return {
      ok: false as const,
      code: 'VOTE_COOLDOWN',
      message: `You can vote for this coin again ${formatRelativeTime(nextVoteAt)}.`,
      nextVoteAt: nextVoteAt.toISOString(),
      summary: await getSingleCoinSummary(coinId, userId),
    };
  }

  await db.insert(coinVotes).values({
    coinId,
    userId,
    ipAddress,
    userAgent,
    weekStartsAt: getCurrentVoteWeekStart(),
  });

  return {
    ok: true as const,
    code: 'VOTE_RECORDED',
    message: 'Vote recorded.',
    nextVoteAt: addHours(new Date(), voteCooldownHours).toISOString(),
    summary: await getSingleCoinSummary(coinId, userId),
  };
}

export async function toggleCoinWatchlist(coinId: number, userId: string) {
  await assertActiveUser(userId);
  await assertActiveCoin(coinId);

  const [existing] = await db
    .select({ id: coinWatchlists.id })
    .from(coinWatchlists)
    .where(and(eq(coinWatchlists.userId, userId), eq(coinWatchlists.coinId, coinId)))
    .limit(1);

  if (existing) {
    await db.delete(coinWatchlists).where(eq(coinWatchlists.id, existing.id));
  } else {
    await db.insert(coinWatchlists).values({ coinId, userId }).onConflictDoNothing();
  }

  return {
    watching: !existing,
    summary: await getSingleCoinSummary(coinId, userId),
  };
}

async function getSingleCoinSummary(coinId: number, userId: string) {
  const summaries = await getCoinInteractionSummaries([coinId], userId);
  return summaries.get(coinId);
}

async function assertActiveUser(userId: string) {
  const [user] = await db
    .select({ banned: users.banned })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user || user.banned) throw new Error('Your account cannot perform this action.');
}

async function assertActiveCoin(coinId: number) {
  const [coin] = await db
    .select({ listingStatus: coins.listingStatus })
    .from(coins)
    .where(eq(coins.id, coinId))
    .limit(1);

  if (!coin || coin.listingStatus !== 'active') {
    throw new Error('This coin is not available for voting or watchlist actions.');
  }
}

function setSummaryValue<K extends keyof InteractionSummary>(
  summaries: Map<number, InteractionSummary>,
  coinId: number,
  key: K,
  value: InteractionSummary[K],
) {
  const summary = summaries.get(coinId);
  if (summary) summary[key] = value;
}

export function getCurrentVoteWeekStart(date = new Date()) {
  const weekStart = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const day = weekStart.getUTCDay();
  const daysSinceMonday = (day + 6) % 7;
  weekStart.setUTCDate(weekStart.getUTCDate() - daysSinceMonday);
  return weekStart;
}

function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function formatRelativeTime(date: Date) {
  const remainingMs = Math.max(0, date.getTime() - Date.now());
  const remainingMinutes = Math.ceil(remainingMs / 60_000);
  if (remainingMinutes < 60) return `in ${remainingMinutes}m`;
  const hours = Math.floor(remainingMinutes / 60);
  const minutes = remainingMinutes % 60;
  return minutes ? `in ${hours}h ${minutes}m` : `in ${hours}h`;
}

export function isMissingInteractionTableError(error: unknown) {
  const cause = error instanceof Error ? (error as Error & { cause?: unknown }).cause : null;
  const message = error instanceof Error ? error.message : '';
  const causeMessage = cause instanceof Error ? cause.message : '';
  const code =
    isRecord(error) && typeof error.code === 'string'
      ? error.code
      : isRecord(cause) && typeof cause.code === 'string'
        ? cause.code
        : '';

  return (
    code === '42P01' ||
    message.includes('coin_votes') ||
    message.includes('coin_watchlists') ||
    causeMessage.includes('coin_votes') ||
    causeMessage.includes('coin_watchlists')
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
