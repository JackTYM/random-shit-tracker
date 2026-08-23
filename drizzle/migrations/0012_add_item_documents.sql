CREATE TABLE "item_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" uuid NOT NULL,
	"owner_id" uuid DEFAULT public.current_owner_id() NOT NULL,
	"r2_key" text NOT NULL,
	"url" text NOT NULL,
	"filename" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "item_documents" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "item_documents" ADD CONSTRAINT "item_documents_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "item_documents_item_id_idx" ON "item_documents" USING btree ("item_id");--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-select" ON "item_documents" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select (auth.user_id())::uuid = "item_documents"."owner_id") AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "item_documents"."item_id" AND items.owner_id = (auth.user_id())::uuid
));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "item_documents" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select (auth.user_id())::uuid = "item_documents"."owner_id") AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "item_documents"."item_id" AND items.owner_id = (auth.user_id())::uuid
));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "item_documents" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select (auth.user_id())::uuid = "item_documents"."owner_id") AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "item_documents"."item_id" AND items.owner_id = (auth.user_id())::uuid
)) WITH CHECK ((select (auth.user_id())::uuid = "item_documents"."owner_id") AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "item_documents"."item_id" AND items.owner_id = (auth.user_id())::uuid
));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "item_documents" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select (auth.user_id())::uuid = "item_documents"."owner_id") AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "item_documents"."item_id" AND items.owner_id = (auth.user_id())::uuid
));