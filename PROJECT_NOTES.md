# SpookyCoins — Product and Implementation Notes

Last updated: August 29, 2026

This is the project's single canonical notes file and source of truth. All future decisions, brainstorming, implementation status, and deferred work must be recorded here rather than in separate notes, todo, roadmap, or planning files. Superseded ideas are kept near the end so they are not accidentally reintroduced.

## Current focus

The current homepage prototype is approved. Further homepage expansion is paused while work moves to the next product phase. Before the real production deployment, refactor the homepage for long-term maintainability and add a proper About SpookyCoins section immediately after the rankings.

Working positioning:

> Discover crypto projects before everyone else.

## Agreed technology stack

| Area           | Technology                                                           |
| -------------- | -------------------------------------------------------------------- |
| Framework      | Next.js + TypeScript                                                 |
| Authentication | Better Auth — email/password, email OTP, Google, app-owned roles     |
| Database       | Neon (Postgres) + Drizzle ORM                                        |
| Validation     | Zod                                                                  |
| File storage   | Cloudflare R2                                                        |
| Email delivery | Resend                                                               |
| Payments       | Coinbase Commerce or NOWPayments; final provider is not yet selected |

Better Auth is responsible for identity and sessions using SpookyCoins-owned database tables. SpookyCoins keeps application data—such as user profiles, votes, watchlists, project claims, submissions, promoted placements, boosts, and payments—in its own database. Sensitive records such as payments and submissions use UUIDs. MetaMask and Coinbase Wallet auth were removed from the current product decision.

## Product principles

- Keep discovery and voting fast and simple.
- Separate organic community signals, paid promotion, and trending signals.
- Never add purchased boosts to the displayed raw-vote total.
- Clearly label promoted projects and paid boost/placement surfaces.
- Promotion is not an endorsement or a claim that a project is safe.
- Treat chain plus contract address as token identity; ticker symbols are display data only.
- Show factual KYC, audit, and risk information without using generic “Safe” claims.
- Never request wallet seed phrases or private keys.

## Implemented foundation

- [x] Standard Next.js application prepared for Vercel.
- [x] Node.js pinned to the Vercel-supported 22.x line and deployment lockfile repaired.
- [x] Server-only environment variables with a safe `.env.example`; local secrets are ignored.
- [x] Formatting, linting, TypeScript, production-build, and production-dependency checks pass.
- [x] Previous live market-data endpoints, provider adapter, generated dataset, and client fetches were removed from the prototype.
- [x] Public project records use numeric IDs starting at 1000.
- [x] Existing sensitive/internal tables—market-source records, project links, payments, submissions, and change requests—use UUIDs.
- [ ] Planned report, order, payment, boost, promoted-placement, and other private records must also use UUIDs when added.
- [x] Canonical network, chart, DEX, boost, promoted-state, market, and community configuration exists.
- [x] Mock data is now the prototype source of truth and later submissions will sit on top of the mock data.
- [x] Mock data contains token projects deployed on supported networks, not the networks’ native/base coins.
- [x] Mock data includes both launched projects and presale projects.
- [x] Exactly one promoted placement placeholder exists: **Spooky · $SPKY · Solana** with a 500× boost.
- [x] Database migrations were reset to a fresh baseline because no existing production data needs to be preserved.
- [x] Old project-to-coin rename migrations, obsolete mappings, and abandoned database history were removed.
- [x] The current baseline migration creates only the active schema: coins, auth tables, market metadata/snapshots, links, change requests, submissions, and payments.

## Homepage — implemented

- [x] The current homepage direction and prototype were approved on August 28, 2026.

### Layout and navigation

- [x] Brand is **spookycoins**, lowercase, with a ghost logo and favicon.
- [x] Homepage content uses a 1320px maximum-width container.
- [x] Topbar, navbar, section backgrounds, borders, and fixed placeholder surfaces can span the viewport.
- [x] Navbar order is Discover, Promoted, Partners, Advertise.
- [x] Navbar actions are Submit Coin and Sign In; light/dark mode was removed.
- [x] Mobile navbar uses a combined dropdown for site links and account actions instead of separate menus.
- [x] Shared brand, topbar, navbar, site-header, table, action-button, placeholder-surface, and modal components exist.
- [x] Desktop and mobile layouts are responsive.
- [x] Supported chain icons are stored locally and used for table chain badges.

