import 'server-only';

import { forgetJson, forgetJsonByPattern } from '@/lib/cache/json-cache';

export async function invalidateCoinDiscoveryCache(coinId?: number | null) {
  await Promise.all([
    forgetJson('topbar:summary:v1', 'coins:public:list:v1'),
    forgetJson(coinId ? `coins:public:detail:${coinId}:v1` : ''),
    forgetJsonByPattern(
      'leaderboard:*',
      'promoted-coins:active:*',
      'coins:interactions:*',
      'watchlist:public:*',
    ),
  ]);
}

export async function invalidateCoinInteractionCache(coinId?: number | null) {
  await Promise.all([
    forgetJson('topbar:summary:v1', 'coins:public:list:v1'),
    forgetJson(coinId ? `coins:public:detail:${coinId}:v1` : ''),
    forgetJsonByPattern('leaderboard:*', 'coins:interactions:*', 'watchlist:public:*'),
  ]);
}
