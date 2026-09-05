import 'server-only';

import type { LeaderboardPage, LeaderboardQuery } from '@/features/coins/leaderboard-types';
import type { CoinListItem } from '@/features/coins/view';
import { getPublicCoinListItems } from './coin-list';
import { getLeaderboardPage } from './leaderboard';

export type DiscoveryData = {
  coins: CoinListItem[];
  leaderboard: LeaderboardPage;
};

export async function getDiscoveryData(query: LeaderboardQuery = {}): Promise<DiscoveryData> {
  const [coins, leaderboard] = await Promise.all([
    getPublicCoinListItems(query.userId),
    getLeaderboardPage(query),
  ]);

  return {
    coins,
    leaderboard,
  };
}
