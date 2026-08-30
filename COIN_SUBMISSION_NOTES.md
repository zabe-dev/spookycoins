# SpookyCoins — Coin Submission Notes

Last updated: August 30, 2026

## Goal

Build a clean multi-step coin/project submission flow for SpookyCoins. Submissions should let real project owners or community members add projects on supported networks, while giving admins enough private information to review, approve, reject, or request changes.

Mock data remains the prototype baseline. Real user submissions will sit on top of the mock data once persistence is connected.

## Product rules

- Users must be signed in to submit a coin.
- Submissions use UUIDs because they are sensitive/internal workflow records.
- Public project pages and rankings use numeric project IDs.
- Submitted projects are crypto projects/tokens under supported networks, not the native/base coins themselves.
- Contact email and contact Telegram are private admin fields.
- Presale projects have a separate submission path/section and should display in a presale-specific table.
- Admin approval is required before a submitted project becomes publicly listed.
- Submitted/listed projects can later be eligible for Boosts and Promoted Coin placements if they are not suspended.
- Project owners should eventually be able to claim or manage their project after verification.

## Submission flow

Recommended multi-step structure:

1. Basics
2. Chain & contract
3. Links & socials
4. Trust & verification
5. Presale details, only when applicable
6. Private contact
7. Review & submit

Use Suspense, skeleton loading, or local loading states for any data-backed step so information does not abruptly appear.

## Public project fields

### Basics

- Logo
- Coin/project name
- Symbol
- Description
- Category
- Presale? yes/no

### Categories

- AI
- DeFi
- Fan Token
- Gambling
- Gaming
- Memecoins
- NFT Platform
- Other
- Play To Earn
- Pump.fun Tokens
- Utility Token

## Chain and token fields

- Chain/network
- Contract address
- Launch date and time, UTC

### Supported networks

- ETH
- BSC
- SOL
- MATIC
- AVAX
- ARB
- BASE
- OP
- DOGE
- TRX
- FTM
- KCC
- SUI
- HOOD
- XRPL
- OTHER

## Project links and socials

- Website
- Telegram
- X
- Discord
- YouTube
- Whitepaper

## Chart and DEX links

Projects should be allowed to provide their own chart and DEX links because each chain and liquidity route can be different.

Fields:

- Custom chart link, optional
- Custom DEX link, optional

Behavior:

- If provided, admins can review and approve the submitted links.
- If not provided, the platform can later attempt to generate or resolve defaults from chain + contract address.
- Project-provided links should be overrideable later through the request-change flow.
- Do not lock the product into one specific external market-data provider name in user-facing copy.

## Trust and verification fields

Some projects already have KYC and audits from third parties, so the submission flow should collect proof without automatically granting badges.

### KYC

- KYC provider/name
- KYC link/certificate URL
- KYC completion date, optional
- KYC expiry date, optional

### Audit

- Audit provider/name
- Audit report link
- Audit completion date, optional
- Contract/version audited, optional
- Audit result/summary, optional

Rules:

- KYC and audit badges remain pending until manually verified.
- Admin must verify provider, project name, contract address, date, and report/certificate legitimacy before public display.

## Private admin/contact fields

- Contact email
- Contact Telegram

These are for admin communication and should not be displayed publicly by default.

## Presale-specific fields

Only show these fields if the project is marked as a presale:

- Presale official/platform URL
- Presale start date and time, UTC
- Presale end date and time, UTC
- Accepted payment coin(s)
- Soft cap
- Hard cap
- Presale price, optional
- Minimum contribution, optional
- Maximum contribution, optional
- Contract address when deployed, optional

Presale display rules:

- Presales use their own table and rank against other presales.
- Status is derived from dates: Upcoming, Live, Ended, or TBA.
- Do not display market price, market cap, or 24h change when no public market exists.

## Submission statuses

Initial admin MVP statuses:

- Draft
- Submitted
- In review
- Needs changes
- Approved
- Rejected
- Listed
- Suspended

Promotion-related statuses are separate:

- Requested
- Review
- Approved
- Rejected
- Scheduled
- Live
- Expired

## Validation rules

- Name is required.
- Symbol is required and should be normalized without `$`.
- Description should have a meaningful minimum length.
- Category is required.
- Chain/network is required.
- Contract address is required for launched coins.
- Launch date is required for launched coins.
- Presale dates are required when the presale has a known schedule.
- Contact email is required.
- Contact Telegram is required.
- URLs must be valid `http` or `https` links.

## Database notes

- Submission records should use UUID primary keys.
- Store the submitted payload as structured fields where the platform needs querying/filtering.
- Store additional review/admin metadata separately from public project data.
- Keep numeric project IDs for approved public projects.
- Keep owner/user references tied to Better Auth user IDs.

Potential core records:

- `coin_submissions`
- `coin_submission_reviews`
- `coin_submission_events`
- `project_claims`
- `project_change_requests`

## Admin review needs

Admins should be able to:

- View submitted projects.
- See all public and private submission fields.
- Approve or reject submissions.
- Request changes.
- Add rejection reasons.
- Verify chart and DEX links.
- Verify KYC and audit proof.
- Convert an approved submission into a public project.
- Suspend a project if needed.

## Account page needs

Signed-in users should eventually see:

- Submitted projects
- Submission status
- Admin feedback / rejection reason
- Request edit/change button
- Claim status, when project claiming exists
- Orders, later
- Settings, separate page

## Open decisions

- Whether logo uploads should be available immediately through Cloudflare R2, or whether the MVP should start with logo URL only.
- Whether chart/DEX auto-resolution should happen before admin review or after approval.
- Whether contract address should be required for presales before deployment.
- Whether project claiming should be part of submission approval or a separate later flow.
