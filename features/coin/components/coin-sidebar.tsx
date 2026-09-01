'use client';

import { VoteButton, WatchlistButton } from '@/components/ui/action-buttons';
import { BoltIcon } from '@/features/coins/components';
import Link from 'next/link';
import { Pencil } from 'lucide-react';
import type { CoinDetailView } from '../types';
import { Info } from './detail-card';

export function CoinSidebar({
  coin,
  voted,
  watched,
  voteAnimating,
  watchAnimating,
  onVote,
  onToggleWatch,
  onOpenChangeRequest,
}: {
  coin: CoinDetailView;
  voted: boolean;
  watched: boolean;
  voteAnimating: boolean;
  watchAnimating: boolean;
  onVote: () => void;
  onToggleWatch: () => void;
  onOpenChangeRequest: () => void;
}) {
  return (
    <aside className="coin-sidebar">
      <section className="detail-card voting-card">
        <small>WEEK 35 RANKING</small>
        <div className="ranking-number">
          <span>#</span>
          {coin.rank}
        </div>
        <p>
          <b>{coin.votes.toLocaleString()}</b> community votes
        </p>
        <div className="vote-progress">
          <i style={{ width: coin.votes ? '20%' : '0%' }} />
        </div>
        <div className="vote-reset-inline">
          <span>Next reset</span>
          <b>04d : 12h</b>
        </div>
        <VoteButton
          active={voted}
          animating={voteAnimating}
          onClick={onVote}
          appearance="sidebar"
          coinName={coin.symbol}
        />
        <WatchlistButton
          active={watched}
          animating={watchAnimating}
          onClick={onToggleWatch}
          appearance="detail"
        />
        <small className="vote-rule">Vote for each coin once every 12 hours.</small>
      </section>
      {coin.boost ? (
        <section className="detail-card boost-card-detail">
          <div className="boost-card-icon" aria-hidden="true">
            <BoltIcon />
          </div>
          <div className="boost-card-copy">
            <small>ACTIVE BOOST</small>
            <h3>{coin.boost}× vote boost</h3>
            <p>This coin is getting extra vote power while the package is active.</p>
          </div>
        </section>
      ) : (
        <section className="detail-card boost-cta-card">
          <div className="boost-card-icon" aria-hidden="true">
            <BoltIcon />
          </div>
          <div>
            <small>BOOST VISIBILITY</small>
            <h3>Boost this coin</h3>
            <p>Put this project in front of more hunters with a voting boost package.</p>
          </div>
          <Link href="/advertise">View boost packages ↗</Link>
        </section>
      )}
      <section className="detail-card quick-info">
        <h3>Coin information</h3>
        <Info label="Network" value={coin.chain} />
        <Info label="Category" value={coin.category} />
        <Info label="Submitted" value={coin.age} />
        <Info label="Status" value="Launched" />
      </section>
      <section className="detail-card request-change-card">
        <div className="request-change-icon" aria-hidden="true">
          <Pencil />
        </div>
        <div>
          <h3>Something incorrect?</h3>
          <p>Request an update to this coin&apos;s information, links, or listing.</p>
        </div>
        <button onClick={onOpenChangeRequest}>Request a change</button>
      </section>
      <div className="sidebar-ad">
        <small>AD SPACE</small>
        <b>Your coin here</b>
        <span>Measured impressions and clicks</span>
        <button>View packages ↗</button>
      </div>
    </aside>
  );
}
