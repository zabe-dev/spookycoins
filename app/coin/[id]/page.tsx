import { notFound } from 'next/navigation';
import { CoinDetailPage } from '@/components/coin/coin-detail-page';
import { initialProjects } from '@/lib/projects/initial-dataset';
import '../../market.css';
import '../../coin-page.css';

export default async function CoinPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const project = initialProjects.find((item) => item.id === Number(id));
  if (!project) notFound();
  return <CoinDetailPage initialProject={project} />;
}
