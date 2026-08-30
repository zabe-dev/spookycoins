'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import type { Coin } from '@/features/coins/types';
import { toCoinListItem } from '@/features/coins/view';
import { makeChartPath } from '../utils';
import type { ChartPoint, ChartRange } from '../types';
import { ChangeRequestModal } from './change-request-modal';
import { CoinAd } from './coin-ad';
import { CoinChartCard } from './coin-chart-card';
import { CoinHero } from './coin-hero';
import { CoinInfoSections } from './coin-info-sections';
import { CoinSidebar } from './coin-sidebar';

export function CoinDetailPage({ coinRecord }: { coinRecord: Coin }) {
  const canonicalCoin = coinRecord;
  const coin = toCoinListItem(canonicalCoin, 0);
  const contractAddress = coin.contractAddress || 'Contract address unavailable';
  const [voted, setVoted] = useState(false);
  const [watched, setWatched] = useState(false);
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

  function vote() {
    if (voted) return;
    setVoted(true);
    setVoteAnimating(true);
    window.setTimeout(() => setVoteAnimating(false), 650);
  }

  function toggleWatch() {
    const adding = !watched;
    setWatched(adding);
    if (!adding) return;
    setWatchAnimating(true);
    window.setTimeout(() => setWatchAnimating(false), 650);
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
