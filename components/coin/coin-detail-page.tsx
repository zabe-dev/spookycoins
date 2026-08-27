'use client';
/* eslint-disable @next/next/no-img-element -- URLs come from replaceable market-data providers. */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Brand } from '@/components/brand';
import { VoteButton, WatchlistButton } from '@/components/actions/action-buttons';
import { CoinSocialActions } from '@/components/coin/coin-social-actions';
import { SiteHeader } from '@/components/layout/site-header';
import { BoltIcon } from '@/components/market-ui';
import { coins, type Coin } from '@/lib/market-data';

export function CoinDetailPage({ symbol }: { symbol: string }) {
  const [coin, setCoin] = useState<Coin>(
    coins.find((item) => item.symbol === symbol.toUpperCase()) ?? coins[0],
  );
  const contractAddress = coin.contractAddress || 'Contract address unavailable';
  const [voted, setVoted] = useState(false);
  const [watched, setWatched] = useState(false);
  const [contractCopied, setContractCopied] = useState(false);
  const [voteAnimating, setVoteAnimating] = useState(false);
  const [watchAnimating, setWatchAnimating] = useState(false);
  const [range, setRange] = useState('24H');

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/market/coins?limit=100', { signal: controller.signal })
      .then((response) => response.json() as Promise<{ data: Coin[] }>)
      .then(({ data }) => {
        const match = data.find((item) => item.symbol.toLowerCase() === symbol.toLowerCase());
        if (match) setCoin(match);
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === 'AbortError')) console.warn(error);
      });
    return () => controller.abort();
  }, [symbol]);

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
                <h1 className={coin.boost === 500 ? 'gold-name gold-name-animated' : ''}>
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
                <span className="coin-symbol">{coin.symbol}</span>
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
                <span className="positive">+28.4%</span>
              </div>
              <div className="range-tabs">
                {['1H', '4H', '24H', '7D', '30D'].map((item) => (
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
                <path
                  className="chart-area"
                  d="M0 255 C55 245 70 265 115 230 S180 240 220 205 S280 225 325 178 S390 198 430 150 S505 180 545 118 S625 150 665 92 S735 120 780 58 S850 76 900 28 L900 300 L0 300Z"
                />
                <path
                  className="chart-line"
                  d="M0 255 C55 245 70 265 115 230 S180 240 220 205 S280 225 325 178 S390 198 430 150 S505 180 545 118 S625 150 665 92 S735 120 780 58 S850 76 900 28"
                />
              </svg>
              <span className="chart-price-marker">{coin.price}</span>
            </div>
            <div className="chart-foot">
              <span>TradingView chart integration</span>
              <button>Open full chart ↗</button>
            </div>
          </section>

          <section className="detail-card">
            <Heading kicker="MARKET DATA" title="Token statistics" action="Updated moments ago" />
            <div className="stat-grid">
              <Stat label="Market cap" value={coin.cap} />
              <Stat label="24h volume" value="$3.84M" />
              <Stat label="Liquidity" value="$1.26M" />
              <Stat label="Holders" value="12,840" />
              <Stat label="Total supply" value="1B NMESH" />
              <Stat label="Launch date" value="Aug 21, 2026" />
            </div>
          </section>

          <section className="detail-card about-card">
            <Heading kicker="PROJECT" title={`About ${coin.name}`} />
            <p>
              NeuroMesh is a decentralized compute marketplace connecting AI developers with idle
              GPU resources. Its protocol coordinates workloads, verifies results, and rewards
              infrastructure providers through an open market.
            </p>
            <div className="tag-row">
              <span>Artificial Intelligence</span>
              <span>DePIN</span>
              <span>Utility</span>
              <span>Solana ecosystem</span>
            </div>
            <div className="project-links">
              <a href="#">Website ↗</a>
              <a href="#">Whitepaper ↗</a>
              <a href="#">Telegram ↗</a>
              <a href="#">X ↗</a>
              <a href="#">Discord ↗</a>
            </div>
          </section>

          <section className="detail-card">
            <Heading
              kicker="TRUST & SECURITY"
              title="Project verification"
              action="3 checks available"
            />
            <div className="security-list">
              <Security title="Identity verification" provider="Assure KYC" status="KYC verified" />
              <Security title="Smart contract audit" provider="SolidProof" status="Audit passed" />
              <Security title="Liquidity lock" provider="Streamflow" status="Locked 365 days" />
            </div>
            <p className="security-note">
              Third-party checks are provided for reference and do not constitute an endorsement by
              SpookyCoins.
            </p>
          </section>
        </div>

        <aside className="coin-sidebar">
          <section className="detail-card voting-card">
            <small>WEEK 35 RANKING</small>
            <div className="ranking-number">
              <span>#</span>1
            </div>
            <p>
              <b>{(coin.votes + (voted ? 1 : 0)).toLocaleString()}</b> community votes
            </p>
            <div className="vote-progress">
              <i style={{ width: '78%' }} />
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
          <section className="detail-card boost-card-detail">
            <BoltIcon />
            <div>
              <small>ACTIVE PROMOTION</small>
              <h3>{coin.boost ?? 0}× boost</h3>
              <p>Featured until Aug 30 · 14:00 UTC</p>
            </div>
            <button>Boost project ↗</button>
          </section>
          <section className="detail-card quick-info">
            <h3>Project information</h3>
            <Info label="Network" value={coin.chain} />
            <Info label="Category" value={coin.category} />
            <Info label="Submitted" value={coin.age} />
            <Info label="Status" value="Launched" />
            <Info label="KYC" value="Verified" positive />
            <Info label="Audit" value="Passed" positive />
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
            <button>Request a change</button>
          </section>
          <div className="sidebar-ad">
            <small>AD SPACE</small>
            <b>Your project here</b>
            <span>Measured impressions and clicks</span>
            <button>View packages ↗</button>
          </div>
        </aside>
      </div>
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
function Security({
  title,
  provider,
  status,
}: {
  title: string;
  provider: string;
  status: string;
}) {
  return (
    <div>
      <span className="security-check">✓</span>
      <div>
        <b>{title}</b>
        <span>{provider}</span>
      </div>
      <strong>{status}</strong>
      <button>View ↗</button>
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
