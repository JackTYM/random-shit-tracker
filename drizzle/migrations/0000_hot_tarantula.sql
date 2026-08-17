CREATE TYPE "public"."category" AS ENUM('motor', 'kit', 'plane', 'part', 'print', 'other');--> statement-breakpoint
CREATE TABLE "items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid DEFAULT (auth.user_id()) NOT NULL,
	"category" "category" NOT NULL,
	"name" text NOT NULL,
	"manufacturer_or_club" text,
	"storage_location" text,
	"approx_value_usd" numeric,
	"value_estimated_at" date,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-select" ON "items" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id() = "items"."owner_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "items" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id() = "items"."owner_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "items" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id() = "items"."owner_id")) WITH CHECK ((select auth.user_id() = "items"."owner_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "items" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id() = "items"."owner_id"));