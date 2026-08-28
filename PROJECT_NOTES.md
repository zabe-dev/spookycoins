# SpookyCoins — Product and Implementation Notes

Last updated: August 28, 2026

This is the project's single canonical notes file and source of truth. All future decisions, brainstorming, implementation status, and deferred work must be recorded here rather than in separate notes, todo, roadmap, or planning files. Superseded ideas are kept near the end so they are not accidentally reintroduced.

## Current focus

The current homepage prototype is approved. Further homepage expansion is paused while work moves to the next product phase. Before the real production deployment, refactor the homepage for long-term maintainability and add a proper About SpookyCoins section immediately after the rankings.

Working positioning:

> Discover crypto projects before everyone else.

## Product principles

- Keep discovery and voting fast and simple.
- Separate organic community signals, paid promotion, and trending signals.
- Never add purchased boosts to the displayed raw-vote total.
- Clearly label promoted projects and advertisements.
- Promotion is not an endorsement or a claim that a project is safe.
- Treat chain plus contract address as token identity; ticker symbols are display data only.
- Show factual KYC, audit, and risk information without using generic “Safe” claims.
- Never request wallet seed phrases or private keys.

## Implemented foundation

- [x] Standard Next.js application prepared for Vercel.
- [x] Node.js pinned to the Vercel-supported 22.x line and deployment lockfile repaired.
- [x] Server-only environment variables with a safe `.env.example`; local secrets are ignored.
- [x] Formatting, linting, TypeScript, production-build, and production-dependency checks pass.
- [x] Provider-neutral market-data architecture with server endpoints, caching, and bounded concurrent requests.
- [x] Public project records use numeric IDs starting at 1000.
- [x] Existing sensitive/internal tables—market-source records, project links, payments, submissions, and change requests—use UUIDs.
- [ ] Planned advertisement, report, campaign, creative, and other private records must also use UUIDs when added.
- [x] Canonical network, chart, DEX, boost, promoted-state, market, and community configuration exists.
- [x] Initial dataset contains exactly 100 token projects with IDs 1000–1099.
- [x] Dataset contains projects deployed on supported networks, not the networks’ native/base coins.
- [x] Obsolete fallback/dummy-data paths were removed; the canonical dataset is the local fallback source.
- [x] Exactly one promoted advertising placeholder exists: **Spooky · $SPOOKY · Solana**.

## Homepage — implemented

- [x] The current homepage direction and prototype were approved on August 28, 2026.

### Layout and navigation

- [x] Brand is **spookycoins**, lowercase, with a ghost logo and favicon.
- [x] Homepage content uses a 1320px maximum-width container.
- [x] Topbar, navbar, section backgrounds, borders, and fixed advertising can span the viewport.
- [x] Navbar order is Discover, Promoted, Partners, Advertise.
- [x] Navbar actions are Submit Coin and Sign In; light/dark mode was removed.
- [x] Mobile navbar includes a compact menu button with Discover, Promoted, Partners, Advertise, and Sign In.
- [x] Shared brand, topbar, navbar, site-header, table, action-button, advertising, and modal components exist.
- [x] Desktop and mobile layouts are responsive.

### Topbar

- [x] BTC, ETH, and BNB prices are loaded from a server endpoint.
- [x] Project, user, and total-vote figures are displayed as presentation values.
- [x] On mobile, topbar items run as a continuous marquee.
- [x] Users can hold to pause the mobile marquee or swipe it horizontally.

### Ranking hotspots

- [x] Ranking Hotspots contains Recently Added, Trending Now, and Most Watched.
- [x] Each hotspot displays five projects and uses custom SVG icons.
- [x] Each hotspot has a View More link to its matching leaderboard URL.
- [x] Hotspots can be hidden using the toggle.
- [x] Mobile automatically rotates the three cards.
- [x] Mobile hotspot cards are swipeable and use pagination dots without previous/next arrows.

### Promoted projects

- [x] Promoted Coins uses the same table structure and row controls as the community leaderboard.
- [x] Promoted Coins intentionally has no search, filters, or sortable headings.
- [x] The Spooky/Solana row is an advertising-layout example, not a real paid campaign.
- [x] The Spooky placeholder is not clickable and has no project-page destination.

### Community leaderboard