### Topbar

- [x] BTC, ETH, and BNB prices use plain mock values in the current prototype.
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
- [x] The Spooky/Solana row is a promoted-placement layout example, not a real paid order.
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
- [x] The Presales tab currently shows presale mock projects using the shared table structure.
- [ ] Build the final presale-specific table columns for status, starts/ends, soft cap, hard cap, and accepted payments.

### Weekly reset display

- [x] The current ISO week is calculated dynamically.
- [x] Days and hours until the next Monday 00:00 UTC reset are calculated dynamically.
- [x] Mobile shows Week, countdown, and “until reset” in a compact three-part strip.

### Vote and watchlist interactions

- [x] Homepage vote and watchlist controls share reusable components.
- [x] Watchlist controls use an inline SVG star instead of text emoji.
- [x] Vote confirmation uses a centered short-line burst and bounce.
- [x] Watchlist confirmation animates only when adding a project, not when removing it.
- [x] Vote and watchlist click animations were sped up so the feedback feels more natural.
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

### Placeholder surfaces

- [x] Two 90px header placements appear on desktop; one appears on mobile.
- [x] A full-width in-page banner is present.
- [x] A fixed full-width bottom overlay includes a close control.
- [x] Mobile bottom-ad copy and controls are compact and do not create horizontal overflow.
- [x] Current placeholder copy: “Reach crypto’s earliest project hunters. Premium inventory · Measured impressions and clicks.”
- [x] Current CTA text exists in placeholder UI, but should be reconsidered because banner ad spaces are no longer a sellable MVP product.
- [ ] These placeholder surfaces are not sellable MVP inventory and should be removed or repurposed before production unless the business decision changes.

### Authentication UI

- [x] Reusable Log In / Sign Up modal is opened from the navbar.
- [x] Email/password and Google auth options are present.
- [x] MetaMask and Coinbase Wallet options were intentionally removed.
- [x] Modal supports responsive layout, backdrop close, Escape close, and page-scroll locking.
- [x] Better Auth server instance, API route, Drizzle adapter, email/password flow, email OTP plugin, Google OAuth trigger, signed-in navbar state, and admin plugin are wired.
- [x] Signup currently uses direct Better Auth email/password account creation without a signup OTP step.
- [x] Password reset by email code is available from the custom auth modal.
- [x] Password reset uses the OTP only during the final password update so the code is not consumed before password validation.
- [x] Signed-in navbar state uses a two-letter generated email avatar and a dropdown with Watchlist, Orders, Settings, and Logout.
- [x] Desktop signed-in navigation uses an account-style dropdown with Watchlist, Orders, Settings, and a red Logout action with a matching red icon.
- [x] Mobile navigation combines site links and account actions in one dropdown with user identity and item icons.
- [x] Logout sends the user to the homepage with a full page reload.
- [x] Simple protected signed-user and admin-only test pages exist with loading/skeleton states.
- [x] Auth feedback is handled inside the modal with styled inline messages, loading states, and sanitized descriptive copy that avoids sensitive/debug details.
- [x] Global toast notifications were removed from the prototype.
- [x] Clerk middleware was removed during the Better Auth migration to avoid hosted organization/setup redirects.
- [x] RBAC now uses app-owned user roles through Better Auth's admin plugin instead of Clerk Organizations.
- [x] Password recovery uses six-digit OTP codes.
- [x] Signup OTP verification was intentionally removed from the current MVP flow to avoid account/session confusion during testing.
- [x] Better Auth account schema includes the required `issuer` column for credential/social account lookup.
- [x] Production email delivery for password-reset codes is wired through Resend.
- [x] Auth emails use short plain text with “XXXXXX is your verification code” subjects and include request IP/location/time when available.
- [x] Local/dev email OTP delivery falls back to logging the code to the server console when Resend is not configured.
- [ ] Production RBAC still needs final admin seeding, denial UI, and database-backed audit controls.
- [ ] Account persistence, database user sync, production admin roles, and protected persistent user actions are not connected.

