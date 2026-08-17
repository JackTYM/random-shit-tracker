CREATE TABLE "item_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid DEFAULT (auth.user_id()) NOT NULL,
	"item_id" uuid NOT NULL,
	"related_item_id" uuid NOT NULL,
	"relationship_label" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "item_links" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "item_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" uuid NOT NULL,
	"owner_id" uuid DEFAULT (auth.user_id()) NOT NULL,
	"r2_key" text NOT NULL,
	"url" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "item_photos" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "item_links" ADD CONSTRAINT "item_links_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_links" ADD CONSTRAINT "item_links_related_item_id_items_id_fk" FOREIGN KEY ("related_item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_photos" ADD CONSTRAINT "item_photos_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-select" ON "item_links" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id() = "item_links"."owner_id") AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "item_links"."item_id" AND items.owner_id = auth.user_id()
) AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "item_links"."related_item_id" AND items.owner_id = auth.user_id()
));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "item_links" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id() = "item_links"."owner_id") AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "item_links"."item_id" AND items.owner_id = auth.user_id()
) AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "item_links"."related_item_id" AND items.owner_id = auth.user_id()
));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "item_links" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id() = "item_links"."owner_id") AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "item_links"."item_id" AND items.owner_id = auth.user_id()
) AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "item_links"."related_item_id" AND items.owner_id = auth.user_id()
)) WITH CHECK ((select auth.user_id() = "item_links"."owner_id") AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "item_links"."item_id" AND items.owner_id = auth.user_id()
) AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "item_links"."related_item_id" AND items.owner_id = auth.user_id()
));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "item_links" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id() = "item_links"."owner_id") AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "item_links"."item_id" AND items.owner_id = auth.user_id()
) AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "item_links"."related_item_id" AND items.owner_id = auth.user_id()
));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-select" ON "item_photos" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id() = "item_photos"."owner_id") AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "item_photos"."item_id" AND items.owner_id = auth.user_id()
));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "item_photos" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id() = "item_photos"."owner_id") AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "item_photos"."item_id" AND items.owner_id = auth.user_id()
));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "item_photos" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id() = "item_photos"."owner_id") AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "item_photos"."item_id" AND items.owner_id = auth.user_id()
)) WITH CHECK ((select auth.user_id() = "item_photos"."owner_id") AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "item_photos"."item_id" AND items.owner_id = auth.user_id()
));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "item_photos" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id() = "item_photos"."owner_id") AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "item_photos"."item_id" AND items.owner_id = auth.user_id()
));