- [x] Views are Launched Coins, Trending, Most Watched, Presales, and Recently Added.
- [x] Search, supported-chain selection, and scrollable category filters are implemented.
- [x] Category arrows appear only when more content exists in that direction.
- [x] Table headings are clickable for ascending/descending sorting; there is no separate sort dropdown.
- [x] Leaderboard state is URL-backed: `coins`, sort column, sort direction, category, chain, search, and page.
- [x] Shared URLs restore the matching leaderboard state.
- [x] Anchor navigation uses smooth scrolling with section offsets.
- [x] Pagination displays 25 projects per page.
- [x] On mobile, Rank and Project remain fixed while remaining columns scroll horizontally.
- [x] Long project names truncate with ellipses while full names remain available to assistive technology and on hover.
- [x] Most Watched uses canonical watchlist counts, with trend score as a tie fallback.
- [x] The Presales tab currently shows a placeholder rather than the final separate table.

### Weekly reset display

- [x] The current ISO week is calculated dynamically.
- [x] Days and hours until the next Monday 00:00 UTC reset are calculated dynamically.
- [x] Mobile shows Week, countdown, and “until reset” in a compact three-part strip.

### Vote and watchlist interactions

- [x] Homepage vote and watchlist controls share reusable components.
- [x] Watchlist controls use an inline SVG star instead of text emoji.
- [x] Vote confirmation uses a centered short-line burst and bounce.
- [x] Watchlist confirmation animates only when adding a project, not when removing it.
- [x] Prototype state permits one vote per project during the browser session.
- [ ] Enforce the real rolling 12-hour voting rule on the server.
- [ ] Persist votes and watchlists to authenticated accounts.

### Boost presentation

- [x] Custom SVG lightning bolt replaces emoji.
- [x] Active boost tiers can display 10×, 30×, 50×, 100×, or 500× badges.
- [x] The 500× badge uses black text and a black bolt over a slow animated yellow/orange/gold gradient.
- [x] Only an active 500× project receives the animated orange-to-gold project-name treatment.
- [x] Reduced-motion preferences are respected.
- [ ] Boost purchasing, payments, activation, expiration, and ranking effects are not connected.

### Advertising UI

- [x] Two 90px header placements appear on desktop; one appears on mobile.
- [x] A full-width in-page banner is present.
- [x] A fixed full-width bottom overlay includes a close control.
- [x] Mobile bottom-ad copy and controls are compact and do not create horizontal overflow.
- [x] Current placeholder copy: “Reach crypto’s earliest project hunters. Premium inventory · Measured impressions and clicks.”
- [x] Current CTA: “View ad packages.”
- [ ] Campaign rotation, scheduling, creative delivery, dismissal persistence, impression tracking, and click tracking are not connected.

### Authentication UI

- [x] Reusable Log In / Sign Up modal is opened from the navbar.
- [x] Email and password fields are present.
- [x] Google and MetaMask options are present.
- [x] Modal supports responsive layout, backdrop close, Escape close, and page-scroll locking.
- [ ] Email authentication, Google OAuth, MetaMask signing, sessions, and account persistence are not connected.

## Single-project page — existing prototype

- [x] Routes and lookups use `/coin/[numeric-project-id]`; symbols never identify routes.
- [x] Canonical project data, logo, name, `$SYMBOL`, chain, category, and copyable contract address are displayed.
- [x] Price, change, market information, and historical chart data are loaded through server endpoints when available.
- [x] Chart and DEX actions use canonical configuration; TradingView is not used.
- [x] Vote and watchlist controls reuse homepage interaction components.
- [x] Share, Report, Buy/DEX, social links, advertising, and Request Change interfaces exist.
- [x] Request Change replaces the discarded public verified/claim badge.
- [ ] Project actions, reports, changes, ownership, and authentication are not persisted.
- [ ] Project-page refinement is paused while homepage work is the priority.

## Voting and weekly ranking — decided behavior

- Voting week is Monday 00:00 UTC through Sunday 23:59:59 UTC.
- Official weekly activity resets at the weekly boundary; lifetime totals remain separate.
- A user may vote for each project once in a rolling 12-hour window.
- Voting for one project does not prevent voting for another project.
- Weekly reset does not clear an existing user/project cooldown.
- Store weekly raw votes, lifetime votes, unique voters, and historical weekly results.
- Unranked projects should display `—` until they receive current-week activity.
- Raw organic weekly rank is weekly valid votes, then earliest time reaching the tied count, then unique verified voters.
- Archive weekly winners for history, analytics, and fraud review.
- Rate limiting, CAPTCHA, and suspicious-vote detection are required before public voting launches.

