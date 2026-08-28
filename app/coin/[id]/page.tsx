import { notFound } from 'next/navigation';
import { CoinDetailPage } from '@/components/coin/coin-detail-page';
import { initialCoins } from '@/features/coins/data/initial-dataset';
import '../../market.css';
import '../../coin-page.css';

export default async function CoinPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const coin = initialCoins.find((item) => item.id === Number(id));
  if (!coin) notFound();
  return <CoinDetailPage initialCoin={coin} />;
}
