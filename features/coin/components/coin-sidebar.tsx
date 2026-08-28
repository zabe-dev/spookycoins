'use client';

import { VoteButton } from '@/components/ui/action-buttons';
import { BoltIcon } from '@/features/coins/components';
import type { CoinDetailView } from '../types';
import { Info } from './detail-card';

export function CoinSidebar({
  coin,
  voted,
  voteAnimating,
  onVote,
  onOpenChangeRequest,
}: {
  coin: CoinDetailView;
  voted: boolean;
  voteAnimating: boolean;
  onVote: () => void;
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
          <b>{(coin.votes + (voted ? 1 : 0)).toLocaleString()}</b> community votes
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
          coinName={coin.name}
        />
        <small className="vote-rule">Vote for each coin once every 12 hours.</small>
      </section>
      {coin.boost && (
        <section className="detail-card boost-card-detail">
          <BoltIcon />
          <div>
            <small>ACTIVE PROMOTION</small>
            <h3>{coin.boost}× boost</h3>
          </div>
          <button>Boost coin ↗</button>
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
          <svg viewBox="0 0 24 24">
            <path d="M4 20h4l11-11-4-4L4 16v4Zm9-13 4 4M14 5l2-2 4 4-2 2" />
          </svg>
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
