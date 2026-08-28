'use client';
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import {
  BannerAd as Ad,
  CoinCells as Cells,
  CoinTable as SimpleTable,
  DiscoveryCard as Discovery,
  InfoRow as Info,
  LineBurst,
  SectionTitle as Title,
  SortHeader as SH,
  TableScroller,
  WatchButton as Watch,
} from '@/features/coins/components';
import { Brand } from '@/components/brand';
import { SiteHeader } from '@/components/layout/site-header';
import { WeeklyResetChip } from '@/components/leaderboard/weekly-reset-chip';
import { initialCoinListItems } from '@/features/coins/data/initial-dataset';
import {
  coinCategories,
  coinChainOptions,
  type CoinListItem,
  type CoinSortKey,
} from '@/features/coins/view';
import './market.css';
import './scroll-fix.css';
/* Market data and reusable UI live in dedicated modules; this page owns orchestration state. */

type LeaderboardView =
  'Launched coins' | 'Trending' | 'Most watched' | 'Presales' | 'Recently added';

const viewParams: Record<LeaderboardView, string> = {
  'Launched coins': 'launched',
  Trending: 'trending',
  'Most watched': 'watched',
  Presales: 'presales',
  'Recently added': 'recent',
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

export default function Home() {
  const [marketCoins, setMarketCoins] = useState<CoinListItem[]>(initialCoinListItems);
  const [view, setView] = useState<LeaderboardView>('Launched coins'),
    [category, setCategory] = useState('All'),
    [chain, setChain] = useState('All chains'),
    [search, setSearch] = useState('');
  const [sort, setSort] = useState<{ key: CoinSortKey; dir: 1 | -1 }>({
      key: 'rank',
      dir: 1,
    }),
    [page, setPage] = useState(1),
    [voted, setVoted] = useState<string[]>([]),
    [animating, setAnimating] = useState<string | null>(null),
    [watchlist, setWatchlist] = useState<string[]>([]),
    [watchAnimating, setWatchAnimating] = useState<string | null>(null),
    [adVisible, setAdVisible] = useState(true),
    [urlReady, setUrlReady] = useState(false);
  const categoryRef = useRef<HTMLDivElement>(null);
  const hotspotTouchStartRef = useRef<number | null>(null);
  const [categoryEdges, setCategoryEdges] = useState({ left: false, right: true });
  const [hotspotsVisible, setHotspotsVisible] = useState(true),
    [hotspotIndex, setHotspotIndex] = useState(0);
  useEffect(() => {
    const applyUrlState = () => {
      const params = new URLSearchParams(window.location.search);
      const nextView = paramsToView[params.get('coins') || params.get('view') || ''];
      const nextSort = params.get('sort') as CoinSortKey | null;
      const nextCategory = params.get('category');
      const nextChain = params.get('chain');
      if (nextView) setView(nextView);
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
    if (view !== 'Launched coins') params.set('coins', viewParams[view]);
    if (sort.key !== 'rank' || sort.dir !== 1) {
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
  }, [category, chain, page, search, sort, urlReady, view]);
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/market/coins?limit=100', { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('Market data unavailable');
        return response.json() as Promise<{ data: CoinListItem[] }>;
      })
      .then(({ data }) => {
        if (data.length) setMarketCoins(data);
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          console.warn(error);
        }
      });
    return () => controller.abort();
  }, []);
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
  const filtered = useMemo(() => {
    const list = marketCoins.filter(
      (c) =>
        !c.promoted &&
        (category === 'All' || c.category === category) &&
        (chain === 'All chains' || c.chain === chain) &&
        (!search ||
          `${c.name} ${c.symbol} ${c.chain}`.toLowerCase().includes(search.toLowerCase())),
    );
    if (view === 'Trending') return [...list].sort((a, b) => b.trend - a.trend);
    if (view === 'Most watched')
      return [...list].sort(
        (a, b) =>
          b.watchCount +
            Number(watchlist.includes(b.symbol)) -
            (a.watchCount + Number(watchlist.includes(a.symbol))) || b.trend - a.trend,
      );
    if (view === 'Recently added')
      return [...list].sort((a, b) => parseInt(a.age) - parseInt(b.age));
    return [...list].sort((a, b) => {
      const av = sort.key === 'boost' ? a.boost || 0 : a[sort.key],
        bv = sort.key === 'boost' ? b.boost || 0 : b[sort.key];
      return (
        (typeof av === 'number' && typeof bv === 'number'
          ? av - bv
          : String(av).localeCompare(String(bv))) * sort.dir
      );
    });
  }, [category, chain, marketCoins, search, sort, view, watchlist]);
  const rows = filtered.slice((page - 1) * 25, page * 25),
    pages = Math.max(1, Math.ceil(filtered.length / 25));
  const sortBy = (key: CoinSortKey) => {
    setSort((s) => ({
      key,
      dir: s.key === key ? (s.dir === 1 ? -1 : 1) : key === 'rank' ? 1 : -1,
    }));
    setPage(1);
  };
  const vote = (s: string) => {
    if (voted.includes(s)) return;
    setVoted((v) => [...v, s]);
    setAnimating(s);
    window.setTimeout(() => setAnimating(null), 700);
  };
  const watch = (s: string) => {
    const removing = watchlist.includes(s);
    setWatchlist((w) => (removing ? w.filter((x) => x !== s) : [...w, s]));
    if (removing) setWatchAnimating(null);
    else {
      setWatchAnimating(s);
      window.setTimeout(() => setWatchAnimating(null), 600);
    }
  };
  const handleHotspotSwipe = (x: number) => {
    const start = hotspotTouchStartRef.current;
    hotspotTouchStartRef.current = null;
    if (start === null) return;
    const delta = start - x;
    if (Math.abs(delta) < 42) return;
    setHotspotIndex((i) => (delta > 0 ? i + 1 : i + 2) % 3);
  };
  return (
    <main className="market-page">
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
                title="Recently added"
                sub="Fresh community listings"
                coins={marketCoins
                  .filter((coin) => !coin.promoted)
                  .slice(-5)
                  .reverse()}
                viewMoreHref="/?coins=recent#leaderboard"
              />
              <Discovery
                icon="trend"
                title="Trending now"
                sub="Fastest-rising signals"
                coins={marketCoins
                  .filter((coin) => !coin.promoted)
                  .sort((a, b) => b.trend - a.trend)
                  .slice(0, 5)}
                viewMoreHref="/?coins=trending#leaderboard"
              />
              <Discovery
                icon="watch"
                title="Most watched"
                sub="Saved to portfolios"
                coins={marketCoins
                  .filter((coin) => !coin.promoted)
                  .sort((a, b) => b.watchCount - a.watchCount || b.trend - a.trend)
                  .slice(0, 5)}
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
      <section className="container promoted-section" id="promoted">
        <Title
          kicker="SPONSORED PLACEMENTS"
          title="Promoted coins"
          subtitle="Sponsored coins with active visibility packages. Promotion does not guarantee rank or endorsement."
          action="View ad packages ↗"
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
        <button>View ad packages ↗</button>
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
              'Launched coins',
              'Trending',
              'Most watched',
              'Presales',
              'Recently added',
            ] as LeaderboardView[]
          ).map((x) => (
            <button
              key={x}
              className={view === x ? 'selected' : ''}
              onClick={() => {
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
            <span>⌕</span>
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search coin, symbol or chain"
            />
          </label>
          <label className="styled-select">
            <span>Chain</span>
            <select
              value={chain}
              onChange={(e) => {
                setChain(e.target.value);
                setPage(1);
              }}
            >
              {coinChainOptions.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
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
                <svg viewBox="0 0 20 20">
                  <path d="m13 4-6 6 6 6" />
                </svg>
              </button>
            )}
            {categoryEdges.right && (
              <button
                className="category-scroll-hint category-scroll-right"
                type="button"
                onClick={() => categoryRef.current?.scrollBy({ left: 240, behavior: 'smooth' })}
                aria-label="Scroll categories right"
              >
                <svg viewBox="0 0 20 20">
                  <path d="m7 4 6 6-6 6" />
                </svg>
              </button>
            )}
          </div>
        </div>
        {view === 'Presales' ? (
          <div className="presale-placeholder">
            <b>Presale leaderboard</b>
            <span>
              Live and upcoming coins use status, countdown, caps and verification columns.
            </span>
          </div>
        ) : (
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
                  const has = voted.includes(c.symbol);
                  return (
                    <tr key={c.symbol} className={c.boost ? 'boosted-row' : ''}>
                      <Cells coin={c} />
                      <td>
                        <Watch
                          active={watchlist.includes(c.symbol)}
                          bursting={watchAnimating === c.symbol}
                          onClick={() => watch(c.symbol)}
                        />
                      </td>
                      <td>
                        <button
                          className={`vote-btn ${has ? 'voted' : ''} ${animating === c.symbol ? 'just-voted' : ''}`}
                          onClick={() => vote(c.symbol)}
                        >
                          <LineBurst />
                          <span className="vote-label">{has ? 'Voted ✓' : 'Vote +1'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableScroller>
        )}
        {view !== 'Presales' && (
          <div className="pagination">
            <span>
              Showing {(page - 1) * 25 + 1}–{Math.min(page * 25, filtered.length)} of{' '}
              {filtered.length}
            </span>
            <div>
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                ←
              </button>
              {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                <button key={n} className={page === n ? 'active' : ''} onClick={() => setPage(n)}>
                  {n}
                </button>
              ))}
              <button disabled={page === pages} onClick={() => setPage((p) => p + 1)}>
                →
              </button>
            </div>
          </div>
        )}
      </section>
      <section className="info-band">
        <div className="container info-rows">
          <Info
            title="Weekly rankings"
            text="Leaderboards reset every Monday at 00:00 UTC while lifetime totals remain."
          />
          <Info
            title="Transparent promotion"
            text="Paid placements and boosts are clearly labeled for understandable discovery."
          />
          <Info
            title="Built for discovery"
            text="Market data, community signals and coin information in one focused interface."
          />
        </div>
      </section>
      <footer className="container footer" id="footer">
        <Brand />
        <p>Community-powered crypto discovery.</p>
        <div>
          <a href="#">Methodology</a>
          <a href="#">Advertise</a>
          <a href="#">Terms</a>
        </div>
      </footer>
      {adVisible && (
        <aside className="bottom-ad">
          <div className="container bottom-ad-inner">
            <small>AD SPACE</small>
            <b>YOURCOIN</b>
            <div className="bottom-ad-copy">
              <strong className="bottom-ad-copy-desktop">
                Reach crypto&apos;s earliest coin hunters.
              </strong>
              <strong className="bottom-ad-copy-mobile">Reach early crypto hunters.</strong>
              <span>Premium inventory · Measured impressions and clicks</span>
            </div>
            <button className="ad-cta">
              <span className="ad-cta-desktop">View ad packages ↗</span>
              <span className="ad-cta-mobile">Ad packages ↗</span>
            </button>
            <button className="ad-close" onClick={() => setAdVisible(false)}>
              ×
            </button>
          </div>
        </aside>
      )}
    </main>
  );
}
