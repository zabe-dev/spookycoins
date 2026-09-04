'use client';
/* eslint-disable @next/next/no-img-element -- Chain dropdown needs a remote Iconify SVG for Other alongside local icon files. */
import { SiteFooter } from '@/components/layout/site-footer';
import { InfoBand } from '@/components/layout/info-band';
import { SiteFaq } from '@/components/layout/site-faq';
import { WideAdBanner } from '@/features/ads/components/ad-banners';
import type { BannerAdMap } from '@/features/ads/types';
import { AuthModal } from '@/features/auth/components/auth-modal';
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
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
/* Market data and reusable UI live in dedicated modules; this page owns orchestration state. */

type LeaderboardView =
  'Top coins' | 'Trending coins' | 'Presale coins' | 'Most watched' | 'Launched recently';

const viewParams: Record<LeaderboardView, string> = {
  'Top coins': 'top',
  'Trending coins': 'trending',
  'Presale coins': 'presales',
  'Most watched': 'watched',
  'Launched recently': 'recent',
};
const paramsToView = Object.fromEntries(
  Object.entries(viewParams).map(([label, value]) => [value, label]),
) as Record<string, LeaderboardView>;
paramsToView['most-voted'] = 'Top coins';
paramsToView.presale = 'Presale coins';
paramsToView.presales = 'Presale coins';
paramsToView.launched = 'Launched recently';
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
const defaultSort: { key: CoinSortKey; dir: 1 | -1 } = { key: 'votes', dir: -1 };

