import { getMarketCoin } from '@/features/market/service';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) return Response.json({ error: 'Invalid coin ID' }, { status: 400 });
  const coin = await getMarketCoin(Number(id));
  if (!coin) return Response.json({ error: 'Coin not found' }, { status: 404 });
  return Response.json(
    { data: coin },
    { headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' } },
  );
}
