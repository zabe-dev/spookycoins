import { getMarketProject } from '@/lib/market/service';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) return Response.json({ error: 'Invalid project ID' }, { status: 400 });
  const project = await getMarketProject(Number(id));
  if (!project) return Response.json({ error: 'Project not found' }, { status: 404 });
  return Response.json(
    { data: project },
    { headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' } },
  );
}