export function HomeClient({
  initialCoins,
  isSignedIn,
  bannerAds,
}: {
  initialCoins: CoinListItem[];
  isSignedIn: boolean;
  bannerAds: BannerAdMap;
}) {
  const [marketCoins, setMarketCoins] = useState<CoinListItem[]>(initialCoins);
  const [view, setView] = useState<LeaderboardView>('Top coins'),
    [category, setCategory] = useState('All'),
    [chain, setChain] = useState('All chains'),
    [search, setSearch] = useState('');
  const [sort, setSort] = useState<{ key: CoinSortKey; dir: 1 | -1 }>({
      ...defaultSort,
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
    [authOpen, setAuthOpen] = useState(false),
    [hotspotRefresh, setHotspotRefresh] = useState(0),
    [viewParamExplicit, setViewParamExplicit] = useState(false),
    [urlReady, setUrlReady] = useState(false);
  const categoryRef = useRef<HTMLDivElement>(null);
  const chainMenuRef = useRef<HTMLDivElement>(null);
  const hotspotTouchStartRef = useRef<number | null>(null);
  const [categoryEdges, setCategoryEdges] = useState({ left: false, right: true });
  const [chainMenuOpen, setChainMenuOpen] = useState(false);
  const selectedChainChoice = coinChainChoices.find((choice) => choice.label === chain);
  const router = useRouter();
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
      setView(nextView || 'Top coins');
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
    if (viewParamExplicit || view !== 'Top coins') {
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
    const timer = window.setInterval(() => setHotspotIndex((i) => (i + 1) % 4), 4200);
    return () => window.clearInterval(timer);
  }, [hotspotsVisible]);
  useEffect(() => {
    if (!hotspotsVisible) return;
    const timer = window.setInterval(() => setHotspotRefresh((tick) => tick + 1), 30_000);
    return () => window.clearInterval(timer);
  }, [hotspotsVisible]);
  const hotspotCoins = (() => {
    void hotspotRefresh;

    return {
      recent: [...marketCoins]
        .filter(isLaunchedRecentlyCandidate)
        .sort(sortByNewestLaunch)
        .slice(0, 4),
      trending: [...marketCoins]
        .filter((coin) => coin.trendingScore > 0)
        .sort(sortByTrendingScore)
        .slice(0, 4),
      presales: [...marketCoins]
        .filter((coin) => coin.lifecycle === 'presale')
        .sort(sortByPresaleEnd)
        .slice(0, 4),
      watched: [...marketCoins].sort(sortByWatchCount).slice(0, 4),
    };
  })();
  const filtered = useMemo(() => {
    const list = marketCoins.filter(
      (c) =>
        (view === 'Presale coins' ? c.lifecycle === 'presale' : true) &&
        (category === 'All' || c.category === category) &&
        (chain === 'All chains' || c.chain === chain) &&
        (!search ||
          `${c.name} ${c.symbol} ${c.chain}`.toLowerCase().includes(search.toLowerCase())),
    );
    if (view === 'Trending coins')
      return [...list].filter((coin) => coin.trendingScore > 0).sort(sortByTrendingScore);
    if (view === 'Most watched')
      return [...list].filter((coin) => coin.watchCount > 0).sort(sortByWatchCount);
    if (view === 'Launched recently')
      return [...list].filter(isLaunchedRecentlyCandidate).sort(sortByNewestLaunch);
    if (view === 'Presale coins') return [...list].sort(sortByPresaleEnd);
    return [...list].sort(sortByVotes);
  }, [category, chain, marketCoins, search, view]);
  const displayedCoins = useMemo(
    () => (isDefaultSort(sort) ? filtered : [...filtered].sort((a, b) => sortCoins(a, b, sort))),
    [filtered, sort],
  );
  const rows = displayedCoins
      .slice((page - 1) * 25, page * 25)
      .map((coin, index) => ({ ...coin, rank: (page - 1) * 25 + index + 1 })),
    pages = Math.max(1, Math.ceil(displayedCoins.length / 25));
  const sortBy = (key: CoinSortKey) => {
    setSort((s) => ({
      key,
      dir: s.key === key ? (s.dir === 1 ? -1 : 1) : key === 'rank' ? 1 : -1,
    }));
    setPage(1);
  };
  const vote = async (coinId: number) => {
    if (voted.includes(coinId)) return;
    if (!isSignedIn) {
      setAuthOpen(true);
      return;
    }
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
              totalVotes: coin.totalVotes + 1,
              recentVotes: coin.recentVotes + 1,
              trendingScore: coin.trendingScore + 3,
              trend: coin.trend + 3,
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
                totalVotes: Math.max(0, coin.totalVotes - 1),
                recentVotes: Math.max(0, coin.recentVotes - 1),
                trendingScore: Math.max(0, coin.trendingScore - 3),
                trend: Math.max(0, coin.trend - 3),
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
    if (!isSignedIn) {
      setAuthOpen(true);
      return;
    }
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
              recentWatchlistAdds: Math.max(0, coin.recentWatchlistAdds + (removing ? -1 : 1)),
              trendingScore: Math.max(0, coin.trendingScore + (removing ? -2 : 2)),
              trend: Math.max(0, coin.trend + (removing ? -2 : 2)),
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
                recentWatchlistAdds: Math.max(0, coin.recentWatchlistAdds + (removing ? 1 : -1)),
                trendingScore: Math.max(0, coin.trendingScore + (removing ? 2 : -2)),
                trend: Math.max(0, coin.trend + (removing ? 2 : -2)),
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
      recentVotes?: number;
      recentWatchlistAdds?: number;
      trendingScore?: number;
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
                totalVotes: summary.totalVotes ?? coin.totalVotes,
                recentVotes: summary.recentVotes ?? coin.recentVotes,
                recentWatchlistAdds: summary.recentWatchlistAdds ?? coin.recentWatchlistAdds,
                trendingScore: summary.trendingScore ?? coin.trendingScore,
                trend: summary.trendingScore ?? coin.trend,
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
    setHotspotIndex((i) => (delta > 0 ? i + 1 : i + 3) % 4);
  };
  return (
    <main className={adVisible ? 'market-page with-bottom-ad' : 'market-page'}>
      <div className="container ad-grid">
        <Ad ads={bannerAds.premium} />
        <div className="desktop-only">
          <Ad ads={bannerAds.premium} offset={1} />
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
                sub="Newest coins in the market."
                coins={hotspotCoins.recent}
                viewMoreHref="/?coins=recent#leaderboard"
                metric="launch"
              />
              <Discovery
                icon="trend"
                title="Trending coins"
                sub="Getting attention today."
                coins={hotspotCoins.trending}
                viewMoreHref="/?coins=trending#leaderboard"
                metric="trend"
              />
              <Discovery
                icon="presale"
                title="Presale coins"
                sub="Ending soon, moving fast."
                coins={hotspotCoins.presales}
                viewMoreHref="/?coins=presales#leaderboard"
                metric="presaleEnd"
              />
              <Discovery
                icon="watch"
                title="Most watched"
                sub="Most saved by hunters."
                coins={hotspotCoins.watched}
                viewMoreHref="/?coins=watched#leaderboard"
                metric="watchlist"
              />
            </div>
            <div className="hotspot-controls">
              <div className="hotspot-dots">
                {[0, 1, 2, 3].map((i) => (
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
          coins={rankCoins(marketCoins.filter((coin) => coin.promoted).sort(sortByVotes))}
          watchlist={watchlist}
          watchAnimating={watchAnimating}
          voted={voted}
          animating={animating}
          watch={watch}
          vote={vote}
          coinLinks={false}
        />
      </section>
      <WideAdBanner ads={bannerAds.wide} />
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
              'Top coins',
              'Trending coins',
              'Presale coins',
              'Most watched',
              'Launched recently',
            ] as LeaderboardView[]
          ).map((x) => (
            <button
              key={x}
              className={view === x ? 'selected' : ''}
              onClick={() => {
                setViewParamExplicit(true);
                setView(x);
                setSort(defaultSort);
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
                  <tr
                    key={c.coinId}
                    className={`${c.boost ? 'boosted-row' : ''} clickable-coin-row`}
                    onClick={(event) => {
                      const target = event.target as HTMLElement;
                      if (target.closest('a, button')) return;
                      router.push(`/coin/${c.coinId}`);
                    }}
                  >
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
            Showing {(page - 1) * 25 + 1}–{Math.min(page * 25, displayedCoins.length)} of{' '}
            {displayedCoins.length}
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
      <WideAdBanner ads={bannerAds.wide} offset={1} />
      <SiteFaq />
      <InfoBand />
      <SiteFooter id="footer" variant="home" />
      {adVisible && (
        <BottomAd onClose={() => setAdVisible(false)} />
      )}
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </main>
  );
}

function BottomAd({
  ad,
  onClose,
}: {
  ad?: BannerAdMap['wide'][number];
  onClose: () => void;
}) {
  if (ad) {
    return (
      <aside className="bottom-ad bottom-ad-image">
        <div className="container bottom-ad-inner">
          <Link className="bottom-ad-creative" href={ad.targetUrl} target="_blank">
            <span className="ad-creative-badge">Ad</span>
            <picture>
              {ad.mobileImageUrl && (
                <source media="(max-width: 620px)" srcSet={ad.mobileImageUrl} />
              )}
              <img src={ad.desktopImageUrl} alt={ad.title} />
            </picture>
            <span>
              <b>{ad.title}</b>
              {ad.subtitle && <em>{ad.subtitle}</em>}
            </span>
          </Link>
          <button className="ad-close" onClick={onClose} aria-label="Close ad">
            <X aria-hidden="true" />
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="bottom-ad">
      <div className="container bottom-ad-inner">
        <small>AD SPACE</small>
        <b>SPOOKY</b>
        <div className="bottom-ad-copy">
          <span className="bottom-ad-copy-main">Reach crypto&apos;s earliest coin hunters.</span>
          <span>Premium inventory · Measured impressions and clicks</span>
        </div>
        <Link className="ad-cta" href="/advertise">
          View ad packages ↗
        </Link>
        <button className="ad-close" onClick={onClose} aria-label="Close ad">
          <X aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
}

function sortByNewestLaunch(a: CoinListItem, b: CoinListItem) {
  return dateValue(b.launchTimestamp) - dateValue(a.launchTimestamp);
}

function isLaunchedRecentlyCandidate(coin: CoinListItem) {
  const launchTime = dateValue(coin.launchTimestamp);
  return coin.lifecycle === 'launched' && launchTime > 0 && launchTime <= Date.now();
}

function sortByPresaleEnd(a: CoinListItem, b: CoinListItem) {
  const aDate = futureDateValue(a.presaleEndTimestamp);
  const bDate = futureDateValue(b.presaleEndTimestamp);
  return aDate - bDate || b.votes - a.votes || a.name.localeCompare(b.name);
}

function sortByWatchCount(a: CoinListItem, b: CoinListItem) {
  return b.watchCount - a.watchCount || b.votes - a.votes || a.name.localeCompare(b.name);
}

function sortByTrendingScore(a: CoinListItem, b: CoinListItem) {
  return b.trendingScore - a.trendingScore || b.votes - a.votes || a.name.localeCompare(b.name);
}

function sortByVotes(a: CoinListItem, b: CoinListItem) {
  return b.votes - a.votes || a.name.localeCompare(b.name);
}

function isDefaultSort(sort: { key: CoinSortKey; dir: 1 | -1 }) {
  return sort.key === defaultSort.key && sort.dir === defaultSort.dir;
}

function sortCoins(a: CoinListItem, b: CoinListItem, sort: { key: CoinSortKey; dir: 1 | -1 }) {
  const direction = sort.dir;
  let result = 0;

  if (sort.key === 'name') result = a.name.localeCompare(b.name);
  else if (sort.key === 'capN') result = a.capN - b.capN;
  else if (sort.key === 'price') result = moneyValue(a.price) - moneyValue(b.price);
  else if (sort.key === 'change') result = a.change - b.change;
  else if (sort.key === 'launch')
    result = dateValue(a.launchTimestamp) - dateValue(b.launchTimestamp);
  else if (sort.key === 'boost') result = (a.boost || 0) - (b.boost || 0);
  else if (sort.key === 'votes') result = a.votes - b.votes;
  else if (sort.key === 'age')
    result = dateValue(a.submittedTimestamp) - dateValue(b.submittedTimestamp);
  else result = a.rank - b.rank;

  return result * direction || a.name.localeCompare(b.name);
}

function rankCoins(coins: CoinListItem[]) {
  return coins.map((coin, index) => ({ ...coin, rank: index + 1 }));
}

function moneyValue(value: string) {
  if (value === '—') return 0;
  const normalized = value.replace(/[$,]/g, '').trim().toUpperCase();
  const multiplier = normalized.endsWith('T')
    ? 1_000_000_000_000
    : normalized.endsWith('B')
      ? 1_000_000_000
      : normalized.endsWith('M')
        ? 1_000_000
        : normalized.endsWith('K')
          ? 1_000
          : 1;
  return Number.parseFloat(normalized) * multiplier || 0;
}

function futureDateValue(value: string | null | undefined) {
  const time = dateValue(value);
  if (!time || time < Date.now()) return Number.MAX_SAFE_INTEGER;
  return time;
}

function dateValue(value: string | null | undefined) {
  const time = value ? new Date(value).getTime() : 0;
  return Number.isFinite(time) ? time : 0;
}
