import { CoinDetailPage } from '@/components/coin/coin-detail-page';
import '../../market.css';
import '../../coin-page.css';

export default async function CoinPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  return <CoinDetailPage symbol={symbol} />;
}
