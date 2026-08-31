'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { AuthModal } from '@/features/auth/components/auth-modal';
import type { Coin } from '@/features/coins/types';
import { getBoostVoteFactor, toCoinListItem } from '@/features/coins/view';
import { makeChartPath } from '../utils';
import type { ChartPoint, ChartRange } from '../types';
import { ChangeRequestModal } from './change-request-modal';
import { CoinAd } from './coin-ad';
import { CoinChartCard } from './coin-chart-card';
import { CoinHero } from './coin-hero';
import { CoinInfoSections } from './coin-info-sections';
import { CoinSidebar } from './coin-sidebar';

export function CoinDetailPage({
  coinRecord,
  isSignedIn,
}: {
  coinRecord: Coin;
  isSignedIn: boolean;
}) {
  const canonicalCoin = coinRecord;
  const [coin, setCoin] = useState(() => toCoinListItem(canonicalCoin, 0));
  const contractAddress = coin.contractAddress || 'Contract address unavailable';
  const [voted, setVoted] = useState(coin.hasVoted);
  const [watched, setWatched] = useState(coin.isWatching);
  const [notice, setNotice] = useState('');
  const [authOpen, setAuthOpen] = useState(false);
  const [contractCopied, setContractCopied] = useState(false);
  const [changeRequestOpen, setChangeRequestOpen] = useState(false);
  const [voteAnimating, setVoteAnimating] = useState(false);
  const [watchAnimating, setWatchAnimating] = useState(false);
  const [range, setRange] = useState<ChartRange>('24H');
  const chartPoints = useMemo(
    () => makeMockChartPoints(canonicalCoin.id, range),
    [canonicalCoin.id, range],
  );
  const chartPath = useMemo(() => makeChartPath(chartPoints), [chartPoints]);

  async function vote() {
    if (voted) return;
    if (!isSignedIn) {
      setAuthOpen(true);
      return;
    }
    setNotice('');
    setVoted(true);
    setCoin((current) => ({
      ...current,
      hasVoted: true,
      rawVotes: current.rawVotes + 1,
      votes: current.votes + getBoostVoteFactor(current.boost),
      trend: current.trend + getBoostVoteFactor(current.boost),
    }));
    setVoteAnimating(true);
    window.setTimeout(() => setVoteAnimating(false), 650);

    const response = await fetch(`/api/coins/${coin.coinId}/vote`, { method: 'POST' });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      setVoted(false);
      setCoin((current) => ({
        ...current,
        hasVoted: false,
        rawVotes: Math.max(0, current.rawVotes - 1),
        votes: Math.max(0, current.votes - getBoostVoteFactor(current.boost)),
        trend: Math.max(0, current.trend - getBoostVoteFactor(current.boost)),
      }));
      setNotice(body.message || 'Could not record your vote.');
      return;
    }

    updateInteractionSummary(body.data?.summary);
  }

  async function toggleWatch() {
    if (!isSignedIn) {
      setAuthOpen(true);
      return;
    }
    const adding = !watched;
    setNotice('');
    setWatched(adding);
    setCoin((current) => ({
      ...current,
      isWatching: adding,
      watchCount: Math.max(0, current.watchCount + (adding ? 1 : -1)),
    }));
    if (adding) {
      setWatchAnimating(true);
      window.setTimeout(() => setWatchAnimating(false), 650);
    }

    const response = await fetch(`/api/coins/${coin.coinId}/watchlist`, { method: 'POST' });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      setWatched(!adding);
      setCoin((current) => ({
        ...current,
        isWatching: !adding,
        watchCount: Math.max(0, current.watchCount + (adding ? -1 : 1)),
      }));
      setNotice(body.message || 'Could not update your watchlist.');
      return;
    }

    updateInteractionSummary(body.data?.summary);
  }

  function updateInteractionSummary(
    summary:
      | {
          weeklyVotes?: number;
          totalVotes?: number;
          watchlistCount?: number;
          userHasVoted?: boolean;
          userWatching?: boolean;
        }
      | undefined,
  ) {
    if (!summary) return;
    setCoin((current) => {
      const rawVotes = summary.weeklyVotes ?? current.rawVotes;
      const boostedVotes = rawVotes * getBoostVoteFactor(current.boost);
      return {
        ...current,
        rawVotes,
        votes: boostedVotes,
        trend: current.trend - current.votes + boostedVotes,
        watchCount: summary.watchlistCount ?? current.watchCount,
        hasVoted: summary.userHasVoted ?? current.hasVoted,
        isWatching: summary.userWatching ?? current.isWatching,
      };
    });
    if (typeof summary.userHasVoted === 'boolean') setVoted(summary.userHasVoted);
    if (typeof summary.userWatching === 'boolean') setWatched(summary.userWatching);
  }

  async function copyContract() {
    await navigator.clipboard.writeText(contractAddress);
    setContractCopied(true);
    window.setTimeout(() => setContractCopied(false), 1400);
  }

  return (
    <main className="market-page coin-detail-page">
      <SiteHeader active="none" />

      <div className="container coin-breadcrumb">
        <Link href="/">Coins</Link>
        <span>/</span>
        <span>{coin.name}</span>
      </div>

      <CoinHero
        coin={coin}
        contractAddress={contractAddress}
        contractCopied={contractCopied}
        voted={voted}
        watched={watched}
        voteAnimating={voteAnimating}
        watchAnimating={watchAnimating}
        onCopyContract={copyContract}
        onToggleWatch={toggleWatch}
        onVote={vote}
      />

      {notice && (
        <div className="container interaction-notice" role="status">
          {notice}
        </div>
      )}

      <CoinAd />

      <div className="container coin-layout">
        <div className="coin-main-column">
          <CoinChartCard
            coin={coin}
            canonicalCoin={canonicalCoin}
            range={range}
            chartPath={chartPath}
            onRangeChange={setRange}
          />
          <CoinInfoSections coin={coin} />
        </div>

        <CoinSidebar
          coin={coin}
          voted={voted}
          voteAnimating={voteAnimating}
          onVote={vote}
          onOpenChangeRequest={() => setChangeRequestOpen(true)}
        />
      </div>

      <ChangeRequestModal
        coinName={coin.name}
        open={changeRequestOpen}
        onClose={() => setChangeRequestOpen(false)}
      />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      <SiteFooter />
    </main>
  );
}

function makeMockChartPoints(coinId: number, range: ChartRange): ChartPoint[] {
  const countByRange: Record<ChartRange, number> = {
    '1H': 24,
    '4H': 48,
    '24H': 72,
    '7D': 96,
    '30D': 120,
  };
  const count = countByRange[range];
  const seed = coinId % 37;
  return Array.from({ length: count }, (_, index) => {
    const wave = Math.sin((index + seed) / 5) * 0.09;
    const drift = index / count / 3;
    const jitter = Math.cos((index + seed) / 3) * 0.035;
    return {
      timestamp: Date.now() - (count - index) * 3_600_000,
      price: 1 + wave + drift + jitter,
    };
  });
}
