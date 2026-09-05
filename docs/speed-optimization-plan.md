# SpookyCoins Speed Optimization Plan

## Current setup

- Hosting: Coolify on VPS
- Assets: Cloudflare R2
- Database: PostgreSQL
- Market data: Mobula API
- Frontend: Next.js

## Main goal

Keep expensive work out of user-facing page requests. Pages should read ready or cached data, not wait for third-party API calls or heavy database calculations.

## Priority stages

### 1. Remove slow work from page requests

- Do not run Mobula sync during normal page loads.
- Market sync should run only through cron or background jobs.
- Homepage, coin pages, dashboard, and watchlist pages should read existing database snapshots.
- Missing market data should display safe fallback values.

### 2. Add Redis with safe fallback

Use Redis for:

- Rate limits
- Topbar prices and stats
- Banner ads
- Homepage tables
- Ranking hotspots
- Coin page market snapshots
- Public watchlist tables

If Redis fails, the site should safely fall back to database reads.

### 3. Cache high-traffic data

Suggested cache timing:

- Topbar prices: 30–60 seconds
- Topbar stats: 60 seconds
- Banner ads: 2–5 minutes
- Homepage rankings: 30–60 seconds
- Ranking hotspots: 30–60 seconds
- Promoted coin IDs: 60 seconds
- Homepage discovery hydration: batch shared coin IDs once per request
- Coin page market snapshot: 1–5 minutes
- Public watchlist: 30–60 seconds

### 4. Improve database performance

Add or confirm indexes for:

- Coin status
- Presale status
- Launch date
- Presale end date
- Votes by coin/date
- Watchlists by coin/user
- Active boosts
- Active promotions
- Active banner ads
- Submission status/type

If vote/watchlist counts become expensive, add stored counters on coins:

- Total votes
- Weekly votes
- Watchlist count
- Trending score if needed

### 5. Optimize R2 images

- Store logos and ad creatives in R2.
- Use long cache headers.
- Lazy-load images when possible.
- Keep table logos fixed size.
- Avoid loading oversized images in tables.

### 6. Lazy-load heavy UI

Lazy-load:

- Chart embeds
- Auth modal
- Admin modals
- Submission cropper
- Confetti
- Admin tab content

Charts should not block the first page render.

### 7. Improve admin dashboard loading

- Load summary first.
- Load only active tab data.
- Fetch other tabs when clicked.
- Paginate admin tables server-side.

### 8. Mobula sync strategy

For 10k coins per day:

- Use controlled queue processing.
- Prioritize promoted/boosted coins first.
- Then homepage-visible coins.
- Then watched coins.
- Then stale long-tail coins.
- Skip known invalid contract addresses unless address or chain changes.
- Store failure reasons to avoid wasting API calls.

At 1 request per second, the theoretical max is 86,400 requests per day. A safer production target is around 40k–70k per day. Updating 10k coins per day is realistic.

## Recommended first implementation

1. Add Redis helper with safe database fallback.
2. Cache topbar, banner ads, homepage tables, and hotspots.
3. Make sure no market sync runs during page requests.
