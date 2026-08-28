'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Brand } from '@/components/brand';
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

export function CoinDetailPage({ initialCoin }: { initialCoin: Coin }) {
  const [canonicalCoin, setCanonicalCoin] = useState(initialCoin);
  const coin = toCoinListItem(canonicalCoin, 0);
  const contractAddress = coin.contractAddress || 'Contract address unavailable';
  const [voted, setVoted] = useState(false);
  const [watched, setWatched] = useState(false);
  const [contractCopied, setContractCopied] = useState(false);
  const [changeRequestOpen, setChangeRequestOpen] = useState(false);
  const [voteAnimating, setVoteAnimating] = useState(false);
  const [watchAnimating, setWatchAnimating] = useState(false);
  const [range, setRange] = useState<ChartRange>('24H');
  const [chartPoints, setChartPoints] = useState<ChartPoint[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/coins/${initialCoin.id}`, { signal: controller.signal })
      .then((response) => response.json() as Promise<{ data: Coin }>)
      .then(({ data }) => setCanonicalCoin(data))
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === 'AbortError')) console.warn(error);
      });
    return () => controller.abort();
  }, [initialCoin.id]);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/coins/${initialCoin.id}/chart?range=${range}`, {
      signal: controller.signal,
    })
      .then((response) => response.json() as Promise<{ data: ChartPoint[] }>)
      .then(({ data }) => setChartPoints(data))
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === 'AbortError')) console.warn(error);
      });
    return () => controller.abort();
  }, [initialCoin.id, range]);

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
      <footer className="container footer coin-footer">
        <Brand />
        <p>Community-powered crypto discovery.</p>
        <div>
          <a href="#">Methodology</a>
          <a href="#">Advertise</a>
          <a href="#">Terms</a>
        </div>
      </footer>
    </main>
  );
}
