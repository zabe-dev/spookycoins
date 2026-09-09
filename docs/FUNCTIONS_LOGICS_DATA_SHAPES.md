# EndorseCoin: Functions, Logics, and Data Shapes

## Overview
This document outlines the key data shapes (database schema), core functions, and logic flows in the EndorseCoin application.

## Data Shapes (Database Schema)

The application uses a PostgreSQL database with Drizzle ORM. The schema is defined in `lib/db/schema.ts`. Key tables include:

### Core Entities
- **coins**: Stores cryptocurrency information (id, slug, name, symbol, logo_url, description, category, chain, contract_address, launch_date, listing_source, listing_status, is_presale, submitted_at, timestamps)
- **users**: User accounts (id, name, email, email_verified, image, role, banned, ban_reason, ban_expires, timestamps)
- **sessions**: Authentication sessions (id, expires_at, token, ip_address, user_agent, user_id, impersonated_by, timestamps)
- **accounts**: OAuth/credential accounts (id, account_id, provider_id, issuer, user_id, access_token, refresh_token, id_token, expires_at, scope, password, timestamps)
- **verifications**: Email verification records (id, identifier, value, expires_at, timestamps)

### Coin Submission & Management
- **coin_submissions**: User-submitted coin data for review (id, coin_id, submitted_by_user_id, requester_email, requester_telegram, submission_type, status, coin_data (JSONB), reviewed_at, timestamps)
- **coin_submission_categories**: Categories linked to submissions
- **coin_submission_contracts**: Contract addresses linked to submissions
- **coin_submission_links**: Links (website, socials, etc.) linked to submissions
- **coin_links**: Approved links for listed coins
- **coin_boosts**: Boost purchases for coins (multiplier, status, starts_at, expires_at, assigned_by_user_id, notes, timestamps)
- **coin_promotions**: Promoted placements for coins (placement, priority, status, starts_at, expires_at, assigned_by_user_id, notes, timestamps)
- **banner_ads**: Advertisement banners (placement, title, subtitle, image URLs, target URL, status, priority, starts_at, expires_at, assigned_by_user_id, notes, timestamps)

### Market Data
- **market_sources**: External market data source configuration (coin_id, provider, external_id, source_image_url, sync timestamps, error tracking)
- **market_snapshots**: Historical market data (coin_id, price_usd, market_cap_usd, volume_24h_usd, change_24h, liquidity_usd, fdv_usd, total_supply, holders_count, market_rank, recorded_at)

### Community & Engagement
- **coin_votes**: User votes on coins (coin_id, user_id, ip_address, user_agent, week_starts_at, created_at)
- **coin_watchlists**: User watchlists (coin_id, user_id, timestamps)

### Moderation & Audit
- **change_requests**: Requests to modify coin data (coin_id, requester_email, requester_telegram, requested_changes, evidence_url, status, reviewed_at, timestamps)
- **admin_audit_logs**: Admin actions (admin_user_id, action, target_type, target_id, metadata, created_at)
- **mailing_list_subscribers**: Email newsletter subscriptions (email, source, status, subscribed_at, unsubscribed_at, timestamps)
- **rate_limits**: Rate limiting tracking (key, action, subject, count, window_start, expires_at, timestamps)

### Indexes
Each table includes relevant indexes for query performance (unique indexes, composite indexes for common query patterns).

## Core Functions and Logics

### Authentication System
**File**: `lib/auth/server.ts`
- Uses `better-auth` library with Drizzle adapter
- Providers: Email/password (with OTP), Google OAuth (if configured)
- Features: Email verification, password reset, admin roles, role-based access
- Security: Rate limiting on auth endpoints, IP address handling via Cloudflare headers
- Hooks: 
  - `before`: Validate rate limits and settings updates
  - `after`: Record authentication failures
- Utilities: 
  - `sendAuthCodeEmail`: Sends OTP via Resend
  - Rate limit validation for sign-in, sign-up, password reset
  - Request context parsing and header decoding

### API Routes
**Pattern**: Next.js App Router with `route.ts` files in `app/api/`

#### Health Check
**File**: `app/api/health/route.ts`
- Simple GET endpoint returning service status
- Uses `apiSuccess` helper from `lib/api/responses`

