# SpookyCoins Project Notes

Last updated: August 27, 2026

## Current implementation status

- [x] **Canonical data model** — Public projects use numeric IDs starting at 1000. Network, chart, DEX, boost, and promoted-state configuration are part of the canonical project model. Sensitive and transactional records such as payments, submissions, and change requests retain UUID identifiers.
- [x] **Initial dataset** — The prototype contains 100 token projects with IDs 1000–1099. Projects belong to supported base-chain networks; native/base coins themselves are excluded. Population/submission dates are set, and exactly one dummy project is promoted.
- [x] **Legacy data cleanup** — The obsolete fallback and duplicate dummy-data paths were removed. The homepage and project pages now read from the canonical dataset and provider-neutral market layer.
- [x] **Single project page** — Project routes and lookups use numeric project IDs, never symbols. The page uses canonical project data, `$SYMBOL` styling, historical charts when available, and configured chart/DEX links.
- [x] **Vercel preparation** — The app uses the standard Next.js production setup, numeric dynamic routing, server-only environment variables, a safe environment template, and Vercel configuration. Type checking, linting, production compilation, and the production dependency audit pass.

## Agreed product decisions

- Brand: **spookycoins**, styled in lowercase with a ghost logo.
- Homepage content uses a maximum width of 1320px while navbar, topbar, and section backgrounds can span the viewport.
- Users may vote once for each project every 12 hours.
- Community rankings reset weekly; the interface shows the week and time remaining until reset.
- Public project URLs use stable numeric IDs. Symbols are display data and are not identifiers.
- Projects are tokens deployed on supported networks, not the native/base network coins.
- Promoted projects appear in a dedicated table. The community leaderboard remains independently filterable and sortable.
- A 500x boost receives the special animated badge and gold/orange gradient project name.
- Market data is accessed through a provider-neutral server layer so the upstream source can be replaced without changing the UI or project model.
- Project pages include vote, watchlist, share, report, contract copy, chart/DEX actions, social links, ads, and a request-change section.
- Desktop supports two header ad placements; mobile shows one. Standard full-width placements are 90px high, with a separate fixed bottom placement.
- Ad inventory is intended to record impressions and clicks for advertisers.

## Current prototype boundaries

- Market prices, images, and available historical chart data are fetched and cached through server endpoints.
- Votes and watchlist interactions are currently prototype UI state rather than durable user records.
- The request-change flow is present in the UI but still needs persistent submission handling and review tooling.
- The initial promoted project is placeholder inventory, not a paid campaign.

## Next implementation work

- [ ] Provision the production database and apply the included schema/migrations.
- [ ] Persist votes with the per-project 12-hour rule and weekly ranking snapshots.
- [ ] Persist user watchlists and portfolios.
- [ ] Add authentication and project ownership/claim workflows.
- [ ] Persist project submissions and change requests using UUID records.
- [ ] Implement boost purchases, payment records, scheduling, and expiry.
- [ ] Implement advertiser campaign management plus impression and click analytics.
- [ ] Complete the separate presale dataset and table behavior.