## Single-project page — existing prototype

- [x] Routes and lookups use `/coin/[numeric-project-id]`; symbols never identify routes.
- [x] Canonical project data, logo, name, `$SYMBOL`, chain, category, and copyable contract address are displayed.
- [x] Price, change, market information, and chart visuals use local mock project data for the current prototype.
- [x] Chart and DEX actions use canonical configuration; TradingView is not used.
- [x] Vote and watchlist controls reuse homepage interaction components.
- [x] Share, Report, Buy/DEX, social links, paid-placement surfaces, and Request Change interfaces exist.
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

## Promoted Coins pricing — current commercial decision

For now, SpookyCoins only sells Promoted Coin placements and Boosts. No banner ad spaces are sold in the MVP.

Promoted Coins base price is **$30/day**.

| Duration  | Discount    | Effective price |
| --------- | ----------- | --------------: |
| 1–2 days  | No discount |         $30/day |
| 3–6 days  | 20% off     |         $24/day |
| 7–13 days | 30% off     |         $21/day |
| 14+ days  | 40% off     |         $18/day |

Example: 7 days = $210 before discount, 30% off, **$147 total**.

Promoted Coin placements can be automated after checkout if eligibility checks pass: the project must already exist on SpookyCoins, must not be suspended, must not be rejected/flagged, and the requested date/slot must be available. Purchasing a placement guarantees the approved promoted surface and dates, not safety endorsement.

## Boost packages — current commercial decision

The old user-owned consumable booster concept is discarded. Boosts belong to a project and run for their purchased active period from activation.

Boost pricing:

| Package | Price | Vote multiplier | Duration | Extra         |
| ------: | ----: | --------------: | -------: | ------------- |
|     10× |   $39 |              ×2 | 24 hours | —             |
|     30× |   $89 |              ×2 |   3 days | —             |
|     50× |  $149 |              ×3 | 24 hours | —             |
|    100× |  $299 |              ×3 |   3 days | —             |
|    500× |  $799 |              ×5 |   7 days | Golden Ticker |

- Boosts shoot a project up the rankings for a paid period by multiplying its displayed/ranking vote value.
- The multiplier stays the same for the purchased boost duration.
- Price does not decay based on purchase day; a boost always costs the package price and runs for the purchased duration regardless of when it starts.
- Example: 1,000 raw votes with a ×5 multiplier displays as 5,000 boosted/displayed votes while the boost is active.
- Treat pricing as introductory and revisit after real traffic, conversion, and advertiser-demand data exists.
- Boosts never change stored raw-vote counts.
- Only one active boost may apply to a project at a time.
- Boosts do not stack; if a project already has an active boost, additional boosts for that project are disabled until the current boost expires.
- The 500× tier includes Golden Ticker styling: animated orange/gold project-name treatment and premium 500× badge styling while active.
- Boost checkout can be automated if eligibility checks pass: the project must already exist on SpookyCoins, must not be suspended, must not be rejected/flagged, and must not already have an active boost.

## Review and activation — current commercial decision

- Daily review cutoff is **6:00 PM**.
- Requests submitted before 6:00 PM are reviewed for possible activation at **12:00 AM**, giving up to a six-hour review window.
- Requests submitted after 6:00 PM are not guaranteed to be reviewed or activated by 12:00 AM and may move to the next activation cycle.
- Promoted Coin placements and Boosts should move toward automated payment, eligibility checks, scheduling, activation, expiration, and receipt generation.
- Banner ad placements are paused, not operational, and not available for self-serve purchase.
- Future banner ad placements require manual review and direct scheduling through Telegram before they become operational.

### Unresolved boost-ranking rule

The brainstorm contains two incompatible proposals:

