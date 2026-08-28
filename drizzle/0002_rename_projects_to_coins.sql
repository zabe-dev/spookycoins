ALTER TABLE "projects" RENAME TO "coins";--> statement-breakpoint
ALTER TABLE "project_links" RENAME TO "coin_links";--> statement-breakpoint
ALTER TABLE "project_submissions" RENAME TO "coin_submissions";--> statement-breakpoint
ALTER TABLE "market_sources" RENAME COLUMN "project_id" TO "coin_id";--> statement-breakpoint
ALTER TABLE "market_snapshots" RENAME COLUMN "project_id" TO "coin_id";--> statement-breakpoint
ALTER TABLE "coin_links" RENAME COLUMN "project_id" TO "coin_id";--> statement-breakpoint
ALTER TABLE "change_requests" RENAME COLUMN "project_id" TO "coin_id";--> statement-breakpoint
ALTER TABLE "coin_submissions" RENAME COLUMN "project_id" TO "coin_id";--> statement-breakpoint
ALTER TABLE "coin_submissions" RENAME COLUMN "project_data" TO "coin_data";--> statement-breakpoint
ALTER TABLE "payments" RENAME COLUMN "project_id" TO "coin_id";--> statement-breakpoint
ALTER TABLE "coin_submissions" ALTER COLUMN "submission_type" SET DEFAULT 'new-coin';--> statement-breakpoint
ALTER TABLE "change_requests" RENAME CONSTRAINT "change_requests_project_id_projects_id_fk" TO "change_requests_coin_id_coins_id_fk";--> statement-breakpoint
ALTER TABLE "market_snapshots" RENAME CONSTRAINT "market_snapshots_project_id_projects_id_fk" TO "market_snapshots_coin_id_coins_id_fk";--> statement-breakpoint
ALTER TABLE "market_sources" RENAME CONSTRAINT "market_sources_project_id_projects_id_fk" TO "market_sources_coin_id_coins_id_fk";--> statement-breakpoint
ALTER TABLE "coin_links" RENAME CONSTRAINT "project_links_project_id_projects_id_fk" TO "coin_links_coin_id_coins_id_fk";--> statement-breakpoint
ALTER TABLE "payments" RENAME CONSTRAINT "payments_project_id_projects_id_fk" TO "payments_coin_id_coins_id_fk";--> statement-breakpoint
ALTER TABLE "coin_submissions" RENAME CONSTRAINT "project_submissions_project_id_projects_id_fk" TO "coin_submissions_coin_id_coins_id_fk";--> statement-breakpoint
ALTER INDEX "projects_slug_unique" RENAME TO "coins_slug_unique";--> statement-breakpoint
ALTER INDEX "projects_symbol_idx" RENAME TO "coins_symbol_idx";--> statement-breakpoint
ALTER INDEX "projects_chain_idx" RENAME TO "coins_chain_idx";--> statement-breakpoint
ALTER INDEX "projects_category_idx" RENAME TO "coins_category_idx";--> statement-breakpoint
ALTER INDEX "market_sources_project_provider_unique" RENAME TO "market_sources_coin_provider_unique";--> statement-breakpoint
ALTER INDEX "market_snapshots_project_recorded_idx" RENAME TO "market_snapshots_coin_recorded_idx";--> statement-breakpoint
ALTER INDEX "project_links_project_type_unique" RENAME TO "coin_links_coin_type_unique";--> statement-breakpoint
ALTER INDEX "change_requests_project_status_idx" RENAME TO "change_requests_coin_status_idx";--> statement-breakpoint
ALTER INDEX "project_submissions_status_created_idx" RENAME TO "coin_submissions_status_created_idx";--> statement-breakpoint
ALTER INDEX "payments_project_status_idx" RENAME TO "payments_coin_status_idx";