### Reset-day empty state — planned

- At reset, archive final rankings and reset weekly raw votes/ranking values without assigning artificial current-week ranks.
- Keep eligible zero-activity projects visible as Unranked.
- Add a Last Week’s Winners strip and a clear “New week started” message so the homepage does not appear empty.
- For display only, order zero-activity projects by last week’s final rank, then newest submission when no history exists.
- Do not label that fallback order as an official current-week rank.

## Trending — planned, not implemented

Trending is separate from official weekly rank.

- Recalculate approximately every five minutes over a rolling six-hour window.
- Compare activity with the preceding six hours and apply roughly a two-hour recency half-life.
- Candidate organic weights: vote velocity 45%, vote acceleration 25%, unique voter breadth 20%, meaningful engagement 10%.
- Proposed boost bonus: 10× +5, 30× +8, 50× +11, 100× +15, 500× +20.
- Require at least three valid recent votes from two unique voters for normal eligibility.
- Exclude suspended, rejected, fraud-flagged, or automated activity.
- Store score components for moderation and debugging.
- Current prototype trend values are simplified presentation data, not this production algorithm.

## Weekly boost packages — current commercial working decision

The old user-owned consumable booster concept is discarded. Boosts belong to a project and expire at the next weekly reset. Prices decrease as less time remains in the week.

Monday base prices:

| Tier | Base price |
| ---: | ---------: |
|  10× |        $39 |
|  30× |        $89 |
|  50× |       $149 |
| 100× |       $299 |
| 500× |       $799 |

Time-remaining schedule:

| Purchase day | Price percentage |
| ------------ | ---------------: |
| Monday       |             100% |
| Tuesday      |              85% |
| Wednesday    |              70% |
| Thursday     |              55% |
| Friday       |              40% |
| Saturday     |              30% |
| Sunday       |              22% |

Approximate Sunday minimums: 10× $9, 30× $19, 50× $35, 100× $69, 500× $179.

- Disclose that every package expires at the next reset regardless of purchase time.
- Treat pricing as introductory and revisit after real traffic, conversion, and advertiser-demand data exists.
- Boosts never increase the displayed raw-vote count.
- Only one active boost may apply to a project at a time.

### Unresolved boost-ranking rule

The brainstorm contains two incompatible proposals:

1. Boosted votes create additional weekly ranking points, with a separate Organic view based on raw votes.
2. Payment never affects official organic rank; boosts affect only trending visibility and clearly labeled promoted surfaces.

The homepage currently displays boost status but does not implement either ranking effect. Resolve this trust/product decision before implementing boost checkout or server-side ranking.

## Advertising and promoted inventory — planned business rules

### Placement decisions

- Header: two desktop slots, one mobile slot.
- Full-width in-page placement.
- Fixed bottom overlay.
- Project page: top, desktop sidebar, and inline placements; mobile replaces sidebar with inline.
- Support run-of-site, chain/category targeting, and specific-project targeting.
- Clearly label every placement as Advertisement or Sponsored.
- Rotate eligible creatives on page load; one eligible campaign displays continuously.
- Count an impression only after at least 50% visibility for one continuous second.
- Track impressions, unique reach, clicks, unique clicks, CTR, placement, device, creative version, and campaign dates.
- Treat the placement dimensions already rendered by the codebase as canonical creative sizes; add new dimensions only when a genuinely new placement is introduced.

### Introductory day rates

| Placement                                                       |            Rate |
| --------------------------------------------------------------- | --------------: |
| Header banner                                                   |         $25/day |
| Full-width in-page                                              |         $35/day |
| Bottom overlay                                                  |         $50/day |
| Project-page top: run-of-site / targeted / specific project     | $15 / $25 / $40 |
| Project-page sidebar: run-of-site / targeted / specific project | $10 / $15 / $25 |
| Project-page inline: run-of-site / targeted / specific project  | $10 / $15 / $20 |
| Promoted Coins table slot                                       |         $35/day |