#### Coin Submissions
**File**: `app/api/coin-submissions/route.ts`
- POST endpoint for submitting new coin listings or updates
- Flow:
  1. Authentication check via `auth.api.getSession`
  2. Rate limiting (5 submissions/hour per user/IP)
  3. Input validation (size limits, JSON parsing)
  4. Schema validation with Zod (`coinSubmissionPayloadSchema`)
  5. Turnstile CAPTCHA verification
  6. Logo upload to Cloudflare R2 (`uploadSubmissionLogo`)
  7. Database transaction:
     - Insert into `coin_submissions`
     - Insert related categories, contracts, links
  8. Returns submission ID on success
- Helper functions:
  - `normalizeSubmissionRequestBody`: Transforms incoming data to internal format
  - `buildSubmissionData`: Constructs stored coin data object
  - `buildSubmissionLinks`: Generates link records
  - `verifyTurnstile`: CAPTCHA verification
  - Byte length checking, JSON parsing utilities

#### Mailing List
**File**: `app/api/mailing-list/route.ts`
- POST endpoint for email subscriptions
- Validates email, checks existing subscription, inserts new subscriber

#### Market Data Sync
**File**: `app/api/market/sync/route.ts`
- Triggered endpoint to sync market data from external sources
- Processes market sources, fetches data, updates snapshots

#### Auth Endpoints
**File**: `app/api/auth/[...all]/route.ts`
- Handles all authentication routes (sign-in, sign-up, email verification, etc.)
- Delegates to `better-auth` handler

#### Coin-Specific Endpoints
**Files**: 
- `app/api/coins/[id]/vote/route.ts`: Record a vote for a coin
- `app/api/coins/[id]/watchlist/route.ts`: Toggle watchlist status
- `app/api/coins/[id]/change-request/route.ts`: Submit a change request for a coin

### Server-Side Logic (Features)
Logic is colocated with features in `features/**/server/` directories.

#### Coin Listing & Details
**File**: `features/coins/server/coin-list.ts`
- `getPublicCoinListItems`: Returns paginated list of active coins with enrichment
- `getPublicCoinListItemsByIds`: Get specific coins by IDs
- `getPublicCoinById`: Get single coin with full details
- Key logic:
  - Cache management with `rememberJson` and `getCacheVersion`
  - Processing of expired presales and deletion requests before queries
  - Data enrichment:
    - Market snapshots (latest price data)
    - Boosts (active multipliers)
    - Promotions (featured placements)
    - Links (website, socials, chart, DEX, etc.)
    - Submission data (for pending coins)
    - Interaction summaries (votes, watchlist)
  - Vote boosting: Boost multipliers increase vote weight for ranking
  - Chart/DEX URL generation: Converts contract addresses to embeddable URLs for providers like DexScreener, GeckoTerminal, etc.
  - Presale/launched lifecycle handling

#### Community Interactions
**File**: `features/coins/server/interactions.ts`
- `getCoinInteractionSummaries`: Retrieves vote and watchlist statistics for coins
- `recordCoinVote`: Records a new vote with cooldown enforcement (12 hours)
- `toggleCoinWatchlist`: Adds/removes coin from user's watchlist
- Features:
  - Caching of public interaction summaries (30s TTL)
  - Weekly vote tracking (Monday start)
  - Trending score calculation (recent votes × 3 + recent watchlist adds × 2)
  - User-specific data: voting status, next vote timestamp, watchlist status
  - Graceful handling of missing tables during migrations

#### Watchlist Management
**File**: `features/account/server/watchlist.ts`
- `getWatchlistTableRows`: Retrieves paginated watchlist for a user
- `getWatchlistTablePage`: Returns watchlist with pagination metadata
- Logic:
  - Joins watchlist entries with coin data
  - Caching for public watchlists
  - Sorting by save date (newest first)
  - Enrichment with coin data via `getPublicCoinListItemsByIds`

#### Advertising System
**Files**:
- `features/ads/server/banner-ads.ts`: Serves active banner ads based on placement and priority
- `features/ads/server/cache-invalidation.ts`: Handles cache clearing when ads change

#### Presale Expiry
**File**: `features/coins/server/presale-expiry.ts`
- Automatically updates presale coins to 'launched' status when end date passes

#### Deletion Requests
**File**: `features/coins/server/delete-requests.ts`
- Processes coin deletion requests after grace period

### Utility Libraries
Reusable functions across the application.

#### HTTP Utilities
**File**: `lib/http/client-ip.ts`
- `getClientIp`: Extracts real IP from headers (Cloudflare, forwarded-for, real-ip)

