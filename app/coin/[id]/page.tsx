import { notFound } from 'next/navigation';
import { CoinDetailPage } from '@/features/coin/components/coin-detail-page';
import { mockCoins } from '@/features/coins/data/mock-coins';
import '../../market.css';
import '../../../features/coin/styles/coin-page.css';

export default async function CoinPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const coin = mockCoins.find((item) => item.id === Number(id));
  if (!coin) notFound();
  return <CoinDetailPage coinRecord={coin} />;
}