1. Boosted votes create additional weekly ranking points, with a separate Organic view based on raw votes.
2. Payment never affects official organic rank; boosts affect only trending visibility and clearly labeled promoted surfaces.

The homepage currently displays boost status but does not implement either ranking effect. Resolve this trust/product decision before implementing boost checkout or server-side ranking.

## Commercial policy — planned

- Every paid Promoted Coin placement, Boost, creative, and destination page requires human review before activation.
- Reject pornography/sexual content, illegal goods or services, phishing, malware, deceptive downloads, impersonation, fake giveaways, guaranteed-return claims, hate or harassment, and ads disguised as organic rankings or security badges.
- Reject undisclosed redirect chains or destination URLs that differ from the approved submission.
- Store a clear rejection reason and track repeated violations for possible buyer/account blocking.
- If review misses a selected start date, handle the SLA failure manually through extension, rescheduling, or refund; never silently run a paid placement on dates the buyer did not select.

### Promotion automation brainstorm — planned

- [ ] Require a project to be already submitted/listed on SpookyCoins before buying a Boost or Promoted Coin slot.
- [ ] Block checkout for suspended, rejected, fraud-flagged, hidden, or under-review projects.
- [ ] For Boosts, block checkout while the project has an active boost because boosts do not stack.
- [ ] For Promoted Coin slots, show an availability calendar or duration picker before payment.
- [ ] Calculate Promoted Coin discounts automatically based on selected duration.
- [ ] Create an order with pending payment status before redirecting to the payment provider.
- [ ] Activate automatically after confirmed payment only if the project still passes eligibility checks.
- [ ] If eligibility changes after payment but before activation, move the order to manual review/refund handling.
- [ ] Generate a PDF receipt after payment confirmation.
- [ ] Keep an admin override for refunds, comps, extensions, forced expiration, and abuse response.
- [ ] Keep banner ads out of the automated checkout until the banner product is intentionally reopened.

## Project submission — planned

- [x] A signed-in-only `/submit` route now exists with a multi-step prototype form.
- [x] The submit form uses Zod validation and covers Basics, Chain & Links, Trust & Contact, conditional Presale details, and Review.
- [x] Navbar “Submit coin” now routes to the submit form.
- [ ] Submission persistence is not implemented yet; current form submission only confirms a structured draft in the browser.

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
- If live enrichment returns later, serve visitors from cached/server data rather than calling an upstream API per page view.
- Current market coverage may be supplemented later for newly launched tokens without primary-provider coverage.
- Public project URLs use short numeric IDs; canonical token identity remains network plus contract address.
- Never use ticker symbols as route identifiers.

## Admin tools

### Admin dashboard — required MVP infrastructure, not implemented

- Protected admin authentication with Super Admin and Moderator roles.
- Audit log for every administrative action.
- User management, suspension, abuse investigation, and support-only cooldown reset.
- Project CRUD/delisting without deleting historical records.
- Simple workflow: Requests → Review → Approve/Reject → Scheduled → Live → Expired.
- Submission, KYC/audit, report, Promoted Coin placement, and Boost approval queues.
- Live clock and daily cutoff indicator.
- Promoted Coin pricing calculator with automatic duration discounts.
- Boost management, including one-active-boost enforcement and expiry.
- Payment/order details, placement dates, rejection reasons, status tracking, and fraud detail.
- PDF receipt generation.
- Ability to grant logged promotional comps without mixing them into paid revenue.
- Dashboard summary for pending work, promoted placements, boosts, projects, users, votes, and recent actions.

### Buyer dashboard — deliberately deferred

- Eventually expose each buyer’s own orders, statuses, receipts, active placements, and boost history.
- Until real volume exists, paid placement and boost operations are managed manually through admin tools.

## Current prototype boundaries

