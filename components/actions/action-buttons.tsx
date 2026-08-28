'use client';

import type { CSSProperties } from 'react';

export function ActionBurst() {
  return (
    <span className="action-burst" aria-hidden="true">
      {Array.from({ length: 8 }, (_, index) => (
        <i key={index} style={{ '--ray': `${index * 45}deg` } as CSSProperties} />
      ))}
    </span>
  );
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg className="star-svg" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="m12 2.8 2.75 5.57 6.15.9-4.45 4.33 1.05 6.12L12 16.83l-5.5 2.89 1.05-6.12L3.1 9.27l6.15-.9L12 2.8Z"
        fill={filled ? 'currentColor' : 'none'}
      />
    </svg>
  );
}

export function WatchlistButton({
  active,
  animating = false,
  onClick,
  appearance = 'table',
}: {
  active: boolean;
  animating?: boolean;
  onClick: () => void;
  appearance?: 'table' | 'detail';
}) {
  return (
    <button
      className={`${appearance === 'table' ? 'watch-btn' : 'detail-watch'} action-button action-button--watch ${active ? (appearance === 'table' ? 'watched' : 'active') : ''} ${animating ? 'just-watched' : ''}`}
      onClick={onClick}
      aria-label={active ? 'Remove from watchlist' : 'Add to watchlist'}
    >
      <ActionBurst />
      <span>
        <StarIcon filled={active} />
        {appearance === 'detail' && (active ? 'Watching' : 'Watchlist')}
      </span>
    </button>
  );
}

export function VoteButton({
  active,
  animating = false,
  onClick,
  appearance = 'table',
  coinName,
}: {
  active: boolean;
  animating?: boolean;
  onClick: () => void;
  appearance?: 'table' | 'detail' | 'sidebar';
  coinName?: string;
}) {
  const baseClass =
    appearance === 'table' ? 'vote-btn' : appearance === 'sidebar' ? 'sidebar-vote' : 'detail-vote';
  const label =
    appearance === 'sidebar'
      ? active
        ? 'Vote recorded ✓'
        : `Vote for ${coinName ?? 'project'}`
      : active
        ? 'Voted ✓'
        : 'Vote +1';

  return (
    <button
      className={`${baseClass} action-button action-button--vote ${active ? (appearance === 'table' ? 'voted' : 'active') : ''} ${animating ? 'just-voted' : ''}`}
      onClick={onClick}
    >
      <ActionBurst />
      <span className="action-button__label">{label}</span>
    </button>
  );
}