Multi-day discounts: 1–2 days 0%, 3–6 days 10%, 7–13 days 20%, 14–29 days 30%, 30+ days 40%. Round effective day rates to the nearest dollar.

- Suggested Promoted Coins capacity is 5–10 slots.
- Purchasing a slot guarantees placement, not a specific position.
- Earliest selectable campaign start is tomorrow, never the current day.
- Human approval of creative and destination is mandatory before launch.
- Exact daily review cutoff time remains undecided.
- Advertiser self-service dashboard is deferred; initial campaign operations belong in the admin dashboard.

### Advertising policy

- Every creative and destination page requires human review before activation.
- Reject pornography/sexual content, illegal goods or services, phishing, malware, deceptive downloads, impersonation, fake giveaways, guaranteed-return claims, hate or harassment, and ads disguised as organic rankings or security badges.
- Reject undisclosed redirect chains or destination URLs that differ from the approved submission.
- Store a clear rejection reason and track repeated violations for possible advertiser-account blocking.
- If review misses a selected start date, handle the SLA failure manually through extension, rescheduling, or refund; never silently run an ad on dates the advertiser did not select.

## Project submission — planned

### Public project data

- Logo, name, symbol, description, category, and presale yes/no.
- Website, Telegram, X, Discord, YouTube, and whitepaper.
- Supported chain, contract address, UTC launch date/time, optional DEX pair, and optional market-provider ID.
- Categories: AI, DeFi, Fan Token, Gambling, Gaming, Memecoins, NFT Platform, Other, Play To Earn, Pump.fun Tokens, Utility Token.
- Networks: ETH, BSC, SOL, MATIC, AVAX, ARB, BASE, OP, DOGE, TRX, FTM, KCC, SUI, HOOD, XRPL, Other.

### Trust and private data

- KYC provider, certificate URL, completion/expiry date, and verification status.
- Audit provider, report URL, completion date, version/contract, and reported result.
- Contact email and Telegram are private administrative fields.
- Badges remain Pending until an administrator verifies the provider, project, date, and contract.

### Presale-specific data

- Platform/official URL, UTC start and end, accepted payment coins, soft cap, hard cap, price, contribution limits, and contract when deployed.
- Presales use a separate table and rank only against other presales.
- Status is derived from dates: Upcoming, Live, Ended, or TBA.
- Do not show market price, market cap, or 24h change when no public market exists.

### Automatic market, chart, and DEX resolution

- Use chain plus contract address as lookup input.
- Resolve market coverage, native historical chart data, and the most liquid legitimate pool at submission time.
- Store canonical chart and DEX configuration.
- If unavailable, display “Chart unavailable” and “Not trading yet.”
- TradingView symbols and widgets are not part of the current plan.

## Portfolio, reports, and sharing — planned

- Keep Watchlist and Portfolio separate.
- Portfolio is private by default and begins with manual holdings entry.
- Portfolio may store quantity, optional average price, purchase currency, date added, and a private note.
- Never request wallet secrets; later wallet support should be read-only address tracking.
- Signed-in users can report scam/rug concerns, fake projects, bad contracts, honeypots, misleading data, fake KYC/audits, impersonation, phishing, spam/duplicates, or other issues.
- Reports require evidence, rate limits, private reporter identity, and human moderation.
- Do not remove projects automatically based only on report volume.
- Sharing should support copy link, X, Telegram, Facebook, WhatsApp, and the native share sheet.
- Track aggregate share/referral channels without exposing individual activity publicly.

Report moderation states are New, Under Review, Action Taken, Rejected, and Resolved. Possible reviewed actions include correcting data, adding a factual warning, freezing boosts, suspending voting, hiding a listing, or delisting it while preserving historical records. Reporter identities remain private.

## Market data and identifiers

- Product-facing architecture and naming remain provider-neutral so upstream services can be replaced.
- Market API keys stay server-side and are never exposed to browsers.
- Batch leaderboard requests and use bounded concurrency.
- Cache active market data and refresh it approximately every 5–15 minutes; refresh inactive metadata less frequently.
- Serve visitors from cached/server data rather than calling an upstream API per page view.
- Current market coverage may be supplemented later for newly launched tokens without primary-provider coverage.
- Public project URLs use short numeric IDs; canonical token identity remains network plus contract address.
- Never use ticker symbols as route identifiers.