- Votes, watchlists, reports, project changes, paid placement actions, boost actions, and payments are not persistent.
- Authentication sessions now use Better Auth and the database, with Resend wired for production OTP email delivery; final RBAC hardening is still pending.
- Initial watchlist counts are placeholder values, so Most Watched uses trend as a tie fallback.
- Topbar project/user/total-vote totals are presentation values.
- The Spooky promoted row is placeholder inventory, not a paid order.
- Market prices, images, and available historical data currently use local mock data.
- There is no live upstream market integration in the current prototype.
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
- [ ] Start production database from the fresh baseline migration; do not apply the old discarded migration chain.
- [x] Implement Better Auth app shell, sessions, direct email/password signup, password reset, Google OAuth trigger, signed-in dropdown, admin-role field, and test protected pages.
- [ ] Complete database user sync and protected persistent actions.
- [ ] Finalize production RBAC/admin authorization with first-admin setup, denial UI, and audit logging.
- [ ] Persist votes, rolling 12-hour cooldowns, weekly archives, watchlists, and portfolios.
- [ ] Build project submission, ownership/claim, and request-change workflows.
- [ ] Build the production presale dataset, server-backed leaderboard, and presale-specific table.
- [ ] Implement reports, moderation, anti-bot controls, and the admin dashboard.
- [ ] Implement Promoted Coin checkout, payments, approval, scheduling, activation, expiration, and PDF receipts.
- [ ] Implement boost checkout, payments, approval, activation, expiration, one-active-boost enforcement, and PDF receipts.
- [ ] Keep banner ad placements paused and non-operational until there is a deliberate product decision to reopen them.

Advertise page planned for the next session:

- [ ] Create `/advertise` as a polished education/sales page for current promotion products.
- [ ] Explain that the MVP sells only Promoted Coin slots and Boosts.
- [ ] Clearly state that banner ad placements are visible as prototype placeholders but are not available for purchase yet.
- [ ] Include Promoted Coin slot pricing, boost package pricing, Golden Ticker details, review/activation flow, and manual approval disclaimers.
- [ ] Direct banner ad inquiries to contact **SpookyCoinsSupport** on Telegram because banner placements are paused and manually handled only.
- [ ] Explain that Boosts and Promoted Coin slots are intended to become automated self-serve products once checkout and eligibility checks are built.
- [ ] Update navbar Advertise link to `/advertise`.

## Superseded decisions

- **VYRAL**, **TokenPulse**, and other brainstorm names are replaced by **spookycoins**.
- The old marketing-hero homepage is replaced by the market-first homepage.
- Light/dark mode was removed.
- Most Voted homepage view was replaced by Most Watched.
- User-owned consumable boosters and booster-count ranking were discarded.
- The fixed seven-day boost package proposal is superseded by varied boost durations: 24 hours, 3 days, and 7 days.
- Clerk authentication was replaced by Better Auth so SpookyCoins owns auth tables, session checks, and roles.
- MetaMask and Coinbase Wallet authentication were removed from the current auth decision; keep email/password and Google only for now.
- Global toast notifications were removed; keep auth and form feedback inline until a better notification pattern is chosen.
- Banner ad spaces are no longer part of the MVP commercial plan; the MVP sells only Promoted Coins and Boosts.
- The old electric-surge 500× badge is replaced by the slower animated gold-gradient badge with black content.
- The proposed `/coin/[chain]/[contract]` and symbol routes are replaced by `/coin/[numeric-project-id]`.
- Public verified/claimed badges were discarded; Request Change remains. Ownership claims may return later as an authenticated workflow.
- TradingView chart integration was discarded for now; project pages currently use mock native chart visuals and canonical DEX links.
- The original hard-coded CoinGecko product terminology was replaced by provider-neutral naming, and the current prototype has no live market-data adapter.
- A modal/sidebar is not the primary project detail experience; the dedicated project page remains primary.

## Open decisions

- Final resolution of boost effects on main ranking versus organic-only ranking.
- Exact production market-data licensing/provider plan and whether/when to reintroduce live enrichment.
- Production email sender/provider hardening for password-reset OTPs.
- Payment provider and accepted fiat/crypto methods.
- Initial Promoted Coins slot cap.
- Project-verification requirements and public warning presentation.
- Supported-network subset for the first public launch.
- How much of the existing project-page prototype to keep when that phase resumes.
