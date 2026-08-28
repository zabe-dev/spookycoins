# SpookyCoins Project Notes

Last updated: August 28, 2026

## Current implementation status

- [x] **Canonical data model** — Public projects use numeric IDs starting at 1000. Network, chart, DEX, boost, and promoted-state configuration are part of the canonical project model. Sensitive and transactional records such as payments, submissions, and change requests retain UUID identifiers.
- [x] **Initial dataset** — The prototype contains 100 token projects with IDs 1000–1099. Projects belong to supported base-chain networks; native/base coins themselves are excluded. Population/submission dates are set, and exactly one dummy project is promoted.
- [x] **Legacy data cleanup** — The obsolete fallback and duplicate dummy-data paths were removed. The homepage and project pages now read from the canonical dataset and provider-neutral market layer.
- [x] **Single project page** — Project routes and lookups use numeric project IDs, never symbols. The page uses canonical project data, `$SYMBOL` styling, historical charts when available, and configured chart/DEX links.
- [x] **Vercel preparation** — The app uses the standard Next.js production setup, numeric dynamic routing, server-only environment variables, a safe environment template, and Vercel configuration. Type checking, linting, production compilation, and the production dependency audit pass.

## Homepage implementation status

- [x] **Shared layout** — Reusable topbar, navbar, brand, market-table, action-button, advertising, and authentication-modal components are established.
- [x] **Responsive page structure** — Full-width topbar/navbar backgrounds use a centered 1320px content container. Desktop and mobile advertising placements, ranking hotspots, promoted projects, the community leaderboard, information rows, footer, and fixed bottom ad are laid out.
- [x] **Ranking hotspots** — Recently Added, Trending Now, and Most Watched each show five projects. Mobile uses an automatic carousel with previous/next controls positioned below the cards, pagination dots, and a show/hide toggle.
- [x] **Hotspot deep links** — Each hotspot includes a View More link that opens its corresponding leaderboard view.
- [x] **URL-backed leaderboard state** — Leaderboard view, column sorting, sort direction, category, chain, search, and pagination are represented in query parameters and restore correctly from shared URLs.
- [x] **Leaderboard controls** — Search, supported-chain filtering, horizontally scrollable categories with edge-aware arrows, sortable headings, and 25-project pagination are implemented.
- [x] **Most Watched view** — The former Most Voted view is now Most Watched and uses the canonical watchlist count, with trending score as a fallback when counts tie.
- [x] **Weekly reset display** — The current ISO week and remaining days/hours are calculated dynamically. Rankings reset every Monday at 00:00 UTC, and mobile uses a compact three-part reset strip.
- [x] **Promoted-table example** — Exactly one advertising placeholder appears as **Spooky · $SPOOKY · Solana**. It demonstrates the promoted table and intentionally does not link to a project page.
- [x] **Boost presentation** — The 500x badge uses black text and a black bolt over a gently animated yellow/orange/gold gradient. Only 500x projects receive the animated gold-gradient project name.
- [x] **Long-name handling** — Long project names truncate cleanly in tables, hotspot cards, and project headings while preserving the full name as accessible/hover text.
- [x] **Vote and watch interactions** — Shared vote and watchlist controls use centered line-burst feedback. Adding to a watchlist animates; removing it does not.
- [x] **Mobile market marquee** — Mobile topbar data rolls continuously, supports horizontal swiping, and pauses while held.
- [x] **Authentication prototype** — A reusable login/sign-up modal includes email/password fields plus Google and MetaMask options, responsive styling, Escape dismissal, and backdrop dismissal.
- [x] **Mobile fixed ad** — The bottom advertising bar uses shorter mobile copy and compact controls without horizontal overflow.

## Agreed product decisions

- Current product focus is completing and polishing the homepage before implementing deeper site functionality.
- Brand: **spookycoins**, styled in lowercase with a ghost logo.
- Homepage content uses a maximum width of 1320px while navbar, topbar, and section backgrounds can span the viewport.
- Users may vote once for each project every 12 hours.
- Community rankings reset weekly; the interface shows the week and time remaining until reset.
- Homepage discovery state must be shareable through URLs, including views, sorting, filters, search, and pagination.
- Public project URLs use stable numeric IDs. Symbols are display data and are not identifiers.
- Projects are tokens deployed on supported networks, not the native/base network coins.
- Promoted projects appear in a dedicated table. The current Spooky/Solana entry is a non-clickable advertising example rather than a real project listing.
- The community leaderboard remains independently filterable and sortable, and the discovery tabs are Launched Coins, Trending, Most Watched, Presales, and Recently Added.
- A 500x boost receives a black-content animated gold-gradient badge and animated gold/orange project name.
- Market data is accessed through a provider-neutral server layer so the upstream source can be replaced without changing the UI or project model.
- Project pages include vote, watchlist, share, report, contract copy, chart/DEX actions, social links, ads, and a request-change section.
- Desktop supports two header ad placements; mobile shows one. Standard full-width placements are 90px high, with a separate fixed bottom placement.
- Ad inventory is intended to record impressions and clicks for advertisers.

## Current prototype boundaries

- Market prices, images, and available historical chart data are fetched and cached through server endpoints.
- Votes and watchlist interactions are currently prototype UI state rather than durable user records.
- Canonical watchlist counts exist in the project model, but the initial placeholder dataset does not yet contain real user watchlist activity.
- The login/sign-up, Google, and MetaMask controls are UI prototypes only; authentication, OAuth, wallet signing, sessions, and account persistence are not connected.
- Project, user, and total-vote figures in the topbar are currently presentation values; live asset tickers are fetched separately.
- The request-change flow is present in the UI but still needs persistent submission handling and review tooling.
- Spooky in the promoted table is placeholder advertising inventory, not a paid campaign or navigable project page.

## Next implementation work

- [ ] Provision the production database and apply the included schema/migrations.
- [ ] Persist votes with the per-project 12-hour rule and weekly ranking snapshots.
- [ ] Persist user watchlists and portfolios.
- [ ] Connect email/password authentication, Google OAuth, MetaMask wallet signing, sessions, and account persistence.
- [ ] Add project ownership and claim workflows after authentication is connected.
- [ ] Persist project submissions and change requests using UUID records.
- [ ] Implement boost purchases, payment records, scheduling, and expiry.
- [ ] Implement advertiser campaign management plus impression and click analytics.
- [ ] Complete the separate presale dataset and table behavior.