#### Storage
**File**: `lib/storage/r2.ts`
- `uploadSubmissionLogo`: Uploads logo images to Cloudflare R2
- Supports PNG, JPEG, WebP formats
- Generates signed PUT requests for secure upload
- Returns stored object key and public URL

#### Caching
**Files**:
- `lib/cache/json-cache.ts`: `rememberJson` function for caching JSON data with TTL
- `lib/cache/cache-version.ts`: `getCacheVersion` for cache busting on schema changes
- `lib/cache/cache-key.ts`: `cacheKeyPart` for generating safe cache keys
- `lib/cache/redis-lock.ts`: Distributed locking with Redis
- `lib/cache/redis.ts`: Resilient Redis client

#### Rate Limiting
**File**: `lib/security/rate-limit.ts`
- Core functions:
  - `consumeRateLimit`: Increments and checks limits (returns allow/reject)
  - `peekRateLimit`: Checks limit without incrementing
  - `resetRateLimit`: Clears a rate limit
  - `buildRequestSubject`/`buildIpSubject`: Creates unique keys for limiting
  - Fallback to in-memory Map when database unavailable
- Constants: `oneHourMs`, `fifteenMinutesMs`, `twoSecondsMs`

#### API Responses
**File**: `lib/api/responses.ts`
- `apiSuccess`: Standard success response wrapper
- `apiError`: Standard error response wrapper with code and message

#### Additional API Helpers
**Files**:
- `lib/api/rate-limit-response.ts`: Formats rate limit error responses
- `lib/api/rate-limit-message.ts`: Defines rate limit message constant
- `lib/api/responses.ts`: See above

#### Auth Utilities
**Files**:
- `lib/auth/session.ts`: Session management (`getCurrentSession`, `getSessionFromHeaders`)
- `lib/auth/client.ts`: Pre-configured BetterAuth client (`authClient`)
- `lib/auth/roles.ts`: Role-based access (`hasAdminAccess`)

#### UI Utilities
**File**: `lib/ui/pagination.ts`
- `getPaginationItems`: Generates pagination items with ellipses
- Options: count, page, siblingCount, boundaryCount
- Returns: Array of PaginationItem (number | 'start-ellipsis' | 'end-ellipsis')

## Lib Directory Utility Functions Summary
Based on exploration of the lib directory (excluding db), here is a detailed summary of utility functions:

### Auth Module
- **Session Management** (`lib/auth/session.ts`):
  - `getCurrentSession()`: Retrieves current session using Next.js headers
  - `getSessionFromHeaders(requestHeaders)`: Retrieves session from provided headers
- **Client Authentication** (`lib/auth/client.ts`):
  - `authClient`: Pre-configured BetterAuth client with admin and email OTP plugins
- **Role-Based Access** (`lib/auth/roles.ts`):
  - `hasAdminAccess(role)`: Checks if role (string or array) contains 'admin' (case-insensitive)
- **Server Authentication** (`lib/auth/server.ts`):
  - BetterAuth Configuration: Complete authentication setup with email/password, Google OAuth, admin plugin, email OTP plugin
  - Key Helper Functions:
    - `sendAuthCodeEmail()`: Sends OTP via Resend or logs in dev
    - `validateAuthRateLimits()`: Pre-request rate limit validation
    - `recordAuthFailures()`: Post-request failure tracking
    - `getAuthRequestDetails()`: Extracts request metadata (IP, location, timestamp)
    - `buildAuthCodeEmailText()`: Formats OTP email content

### Cache Module
- **Key Utilities** (`lib/cache/cache-key.ts`):
  - `cacheKeyPart(value)`: Normalizes values for cache keys (trim, lowercase, space-to-hyphen, URI encode)
- **Versioning** (`lib/cache/cache-version.ts`):
  - `getCacheVersion(scope)`: Retrieves version number from Redis (defaults to 1)
  - `bumpCacheVersion(...scopes)`: Increments version numbers for cache invalidation
  - `cacheVersionKey(scope)`: Generates Redis key for version storage (`cache-version:{scope}`)
- **JSON Caching** (`lib/cache/json-cache.ts`):
  - `rememberJson(key, options, loader)`: Cache-aside pattern for JSON data
  - `incrementCacheCounter(key, ttlSeconds)`: Atomic counter increment with optional TTL
- **Distributed Locking** (`lib/cache/redis-lock.ts`):
  - `withRedisLock(options, run)`: Executes function with Redis-based locking
  - Options: key, ttlMs, onLocked callback, runWithoutRedis flag
