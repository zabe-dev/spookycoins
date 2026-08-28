import type { CoinDetailView } from '../types';
import { Heading, Stat } from './detail-card';

export function CoinInfoSections({ coin }: { coin: CoinDetailView }) {
  return (
    <>
      <section className="detail-card">
        <Heading kicker="MARKET DATA" title="Token statistics" action="Updated moments ago" />
        <div className="stat-grid">
          <Stat label="Market cap" value={coin.cap} />
          <Stat label="24h volume" value={coin.volume24h} />
          <Stat label="Liquidity" value="—" />
          <Stat label="Holders" value="—" />
          <Stat label="Total supply" value="—" />
          <Stat label="Launch date" value={coin.launch} />
        </div>
      </section>

      <section className="detail-card about-card">
        <Heading kicker="COIN" title={`About ${coin.name}`} />
        <p>{coin.description || 'A coin description has not been provided yet.'}</p>
        <div className="tag-row">
          <span>{coin.category}</span>
          <span>{coin.chain} ecosystem</span>
        </div>
      </section>
    </>
  );
}
