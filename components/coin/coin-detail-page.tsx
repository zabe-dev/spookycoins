'use client';
/* eslint-disable @next/next/no-img-element -- URLs come from replaceable market-data providers. */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Brand } from '@/components/brand';
import { VoteButton, WatchlistButton } from '@/components/actions/action-buttons';
import { CoinSocialActions } from '@/components/coin/coin-social-actions';
import { ChangeRequestModal } from '@/components/coin/change-request-modal';
import { SiteHeader } from '@/components/layout/site-header';
import { BoltIcon } from '@/components/market-ui';
import type { Project } from '@/lib/projects/types';
import { toProjectListItem } from '@/lib/projects/view';

type ChartRange = '1H' | '4H' | '24H' | '7D' | '30D';
type ChartPoint = { timestamp: number; price: number };

export function CoinDetailPage({ initialProject }: { initialProject: Project }) {
  const [project, setProject] = useState(initialProject);
  const coin = toProjectListItem(project, 0);
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
    fetch(`/api/projects/${initialProject.id}`, { signal: controller.signal })
      .then((response) => response.json() as Promise<{ data: Project }>)
      .then(({ data }) => setProject(data))
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === 'AbortError')) console.warn(error);
      });
    return () => controller.abort();
  }, [initialProject.id]);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/projects/${initialProject.id}/chart?range=${range}`, {
      signal: controller.signal,
    })
      .then((response) => response.json() as Promise<{ data: ChartPoint[] }>)
      .then(({ data }) => setChartPoints(data))
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === 'AbortError')) console.warn(error);
      });
    return () => controller.abort();
  }, [initialProject.id, range]);

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
      <section className="container coin-hero">
        <div className="coin-heading-main">
          <div className="coin-identity">
            <div className={`detail-logo ${coin.color}`}>
              {coin.image ? <img src={coin.image} alt="" /> : coin.logo}
              <span>{coin.chain}</span>
            </div>
            <div className="coin-title-copy">
              <div className="coin-name-line">
                <h1
                  className={coin.boost === 500 ? 'gold-name gold-name-animated' : ''}
                  title={coin.name}
                >
                  {coin.name}
                </h1>
                {coin.boost && (
                  <span className={`boost-badge boost-${coin.boost}`}>
                    <BoltIcon />
                    {coin.boost}×
                  </span>
                )}
              </div>
              <div className="coin-meta-row">
                <span className="coin-symbol">${coin.symbol}</span>
                <div className="contract-line">
                  <code title={contractAddress}>{contractAddress}</code>
                  {coin.contractAddress && (
                    <button onClick={copyContract} aria-label="Copy contract address">
                      {contractCopied ? 'Copied' : 'Copy'}
                    </button>
                  )}
                </div>
                <span>{coin.chain}</span>
                <span>{coin.category}</span>
              </div>
              <CoinSocialActions buyUrl={coin.buyUrl} />
            </div>
          </div>
          <div className="coin-heading-trade">
            <div className="coin-price-block">
              <small>PRICE USD</small>
              <div>
                <strong>{coin.price}</strong>
                <span className={coin.change >= 0 ? 'positive' : 'negative'}>
                  {coin.change >= 0 ? '+' : ''}
                  {coin.change}%
                </span>
              </div>
            </div>
            <div className="coin-primary-actions">
              <WatchlistButton
                active={watched}
                animating={watchAnimating}
                onClick={toggleWatch}
                appearance="detail"
              />
              <VoteButton
                active={voted}
                animating={voteAnimating}
                onClick={vote}
                appearance="detail"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="container coin-ad">
        <small>ADVERTISEMENT</small>
        <span>
          <b>Reach crypto&apos;s earliest project hunters.</b> Premium inventory · Measured
          impressions and clicks
        </span>
        <button>View ad packages ↗</button>
      </div>

      <div className="container coin-layout">
        <div className="coin-main-column">
          <section className="detail-card chart-card">
            <div className="chart-head">
              <div>
                <small>{coin.symbol} / USD</small>
                <strong>{coin.price}</strong>
                <span className={coin.change >= 0 ? 'positive' : 'negative'}>
                  {coin.change >= 0 ? '+' : ''}
                  {coin.change}%
                </span>
              </div>
              <div className="range-tabs">
                {(['1H', '4H', '24H', '7D', '30D'] as ChartRange[]).map((item) => (
                  <button
                    key={item}
                    className={range === item ? 'active' : ''}
                    onClick={() => setRange(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
            <div className="price-chart" aria-label={`${coin.name} price chart for ${range}`}>
              <div className="chart-grid" />
              <svg viewBox="0 0 900 300" preserveAspectRatio="none" aria-hidden="true">
                <defs>
                  <linearGradient id="chartArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#c4ff44" stopOpacity=".25" />
                    <stop offset="1" stopColor="#c4ff44" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {chartPath && <path className="chart-area" d={`${chartPath} L900 300 L0 300Z`} />}
                {chartPath && <path className="chart-line" d={chartPath} />}
              </svg>
              {chartPath ? (
                <span className="chart-price-marker">{coin.price}</span>
              ) : (
                <span className="chart-unavailable">Historical chart unavailable</span>
              )}
            </div>
            <div className="chart-foot">
              <span>Historical market chart · {range}</span>
              {project.dex.available && (
                <a href={project.dex.url} target="_blank" rel="noreferrer">
                  Open DEX ↗
                </a>
              )}
            </div>
          </section>

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
            <Heading kicker="PROJECT" title={`About ${coin.name}`} />
            <p>{coin.description || 'A project description has not been provided yet.'}</p>
            <div className="tag-row">
              <span>{coin.category}</span>
              <span>{coin.chain} ecosystem</span>
            </div>
          </section>
        </div>

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
              onClick={vote}
              appearance="sidebar"
              coinName={coin.name}
            />
            <small className="vote-rule">Vote for each project once every 12 hours.</small>
          </section>
          {coin.boost && (
            <section className="detail-card boost-card-detail">
              <BoltIcon />
              <div>
                <small>ACTIVE PROMOTION</small>
                <h3>{coin.boost}× boost</h3>
              </div>
              <button>Boost project ↗</button>
            </section>
          )}
          <section className="detail-card quick-info">
            <h3>Project information</h3>
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
              <p>Request an update to this project&apos;s information, links, or listing.</p>
            </div>
            <button onClick={() => setChangeRequestOpen(true)}>Request a change</button>
          </section>
          <div className="sidebar-ad">
            <small>AD SPACE</small>
            <b>Your project here</b>
            <span>Measured impressions and clicks</span>
            <button>View packages ↗</button>
          </div>
        </aside>
      </div>
      <ChangeRequestModal
        projectName={coin.name}
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

function Heading({ kicker, title, action }: { kicker: string; title: string; action?: string }) {
  return (
    <div className="card-heading">
      <div>
        <small>{kicker}</small>
        <h2>{title}</h2>
      </div>
      {action && <span>{action}</span>}
    </div>
  );
}
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}
function Info({
  label,
  value,
  positive = false,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div>
      <span>{label}</span>
      <b className={positive ? 'positive' : ''}>{value}</b>
    </div>
  );
}

function makeChartPath(points: ChartPoint[]) {
  if (points.length < 2) return '';
  const sampled = points.filter(
    (_, index) => index % Math.max(1, Math.floor(points.length / 180)) === 0,
  );
  const prices = sampled.map((point) => point.price);
  const minimum = Math.min(...prices);
  const maximum = Math.max(...prices);
  const spread = maximum - minimum || 1;
  return sampled
    .map((point, index) => {
      const x = (index / (sampled.length - 1)) * 900;
      const y = 280 - ((point.price - minimum) / spread) * 250;
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');
}
