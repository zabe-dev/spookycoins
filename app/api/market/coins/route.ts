import { getMarketProjects } from '@/lib/market/service';
import { toProjectListItem } from '@/lib/projects/view';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const requestedLimit = Number(url.searchParams.get('limit') ?? 100);
  const limit = Number.isFinite(requestedLimit) ? requestedLimit : 100;
  const projects = await getMarketProjects(limit);
  const coins = projects.map(toProjectListItem);

  return Response.json(
    { data: coins, meta: { count: coins.length, cachedForSeconds: 300 } },
    { headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' } },
  );
}
