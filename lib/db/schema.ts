import {
  bigint,
  boolean,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
};

export const projects = pgTable(
  'projects',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    symbol: text('symbol').notNull(),
    logoUrl: text('logo_url'),
    description: text('description'),
    category: text('category').default('Other').notNull(),
    chain: text('chain'),
    contractAddress: text('contract_address'),
    launchDate: timestamp('launch_date', { withTimezone: true }),
    listingSource: text('listing_source').default('imported').notNull(),
    listingStatus: text('listing_status').default('active').notNull(),
    isPresale: boolean('is_presale').default(false).notNull(),
    submittedAt: timestamp('submitted_at', { withTimezone: true }).defaultNow().notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('projects_slug_unique').on(table.slug),
    index('projects_symbol_idx').on(table.symbol),
    index('projects_chain_idx').on(table.chain),
    index('projects_category_idx').on(table.category),
  ],
);

export const marketSources = pgTable(
  'market_sources',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    projectId: uuid('project_id')
      .references(() => projects.id, { onDelete: 'cascade' })
      .notNull(),
    provider: text('provider').notNull(),
    externalId: text('external_id').notNull(),
    sourceImageUrl: text('source_image_url'),
    lastMarketSyncAt: timestamp('last_market_sync_at', { withTimezone: true }),
    lastMetadataSyncAt: timestamp('last_metadata_sync_at', { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('market_sources_provider_external_unique').on(table.provider, table.externalId),
    uniqueIndex('market_sources_project_provider_unique').on(table.projectId, table.provider),
  ],
);

export const marketSnapshots = pgTable(
  'market_snapshots',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    projectId: uuid('project_id')
      .references(() => projects.id, { onDelete: 'cascade' })
      .notNull(),
    priceUsd: numeric('price_usd', { precision: 30, scale: 12 }),
    marketCapUsd: numeric('market_cap_usd', { precision: 30, scale: 2 }),
    volume24hUsd: numeric('volume_24h_usd', { precision: 30, scale: 2 }),
    change24h: numeric('change_24h', { precision: 12, scale: 4 }),
    marketRank: integer('market_rank'),
    recordedAt: timestamp('recorded_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('market_snapshots_project_recorded_idx').on(table.projectId, table.recordedAt)],
);

export const projectLinks = pgTable(
  'project_links',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    projectId: uuid('project_id')
      .references(() => projects.id, { onDelete: 'cascade' })
      .notNull(),
    type: text('type').notNull(),
    url: text('url').notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex('project_links_project_type_unique').on(table.projectId, table.type)],
);

export const changeRequests = pgTable(
  'change_requests',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    projectId: uuid('project_id')
      .references(() => projects.id, { onDelete: 'cascade' })
      .notNull(),
    requesterEmail: text('requester_email').notNull(),
    requesterTelegram: text('requester_telegram'),
    requestedChanges: text('requested_changes').notNull(),
    evidenceUrl: text('evidence_url'),
    status: text('status').default('pending').notNull(),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    ...timestamps,
  },
  (table) => [index('change_requests_project_status_idx').on(table.projectId, table.status)],
);
