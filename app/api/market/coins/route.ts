import { getMarketCoins } from '@/features/market/service';
import { toCoinListItem } from '@/features/coins/view';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const requestedLimit = Number(url.searchParams.get('limit') ?? 100);
  const limit = Number.isFinite(requestedLimit) ? requestedLimit : 100;
  const canonicalCoins = await getMarketCoins(limit);
  const coins = canonicalCoins.map(toCoinListItem);

  return Response.json(
    { data: coins, meta: { count: coins.length, cachedForSeconds: 300 } },
    { headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' } },
  );
}