- **Redis Client** (`lib/cache/redis.ts`):
  - `getRedisClient()`: Lazily initialized Redis connection
  - `getReadyRedisClient()`: Returns connected client or null if unavailable

### HTTP Module
- **Client IP Extraction** (`lib/http/client-ip.ts`):
  - `getClientIp(requestHeaders)`: Extracts client IP from headers (CF-Connecting-IP, X-Forwarded-For, X-Real-IP)

### Security Module
- **Rate Limiting** (`lib/security/rate-limit.ts`):
  - `consumeRateLimit(options)`: Increments and checks rate limit (returns result with allowed/retryAfter)
  - `peekRateLimit(options)`: Checks current rate limit without incrementing
  - `resetRateLimit(action, subject)`: Resets rate limit for key
  - `buildRequestSubject(options)`: Constructs subject from request headers/user/email
  - `buildIpSubject(headers, prefix)`: Constructs IP-based subject
  - `normalizeEmail(email)`: Normalizes email (trim, lowercase)
  - Data Shapes: 
    - RateLimitOptions: action, subject, limit, windowMs
    - RateLimitResult: allowed, retryAfterSeconds, limit, remaining, resetAt

### Storage Module
- **Cloudflare R2 Storage** (`lib/storage/r2.ts`):
  - `uploadSubmissionLogo(logo)`: Uploads logo to R2 storage with signed URL
  - Input: logo object with name, mimeType (png/jpeg/webp), dataUrl, chain
  - Output: StoredObject with key and URL
  - Helper Functions:
    - `cleanPathSegment(value)`: Sanitizes path segments
    - `getR2Config()`: Retrieves and validates R2 configuration
    - `signedPutHeaders()`: Generates AWS v4 signatures for PUT requests
    - `dataUrlToBuffer()`: Converts data URL to Buffer
    - `objectRequestUrl()`/`publicObjectUrl()`: Constructs object URLs
    - `joinPath()`, `extensionForMime()`, `trimTrailingSlash()`: Path utilities
    - `sha256Hex()`, `hmacBuffer()`, `hmacHex()`: Cryptographic helpers

### UI Module
- **Pagination** (`lib/ui/pagination.ts`):
  - `getPaginationItems(options)`: Generates pagination items with ellipses
  - Options: count, page, siblingCount (default 1), boundaryCount (default 1)
  - Returns: Array of PaginationItem (number | 'start-ellipsis' | 'end-ellipsis')
  - Helper Functions:
    - `range(start, end)`: Generates number array
    - `clamp(value, min, max)`: Constraints value to range
    - `dedupePaginationItems(items, pageCount)`: Removes duplicates and invalid items

## Key Data Flow Examples

### Coin Submission Flow
1. User submits form via `/api/coin-submissions` (POST)
2. Route handler validates auth, rate limit, input size
3. Normalizes and validates submission data with Zod schema
4. Verifies Turnstile CAPTCHA
5. Uploads logo to R2 storage
6. Database transaction:
   - Creates `coin_submissions` record
   - Creates related `coin_submission_categories`, `contracts`, `links`
7. Returns submission ID to client

### Coin Listing Flow (Public)
1. Client requests `/api/coins` (handled via `features/coins/server/coin-list`)
2. `getPublicCoinListItems` checks cache (by version)
3. If cache miss:
   - Processes expired presales/deletion requests
   - Fetches active coins from `coins` table
   - For each coin, fetches:
     - Latest market snapshot
     - Active boosts/promotions
     - Associated links
     - Latest submission data (if any)
     - Interaction summaries (votes, watchlist)
   - Enriches coin data with computed fields (chart/DEX URLs, presale details, boost status, etc.)
   - Applies vote boosting for ranking
   - Caches result
4. Returns formatted coin list

### Voting Flow
1. User votes via `/api/coins/[id]/vote` (POST)
2. Route handler calls `recordCoinVote` from `features/coins/server/interactions`
3. Checks:
   - User is active (not banned)
   - Coin is active (listing status = 'active')
   - Vote cooldown (12 hours) for this user/coin
4. If passes:
   - Inserts vote into `coin_votes`
   - Returns updated interaction summary
5. If cooldown active:
   - Returns error with next available vote time

## Conclusion
This document captures the primary data structures, authentication mechanisms, API endpoints, server-side business logic, and utility functions that power the EndorseCoin application. The modular organization separates concerns effectively, with data access through Drizzle ORM, caching layers for performance, and utility functions for cross-cutting concerns like rate limiting, storage, and HTTP helpers.