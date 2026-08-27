CREATE TABLE "change_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" integer NOT NULL,
	"requester_email" text NOT NULL,
	"requester_telegram" text,
	"requested_changes" text NOT NULL,
	"evidence_url" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "market_snapshots" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "market_snapshots_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"project_id" integer NOT NULL,
	"price_usd" numeric(30, 12),
	"market_cap_usd" numeric(30, 2),
	"volume_24h_usd" numeric(30, 2),
	"change_24h" numeric(12, 4),
	"market_rank" integer,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "market_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" integer NOT NULL,
	"provider" text NOT NULL,
	"external_id" text NOT NULL,
	"source_image_url" text,
	"last_market_sync_at" timestamp with time zone,
	"last_metadata_sync_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" integer NOT NULL,
	"type" text NOT NULL,
	"url" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" integer PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"symbol" text NOT NULL,
	"logo_url" text,
	"description" text,
	"category" text DEFAULT 'Other' NOT NULL,
	"chain" text,
	"contract_address" text,
	"launch_date" timestamp with time zone,
	"listing_source" text DEFAULT 'imported' NOT NULL,
	"listing_status" text DEFAULT 'active' NOT NULL,
	"is_presale" boolean DEFAULT false NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "change_requests" ADD CONSTRAINT "change_requests_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "market_snapshots" ADD CONSTRAINT "market_snapshots_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "market_sources" ADD CONSTRAINT "market_sources_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_links" ADD CONSTRAINT "project_links_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "change_requests_project_status_idx" ON "change_requests" USING btree ("project_id","status");--> statement-breakpoint
CREATE INDEX "market_snapshots_project_recorded_idx" ON "market_snapshots" USING btree ("project_id","recorded_at");--> statement-breakpoint
CREATE UNIQUE INDEX "market_sources_provider_external_unique" ON "market_sources" USING btree ("provider","external_id");--> statement-breakpoint
CREATE UNIQUE INDEX "market_sources_project_provider_unique" ON "market_sources" USING btree ("project_id","provider");--> statement-breakpoint
CREATE UNIQUE INDEX "project_links_project_type_unique" ON "project_links" USING btree ("project_id","type");--> statement-breakpoint
CREATE UNIQUE INDEX "projects_slug_unique" ON "projects" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "projects_symbol_idx" ON "projects" USING btree ("symbol");--> statement-breakpoint
CREATE INDEX "projects_chain_idx" ON "projects" USING btree ("chain");--> statement-breakpoint
CREATE INDEX "projects_category_idx" ON "projects" USING btree ("category");