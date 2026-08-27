import { getMarketTickers } from '@/lib/market/service';

export async function GET() {
  try {
    const rows = await getMarketTickers(['btc', 'eth', 'bnb']);
    return Response.json(
      {
        data: rows.map((row) => ({
          symbol: row.symbol.toUpperCase(),
          price: row.currentPrice,
          change: row.change24h,
        })),
      },
      { headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' } },
    );
  } catch {
    return Response.json({ data: [] }, { status: 503 });
  }
}
