import { getProjectChart } from '@/lib/market/service';

const ranges = new Set(['1H', '4H', '24H', '7D', '30D']);
type ChartRange = '1H' | '4H' | '24H' | '7D' | '30D';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const range = new URL(request.url).searchParams.get('range') ?? '24H';
  if (!/^\d+$/.test(id) || !ranges.has(range)) {
    return Response.json({ error: 'Invalid chart request' }, { status: 400 });
  }
  try {
    const points = await getProjectChart(Number(id), range as ChartRange);
    return Response.json(
      { data: points },
      { headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' } },
    );
  } catch {
    return Response.json({ data: [] }, { status: 503 });
  }
}
