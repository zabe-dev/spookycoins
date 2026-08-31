'use client';
/* eslint-disable @next/next/no-img-element -- Chain dropdown needs a remote Iconify SVG for Other alongside local icon files. */
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import {
  BannerAd as Ad,
  CoinCells as Cells,
  DiscoveryCard as Discovery,
  LineBurst,
  SortHeader as SH,
  CoinTable as SimpleTable,
  TableScroller,
  SectionTitle as Title,
  WatchButton as Watch,
} from '@/features/coins/components';
import {
  coinCategories,
  coinChainChoices,
  coinChainOptions,
  getBoostVoteFactor,
  type CoinListItem,
  type CoinSortKey,
} from '@/features/coins/view';
import { WeeklyResetChip } from '@/features/leaderboard/components/weekly-reset-chip';
import { Check, ChevronDown, ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
/* Market data and reusable UI live in dedicated modules; this page owns orchestration state. */

type LeaderboardView =
  'Most voted' | 'Launched coins' | 'Launched recently' | 'Presales' | 'Most watched';

const viewParams: Record<LeaderboardView, string> = {
  'Most voted': 'most-voted',
  'Launched coins': 'launched',
  'Launched recently': 'recent',
  Presales: 'presales',
  'Most watched': 'watched',
};
const paramsToView = Object.fromEntries(
  Object.entries(viewParams).map(([label, value]) => [value, label]),
) as Record<string, LeaderboardView>;
const sortKeys: CoinSortKey[] = [
  'rank',
  'name',
  'capN',
  'price',
  'change',
  'launch',
  'boost',
  'votes',
  'age',
];

export function HomeClient({ initialCoins }: { initialCoins: CoinListItem[] }) {
  const [marketCoins, setMarketCoins] = useState<CoinListItem[]>(initialCoins);
  const [view, setView] = useState<LeaderboardView>('Most voted'),
    [category, setCategory] = useState('All'),
    [chain, setChain] = useState('All chains'),
    [search, setSearch] = useState('');
  const [sort, setSort] = useState<{ key: CoinSortKey; dir: 1 | -1 }>({
      key: 'votes',
      dir: -1,
    }),
    [page, setPage] = useState(1),
    [voted, setVoted] = useState<number[]>(() =>
      initialCoins.filter((coin) => coin.hasVoted).map((coin) => coin.coinId),
    ),
    [animating, setAnimating] = useState<number | null>(null),
    [watchlist, setWatchlist] = useState<number[]>(() =>
      initialCoins.filter((coin) => coin.isWatching).map((coin) => coin.coinId),
    ),
    [watchAnimating, setWatchAnimating] = useState<number | null>(null),
    [interactionNotice, setInteractionNotice] = useState(''),
    [adVisible, setAdVisible] = useState(true),
    [hotspotRefresh, setHotspotRefresh] = useState(0),
    [viewParamExplicit, setViewParamExplicit] = useState(false),
    [urlReady, setUrlReady] = useState(false);
  const categoryRef = useRef<HTMLDivElement>(null);
  const chainMenuRef = useRef<HTMLDivElement>(null);
  const hotspotTouchStartRef = useRef<number | null>(null);
  const [categoryEdges, setCategoryEdges] = useState({ left: false, right: true });
  const [chainMenuOpen, setChainMenuOpen] = useState(false);
  const selectedChainChoice = coinChainChoices.find((choice) => choice.label === chain);
  const [hotspotsVisible, setHotspotsVisible] = useState(true),
    [hotspotIndex, setHotspotIndex] = useState(0);
  useEffect(() => {
    function closeChainMenu(event: PointerEvent) {
      if (!chainMenuRef.current?.contains(event.target as Node)) setChainMenuOpen(false);
    }
    document.addEventListener('pointerdown', closeChainMenu);
    return () => document.removeEventListener('pointerdown', closeChainMenu);
  }, []);
  useEffect(() => {
    const applyUrlState = () => {
      const params = new URLSearchParams(window.location.search);
      const hasViewParam = params.has('coins') || params.has('view');
      const nextView = paramsToView[params.get('coins') || params.get('view') || ''];
      const nextSort = params.get('sort') as CoinSortKey | null;
      const nextCategory = params.get('category');
      const nextChain = params.get('chain');
      setView(nextView || 'Most voted');
      setViewParamExplicit(hasViewParam);
      if (nextSort && sortKeys.includes(nextSort)) {
        setSort({ key: nextSort, dir: params.get('dir') === 'desc' ? -1 : 1 });
      }
      if (
        nextCategory &&
        coinCategories.includes(nextCategory as (typeof coinCategories)[number])
      ) {
        setCategory(nextCategory);
      }
      if (nextChain && coinChainOptions.includes(nextChain)) setChain(nextChain);
      setSearch(params.get('q') || '');
      setPage(Math.max(1, Number(params.get('page')) || 1));
      setUrlReady(true);
    };
    applyUrlState();
    window.addEventListener('popstate', applyUrlState);
    return () => window.removeEventListener('popstate', applyUrlState);
  }, []);
  useEffect(() => {
    if (!urlReady) return;
    const params = new URLSearchParams();
    if (viewParamExplicit || view !== 'Most voted') {
      params.set('coins', viewParams[view]);
    }
    if (sort.key !== 'votes' || sort.dir !== -1) {
      params.set('sort', sort.key);
      params.set('dir', sort.dir === -1 ? 'desc' : 'asc');
    }
    if (category !== 'All') params.set('category', category);
    if (chain !== 'All chains') params.set('chain', chain);
    if (search) params.set('q', search);
    if (page > 1) params.set('page', String(page));
    const query = params.toString();
    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`,
    );
  }, [category, chain, page, search, sort, urlReady, view, viewParamExplicit]);
  useEffect(() => {
    const el = categoryRef.current;
    if (!el) return;
    const update = () =>
      setCategoryEdges({
        left: el.scrollLeft > 2,
        right: el.scrollLeft + el.clientWidth < el.scrollWidth - 2,
      });
    update();
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);
  useEffect(() => {
    if (!hotspotsVisible) return;
    const timer = window.setInterval(() => setHotspotIndex((i) => (i + 1) % 3), 4200);
    return () => window.clearInterval(timer);
  }, [hotspotsVisible]);
  useEffect(() => {
    if (!hotspotsVisible) return;
    const timer = window.setInterval(() => setHotspotRefresh((tick) => tick + 1), 30_000);
    return () => window.clearInterval(timer);
  }, [hotspotsVisible]);
  const hotspotCoins = (() => {
    void hotspotRefresh;
    const withLocalVotes = marketCoins.filter((coin) => !coin.promoted);
    const rankByVotes = (list: CoinListItem[]) =>
      [...list].sort((a, b) => b.votes - a.votes || a.rank - b.rank).slice(0, 5);

    return {
      recent: [...withLocalVotes].sort(sortByNewestLaunch).slice(0, 5),
      presales: rankByVotes(withLocalVotes.filter((coin) => coin.lifecycle === 'presale')),
      watched: rankByVotes([...withLocalVotes].sort((a, b) => b.watchCount - a.watchCount)),
    };
  })();
  const filtered = useMemo(() => {
    const list = marketCoins.filter(
      (c) =>
        !c.promoted &&
        (view === 'Launched coins' ? c.lifecycle === 'launched' : true) &&
        (view === 'Presales' ? c.lifecycle === 'presale' : true) &&
        (category === 'All' || c.category === category) &&
        (chain === 'All chains' || c.chain === chain) &&
        (!search ||
          `${c.name} ${c.symbol} ${c.chain}`.toLowerCase().includes(search.toLowerCase())),
    );
    if (view === 'Most watched')
      return [...list].sort((a, b) => b.watchCount - a.watchCount || b.trend - a.trend);
    if (view === 'Launched recently') return [...list].sort(sortByNewestLaunch);
    return [...list].sort((a, b) => {
      const av = sort.key === 'boost' ? a.boost || 0 : a[sort.key],
        bv = sort.key === 'boost' ? b.boost || 0 : b[sort.key];
      return (
        (typeof av === 'number' && typeof bv === 'number'
          ? av - bv
          : String(av).localeCompare(String(bv))) * sort.dir
      );
    });
  }, [category, chain, marketCoins, search, sort, view]);
  const rows = filtered
      .slice((page - 1) * 25, page * 25)
      .map((coin, index) => ({ ...coin, rank: (page - 1) * 25 + index + 1 })),
    pages = Math.max(1, Math.ceil(filtered.length / 25));
  const sortBy = (key: CoinSortKey) => {
    setSort((s) => ({
      key,
      dir: s.key === key ? (s.dir === 1 ? -1 : 1) : key === 'rank' ? 1 : -1,
    }));
    setPage(1);
  };
  const vote = async (coinId: number) => {
    if (voted.includes(coinId)) return;
    setInteractionNotice('');
    setVoted((current) => [...current, coinId]);
    setMarketCoins((coins) =>
      coins.map((coin) =>
        coin.coinId === coinId
          ? {
              ...coin,
              hasVoted: true,
              rawVotes: coin.rawVotes + 1,
              votes: coin.votes + getBoostVoteFactor(coin.boost),
              trend: coin.trend + getBoostVoteFactor(coin.boost),
            }
          : coin,
      ),
    );
    setAnimating(coinId);
    window.setTimeout(() => setAnimating(null), 700);

    const response = await fetch(`/api/coins/${coinId}/vote`, { method: 'POST' });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      setVoted((current) => current.filter((id) => id !== coinId));
      setMarketCoins((coins) =>
        coins.map((coin) =>
          coin.coinId === coinId
            ? {
                ...coin,
                hasVoted: false,
                rawVotes: Math.max(0, coin.rawVotes - 1),
                votes: Math.max(0, coin.votes - getBoostVoteFactor(coin.boost)),
                trend: Math.max(0, coin.trend - getBoostVoteFactor(coin.boost)),
              }
            : coin,
        ),
      );
      setInteractionNotice(body.message || 'Could not record your vote.');
      return;
    }

    const summary = body.data?.summary;
    if (summary) updateCoinInteractionSummary(coinId, summary);
  };
  const watch = async (coinId: number) => {
    const removing = watchlist.includes(coinId);
    setInteractionNotice('');
    setWatchlist((current) =>
      removing ? current.filter((id) => id !== coinId) : [...current, coinId],
    );
    setMarketCoins((coins) =>
      coins.map((coin) =>
        coin.coinId === coinId
          ? {
              ...coin,
              isWatching: !removing,
              watchCount: Math.max(0, coin.watchCount + (removing ? -1 : 1)),
            }
          : coin,
      ),
    );
    if (removing) setWatchAnimating(null);
    else {
      setWatchAnimating(coinId);
      window.setTimeout(() => setWatchAnimating(null), 600);
    }

    const response = await fetch(`/api/coins/${coinId}/watchlist`, { method: 'POST' });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      setWatchlist((current) =>
        removing ? [...current, coinId] : current.filter((id) => id !== coinId),
      );
      setMarketCoins((coins) =>
        coins.map((coin) =>
          coin.coinId === coinId
            ? {
                ...coin,
                isWatching: removing,
                watchCount: Math.max(0, coin.watchCount + (removing ? 1 : -1)),
              }
            : coin,
        ),
      );
      setInteractionNotice(body.message || 'Could not update your watchlist.');
      return;
    }

    const summary = body.data?.summary;
    if (summary) updateCoinInteractionSummary(coinId, summary);
  };

  function updateCoinInteractionSummary(
    coinId: number,
    summary: {
      weeklyVotes?: number;
      totalVotes?: number;
      watchlistCount?: number;
      userHasVoted?: boolean;
      userWatching?: boolean;
    },
  ) {
    setMarketCoins((coins) =>
      coins.map((coin) =>
        coin.coinId === coinId
          ? (() => {
              const rawVotes = summary.weeklyVotes ?? coin.rawVotes;
              const boostedVotes = rawVotes * getBoostVoteFactor(coin.boost);
              return {
                ...coin,
                rawVotes,
                votes: boostedVotes,
                trend: coin.trend - coin.votes + boostedVotes,
                watchCount: summary.watchlistCount ?? coin.watchCount,
                hasVoted: summary.userHasVoted ?? coin.hasVoted,
                isWatching: summary.userWatching ?? coin.isWatching,
              };
            })()
          : coin,
      ),
    );
    if (summary.userHasVoted === true)
      setVoted((current) => (current.includes(coinId) ? current : [...current, coinId]));
    if (summary.userHasVoted === false)
      setVoted((current) => current.filter((id) => id !== coinId));
    setWatchlist((current) => {
      if (summary.userWatching === true)
        return current.includes(coinId) ? current : [...current, coinId];
      if (summary.userWatching === false) return current.filter((id) => id !== coinId);
      return current;
    });
  }

  const handleHotspotSwipe = (x: number) => {
    const start = hotspotTouchStartRef.current;
    hotspotTouchStartRef.current = null;
    if (start === null) return;
    const delta = start - x;
    if (Math.abs(delta) < 42) return;
    setHotspotIndex((i) => (delta > 0 ? i + 1 : i + 2) % 3);
  };
  return (
    <main className={adVisible ? 'market-page with-bottom-ad' : 'market-page'}>
      <SiteHeader />
      <div className="container ad-grid">
        <Ad />
        <div className="desktop-only">
          <Ad />
        </div>
      </div>
      <section className="container hotspots-shell">
        <div className="hotspots-bar">
          <div>
            <b>Ranking hotspots</b>
            <span>Live discovery signals</span>
          </div>
          <button
            className={`hotspots-toggle ${hotspotsVisible ? 'on' : ''}`}
            onClick={() => setHotspotsVisible((v) => !v)}
            aria-pressed={hotspotsVisible}
          >
            <span />
            <b>{hotspotsVisible ? 'Shown' : 'Hidden'}</b>
          </button>
        </div>
        {hotspotsVisible && (
          <div
            className="hotspots-viewport"
            onPointerDown={(event) => {
              hotspotTouchStartRef.current = event.clientX;
            }}
            onPointerUp={(event) => {
              handleHotspotSwipe(event.clientX);
            }}
            onPointerCancel={() => {
              hotspotTouchStartRef.current = null;
            }}
          >
            <div
              className="discovery-grid"
              style={{ '--hotspot-slide': hotspotIndex } as CSSProperties}
            >
              <Discovery
                icon="new"
                title="Launched recently"
                sub="Fresh community listings"
                coins={hotspotCoins.recent}
                viewMoreHref="/?coins=recent#leaderboard"
                metric="added"
              />
              <Discovery
                icon="presale"
                title="Presales"
                sub="Upcoming and live launches"
                coins={hotspotCoins.presales}
                viewMoreHref="/?coins=presales#leaderboard"
              />
              <Discovery
                icon="watch"
                title="Most watched"
                sub="Saved to portfolios"
                coins={hotspotCoins.watched}
                viewMoreHref="/?coins=watched#leaderboard"
              />
            </div>
            <div className="hotspot-controls">
              <div className="hotspot-dots">
                {[0, 1, 2].map((i) => (
                  <button
                    key={i}
                    className={hotspotIndex === i ? 'active' : ''}
                    onClick={() => setHotspotIndex(i)}
                    aria-label={`Show hotspot ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </section>
      {interactionNotice && (
        <div className="container interaction-notice" role="status">
          {interactionNotice}
        </div>
      )}
      <section className="container promoted-section" id="promoted">
        <Title
          kicker="SPONSORED PLACEMENTS"
          title="Promoted coins"
          subtitle="Sponsored coins with active visibility packages. Promotion does not guarantee rank or endorsement."
        />
        <SimpleTable
          className="promoted-table"
          coins={marketCoins.filter((coin) => coin.promoted)}
          watchlist={watchlist}
          watchAnimating={watchAnimating}
          voted={voted}
          animating={animating}
          watch={watch}
          vote={vote}
          coinLinks={false}
        />
      </section>
      <div className="container wide-banner">
        <small>FULL-WIDTH ADVERTISEMENT</small>
        <div>
          <b>Reach crypto&apos;s earliest coin hunters.</b>
          <span>Premium inventory · Measured impressions and clicks</span>
        </div>
        <Link href="/advertise">View ad packages ↗</Link>
      </div>
      <section className="container leaderboard" id="leaderboard">
        <div className="section-title">
          <div>
            <small>LIVE RANKINGS</small>
            <h1>Community leaderboard</h1>
            <p className="section-subtitle">
              Ranked by this week&apos;s verified community votes. Rankings reset every Monday at
              00:00 UTC.
            </p>
          </div>
          <WeeklyResetChip />
        </div>
        <div className="leader-tabs">
          {(
            [
              'Most voted',
              'Launched coins',
              'Launched recently',
              'Presales',
              'Most watched',
            ] as LeaderboardView[]
          ).map((x) => (
            <button
              key={x}
              className={view === x ? 'selected' : ''}
              onClick={() => {
                setViewParamExplicit(true);
                setView(x);
                setPage(1);
              }}
            >
              {x}
            </button>
          ))}
        </div>
        <div className="filter-row">
          <label className="search-box">
            <Search aria-hidden="true" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search coin, symbol or chain"
            />
          </label>
          <div className="styled-select chain-select" ref={chainMenuRef}>
            <span>Chain</span>
            <button
              aria-expanded={chainMenuOpen}
              aria-haspopup="listbox"
              className="chain-select-trigger"
              type="button"
              onClick={() => setChainMenuOpen((open) => !open)}
            >
              {selectedChainChoice?.iconUrl && (
                <img
                  alt=""
                  aria-hidden="true"
                  height={17}
                  src={selectedChainChoice.iconUrl}
                  width={17}
                />
              )}
              <b>{chain}</b>
              <ChevronDown aria-hidden="true" />
            </button>
            {chainMenuOpen && (
              <div className="chain-select-menu" role="listbox" aria-label="Filter by chain">
                {coinChainChoices.map((choice) => (
                  <button
                    aria-selected={chain === choice.label}
                    className={chain === choice.label ? 'selected' : ''}
                    key={choice.label}
                    role="option"
                    type="button"
                    onClick={() => {
                      setChain(choice.label);
                      setPage(1);
                      setChainMenuOpen(false);
                    }}
                  >
                    {choice.iconUrl ? (
                      <img alt="" aria-hidden="true" height={17} src={choice.iconUrl} width={17} />
                    ) : (
                      <span>◎</span>
                    )}
                    <b>{choice.label}</b>
                    {chain === choice.label && <Check aria-hidden="true" />}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="category-strip">
            <div className="category-scroll" ref={categoryRef}>
              {coinCategories.map((x) => (
                <button
                  key={x}
                  className={category === x ? 'selected' : ''}
                  onClick={() => {
                    setCategory(x);
                    setPage(1);
                  }}
                >
                  {x}
                </button>
              ))}
            </div>
            {categoryEdges.left && (
              <button
                className="category-scroll-hint category-scroll-left"
                type="button"
                onClick={() => categoryRef.current?.scrollBy({ left: -240, behavior: 'smooth' })}
                aria-label="Scroll categories left"
              >
                <ChevronLeft aria-hidden="true" />
              </button>
            )}
            {categoryEdges.right && (
              <button
                className="category-scroll-hint category-scroll-right"
                type="button"
                onClick={() => categoryRef.current?.scrollBy({ left: 240, behavior: 'smooth' })}
                aria-label="Scroll categories right"
              >
                <ChevronRight aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
        <TableScroller>
          <table className="coins-table">
            <thead>
              <tr>
                <SH l="#" k="rank" s={sort} go={sortBy} />
                <SH l="Coin" k="name" s={sort} go={sortBy} />
                <SH l="Market cap" k="capN" s={sort} go={sortBy} />
                <SH l="Price" k="price" s={sort} go={sortBy} />
                <SH l="24h" k="change" s={sort} go={sortBy} />
                <SH l="Launch" k="launch" s={sort} go={sortBy} />
                <SH l="Boost" k="boost" s={sort} go={sortBy} />
                <SH l="Weekly votes" k="votes" s={sort} go={sortBy} />
                <SH l="Submitted" k="age" s={sort} go={sortBy} />
                <th>Watch</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => {
                const has = voted.includes(c.coinId);
                return (
                  <tr key={c.coinId} className={c.boost ? 'boosted-row' : ''}>
                    <Cells coin={c} />
                    <td>
                      <Watch
                        active={watchlist.includes(c.coinId)}
                        bursting={watchAnimating === c.coinId}
                        onClick={() => watch(c.coinId)}
                      />
                    </td>
                    <td>
                      <button
                        className={`vote-btn ${has ? 'voted' : ''} ${animating === c.coinId ? 'just-voted' : ''}`}
                        onClick={() => vote(c.coinId)}
                      >
                        <LineBurst />
                        <span className="vote-label">
                          {has ? (
                            <>
                              Voted <Check aria-hidden="true" />
                            </>
                          ) : (
                            'Vote +1'
                          )}
                        </span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableScroller>
        <div className="pagination">
          <span>
            Showing {(page - 1) * 25 + 1}–{Math.min(page * 25, filtered.length)} of{' '}
            {filtered.length}
          </span>
          <div>
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft aria-hidden="true" />
            </button>
            {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
              <button key={n} className={page === n ? 'active' : ''} onClick={() => setPage(n)}>
                {n}
              </button>
            ))}
            <button disabled={page === pages} onClick={() => setPage((p) => p + 1)}>
              <ChevronRight aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>
      <section className="info-band">
        <div className="container info-rows">
          <div>
            <small>WHAT WE DO</small>
            <b>Find early crypto projects before the crowd does.</b>
            <p>
              SpookyCoins gives coin hunters a cleaner way to discover fresh launches, live
              presales, and promoted projects competing for attention each week.
            </p>
            <ul>
              <li>Browse new launches and presales</li>
              <li>Vote for projects you believe in</li>
              <li>Save coins you want to follow</li>
            </ul>
          </div>
          <div>
            <small>HOW WE DO IT</small>
            <b>Community signals first, paid visibility clearly marked.</b>
            <p>
              Weekly votes, watchlist interest, and project freshness shape the discovery flow. Paid
              boosts and promoted placements are shown clearly, so attention stays easy to
              understand.
            </p>
            <ul>
              <li>Votes reset every week</li>
              <li>Boosts lift ranking visibility</li>
              <li>Promoted coins are labeled upfront</li>
            </ul>
          </div>
          <div>
            <small>BENEFITS</small>
            <b>More eyes for projects, faster scanning for hunters.</b>
            <p>
              Project teams can put their coin in front of early crypto audiences, while hunters get
              the context they need to compare opportunities quickly.
            </p>
            <ul>
              <li>Fast scanning on desktop and mobile</li>
              <li>Clear chain, price, and vote context</li>
              <li>Simple promotion paths for listed coins</li>
            </ul>
          </div>
        </div>
      </section>
      <SiteFooter id="footer" variant="home" />
      {adVisible && (
        <aside className="bottom-ad">
          <div className="container bottom-ad-inner">
            <small>AD SPACE</small>
            <b>SPOOKY</b>
            <div className="bottom-ad-copy">
              <span className="bottom-ad-copy-main">
                Reach crypto&apos;s earliest coin hunters.
              </span>
              <span>Premium inventory · Measured impressions and clicks</span>
            </div>
            <Link className="ad-cta" href="/advertise">
              View ad packages ↗
            </Link>
            <button className="ad-close" onClick={() => setAdVisible(false)}>
              <X aria-hidden="true" />
            </button>
          </div>
        </aside>
      )}
    </main>
  );
}

function sortByNewestLaunch(a: CoinListItem, b: CoinListItem) {
  return dateValue(b.launchTimestamp) - dateValue(a.launchTimestamp);
}

function dateValue(value: string | null | undefined) {
  const time = value ? new Date(value).getTime() : 0;
  return Number.isFinite(time) ? time : 0;
}