## Admin and advertiser tools

### Admin dashboard — required MVP infrastructure, not implemented

- Protected admin authentication with Super Admin and Moderator roles.
- Audit log for every administrative action.
- User management, suspension, abuse investigation, and support-only cooldown reset.
- Project CRUD/delisting without deleting historical records.
- Submission, KYC/audit, report, advertisement, and campaign approval queues.
- Campaign management, analytics, Promoted Coins capacity, and fraud detail.
- Ability to grant logged promotional comps without mixing them into paid revenue.
- Dashboard summary for pending work, campaigns, boosts, projects, users, votes, and recent actions.

### Advertiser dashboard — deliberately deferred

- Eventually expose only each advertiser’s own aggregate campaign analytics.
- Reuse the impression/click/creative data model built for the admin dashboard.
- Historical analytics are view-only; creative changes create auditable revisions.
- Until real volume exists, campaigns are managed manually through admin tools.

## Current prototype boundaries

- Votes, watchlists, authentication, reports, project changes, campaign actions, and payments are not persistent.
- Initial watchlist counts are placeholder values, so Most Watched uses trend as a tie fallback.
- Topbar project/user/total-vote totals are presentation values.
- The Spooky promoted row is placeholder inventory, not a paid campaign.
- Market prices, images, and available historical data are fetched and cached through server endpoints.
- Current upstream market integration is replaceable and must remain generically named inside product-facing code and copy.
- Commercial licensing must be confirmed before meaningful monetized production use.

## Next implementation work

Deferred homepage work required before production deployment:

- [ ] Refactor the approved homepage into smaller, maintainable sections and components without changing its current design direction.
- [ ] Add a proper About SpookyCoins section immediately after the rankings, explaining project discovery, weekly community voting, promotion transparency, and the platform's safety/risk position.
- [ ] Complete final production responsive, accessibility, copy, and content review.

Next product decisions:

- [ ] Decide the unresolved boost-ranking rule.
- [ ] Define real weekly ranking and trending server contracts before persistence.

Platform implementation:

- [ ] Provision the production database and apply migrations.
- [ ] Implement authentication, sessions, Google OAuth, and MetaMask signing.
- [ ] Persist votes, rolling 12-hour cooldowns, weekly archives, watchlists, and portfolios.
- [ ] Build project submission, ownership/claim, and request-change workflows.
- [ ] Build the separate presale dataset and leaderboard.
- [ ] Implement reports, moderation, anti-bot controls, and the admin dashboard.
- [ ] Implement boost checkout, payments, activation, expiration, and analytics.
- [ ] Implement advertising campaigns, approval, rotation, scheduling, impressions, clicks, and CTR.

## Superseded decisions

- **VYRAL**, **TokenPulse**, and other brainstorm names are replaced by **spookycoins**.
- The old marketing-hero homepage is replaced by the market-first homepage.
- Light/dark mode was removed.
- Most Voted homepage view was replaced by Most Watched.
- User-owned consumable boosters and booster-count ranking were discarded.
- The older 12/24-hour five-pack boost pricing proposal is superseded by week-until-reset packages and time-remaining pricing.
- The old electric-surge 500× badge is replaced by the slower animated gold-gradient badge with black content.
- The proposed `/coin/[chain]/[contract]` and symbol routes are replaced by `/coin/[numeric-project-id]`.
- Public verified/claimed badges were discarded; Request Change remains. Ownership claims may return later as an authenticated workflow.
- TradingView chart integration was discarded in favor of provider-neutral native historical charts and canonical DEX links.
- The original hard-coded CoinGecko product terminology was replaced by provider-neutral naming. The current adapter can be replaced without changing the product model or UI copy.
- A modal/sidebar is not the primary project detail experience; the dedicated project page remains primary.

## Open decisions

- Final resolution of boost effects on main ranking versus organic-only ranking.
- Exact production market-data licensing/provider plan.
- Authentication implementation and account-verification requirements.
- Payment provider and accepted fiat/crypto methods.
- Exact advertising review cutoff time and initial Promoted Coins slot cap.
- Project-verification requirements and public warning presentation.
- Supported-network subset for the first public launch.
- How much of the existing project-page prototype to keep when that phase resumes.
