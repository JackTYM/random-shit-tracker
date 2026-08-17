CREATE TYPE "public"."category" AS ENUM('motor', 'kit', 'plane', 'part', 'print', 'other');--> statement-breakpoint
CREATE TYPE "public"."airplane_model_subtype" AS ENUM('Rubber', 'Glider', 'Electric', 'Gas', 'Other');--> statement-breakpoint
CREATE TYPE "public"."airplane_model_type" AS ENUM('FF', 'CL', 'RC');--> statement-breakpoint
CREATE TYPE "public"."motor_certification_status" AS ENUM('Certified', 'Collectable', 'Out of Certification');--> statement-breakpoint
CREATE TYPE "public"."motor_construction" AS ENUM('Single-Use', 'Reloadable');--> statement-breakpoint
CREATE TYPE "public"."motor_propellant_type" AS ENUM('BP', 'Composite');--> statement-breakpoint
CREATE TYPE "public"."part_category" AS ENUM('Nose Cone', 'Fin Unit', 'Transition', 'Coupler', 'Centering Ring', 'Nose Block', 'Body Tube', 'Parachute', 'Other');--> statement-breakpoint
CREATE TYPE "public"."part_material" AS ENUM('Plastic', 'Balsa', 'Other');--> statement-breakpoint
CREATE TYPE "public"."part_origin" AS ENUM('Manufacturer''s Part', 'Custom');--> statement-breakpoint
CREATE TYPE "public"."print_category" AS ENUM('Book', 'Catalogue', 'Newsletter', 'Model Plan', 'Educational Material', 'Scale Data', 'Advertising Material');--> statement-breakpoint
CREATE TABLE "items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid DEFAULT (auth.user_id())::uuid NOT NULL,
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
CREATE TABLE "model_airplanes" (
	"item_id" uuid PRIMARY KEY NOT NULL,
	"owner_id" uuid DEFAULT (auth.user_id())::uuid NOT NULL,
	"wingspan" text,
	"model_type" "airplane_model_type",
	"model_subtype" "airplane_model_subtype",
	"model_subtype_other" text
);
--> statement-breakpoint
ALTER TABLE "model_airplanes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "model_rocket_kits" (
	"item_id" uuid PRIMARY KEY NOT NULL,
	"owner_id" uuid DEFAULT (auth.user_id())::uuid NOT NULL,
	"motor_diameter_mm" numeric,
	"diameter_in" numeric,
	"length_in" numeric
);
--> statement-breakpoint
ALTER TABLE "model_rocket_kits" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "model_rocket_parts" (
	"item_id" uuid PRIMARY KEY NOT NULL,
	"owner_id" uuid DEFAULT (auth.user_id())::uuid NOT NULL,
	"part_category" "part_category",
	"part_category_other" text,
	"part_number" text,
	"material" "part_material",
	"material_other" text,
	"diameter" text,
	"origin" "part_origin"
);
--> statement-breakpoint
ALTER TABLE "model_rocket_parts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "other_collectables" (
	"item_id" uuid PRIMARY KEY NOT NULL,
	"owner_id" uuid DEFAULT (auth.user_id())::uuid NOT NULL,
	"type" text
);
--> statement-breakpoint
ALTER TABLE "other_collectables" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "printed_materials" (
	"item_id" uuid PRIMARY KEY NOT NULL,
	"owner_id" uuid DEFAULT (auth.user_id())::uuid NOT NULL,
	"print_category" "print_category",
	"year" integer,
	"volume_or_issue" text,
	"kit_number" text
);
--> statement-breakpoint
ALTER TABLE "printed_materials" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "rocket_motors" (
	"item_id" uuid PRIMARY KEY NOT NULL,
	"owner_id" uuid DEFAULT (auth.user_id())::uuid NOT NULL,
	"impulse_class" text,
	"designation" text,
	"diameter_mm" numeric,
	"construction" "motor_construction",
	"certification_status" "motor_certification_status",
	"quantity" integer,
	"propellant_type" "motor_propellant_type"
);
--> statement-breakpoint
ALTER TABLE "rocket_motors" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "item_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" uuid NOT NULL,
	"owner_id" uuid DEFAULT (auth.user_id())::uuid NOT NULL,
	"related_item_id" uuid NOT NULL,
	"relationship_label" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "item_links" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "item_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" uuid NOT NULL,
	"owner_id" uuid DEFAULT (auth.user_id())::uuid NOT NULL,
	"r2_key" text NOT NULL,
	"url" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "item_photos" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "model_airplanes" ADD CONSTRAINT "model_airplanes_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "model_rocket_kits" ADD CONSTRAINT "model_rocket_kits_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "model_rocket_parts" ADD CONSTRAINT "model_rocket_parts_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "other_collectables" ADD CONSTRAINT "other_collectables_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "printed_materials" ADD CONSTRAINT "printed_materials_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rocket_motors" ADD CONSTRAINT "rocket_motors_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_links" ADD CONSTRAINT "item_links_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_links" ADD CONSTRAINT "item_links_related_item_id_items_id_fk" FOREIGN KEY ("related_item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_photos" ADD CONSTRAINT "item_photos_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "item_links_item_id_idx" ON "item_links" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "item_links_related_item_id_idx" ON "item_links" USING btree ("related_item_id");--> statement-breakpoint
CREATE INDEX "item_photos_item_id_idx" ON "item_photos" USING btree ("item_id");--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-select" ON "items" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select (auth.user_id())::uuid = "items"."owner_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "items" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select (auth.user_id())::uuid = "items"."owner_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "items" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select (auth.user_id())::uuid = "items"."owner_id")) WITH CHECK ((select (auth.user_id())::uuid = "items"."owner_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "items" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select (auth.user_id())::uuid = "items"."owner_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-select" ON "model_airplanes" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select (auth.user_id())::uuid = "model_airplanes"."owner_id") AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "model_airplanes"."item_id" AND items.owner_id = (auth.user_id())::uuid
));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "model_airplanes" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select (auth.user_id())::uuid = "model_airplanes"."owner_id") AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "model_airplanes"."item_id" AND items.owner_id = (auth.user_id())::uuid
));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "model_airplanes" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select (auth.user_id())::uuid = "model_airplanes"."owner_id") AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "model_airplanes"."item_id" AND items.owner_id = (auth.user_id())::uuid
)) WITH CHECK ((select (auth.user_id())::uuid = "model_airplanes"."owner_id") AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "model_airplanes"."item_id" AND items.owner_id = (auth.user_id())::uuid
));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "model_airplanes" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select (auth.user_id())::uuid = "model_airplanes"."owner_id") AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "model_airplanes"."item_id" AND items.owner_id = (auth.user_id())::uuid
));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-select" ON "model_rocket_kits" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select (auth.user_id())::uuid = "model_rocket_kits"."owner_id") AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "model_rocket_kits"."item_id" AND items.owner_id = (auth.user_id())::uuid
));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "model_rocket_kits" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select (auth.user_id())::uuid = "model_rocket_kits"."owner_id") AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "model_rocket_kits"."item_id" AND items.owner_id = (auth.user_id())::uuid
));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "model_rocket_kits" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select (auth.user_id())::uuid = "model_rocket_kits"."owner_id") AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "model_rocket_kits"."item_id" AND items.owner_id = (auth.user_id())::uuid
)) WITH CHECK ((select (auth.user_id())::uuid = "model_rocket_kits"."owner_id") AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "model_rocket_kits"."item_id" AND items.owner_id = (auth.user_id())::uuid
));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "model_rocket_kits" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select (auth.user_id())::uuid = "model_rocket_kits"."owner_id") AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "model_rocket_kits"."item_id" AND items.owner_id = (auth.user_id())::uuid
));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-select" ON "model_rocket_parts" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select (auth.user_id())::uuid = "model_rocket_parts"."owner_id") AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "model_rocket_parts"."item_id" AND items.owner_id = (auth.user_id())::uuid
));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "model_rocket_parts" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select (auth.user_id())::uuid = "model_rocket_parts"."owner_id") AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "model_rocket_parts"."item_id" AND items.owner_id = (auth.user_id())::uuid
));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "model_rocket_parts" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select (auth.user_id())::uuid = "model_rocket_parts"."owner_id") AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "model_rocket_parts"."item_id" AND items.owner_id = (auth.user_id())::uuid
)) WITH CHECK ((select (auth.user_id())::uuid = "model_rocket_parts"."owner_id") AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "model_rocket_parts"."item_id" AND items.owner_id = (auth.user_id())::uuid
));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "model_rocket_parts" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select (auth.user_id())::uuid = "model_rocket_parts"."owner_id") AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "model_rocket_parts"."item_id" AND items.owner_id = (auth.user_id())::uuid
));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-select" ON "other_collectables" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select (auth.user_id())::uuid = "other_collectables"."owner_id") AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "other_collectables"."item_id" AND items.owner_id = (auth.user_id())::uuid
));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "other_collectables" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select (auth.user_id())::uuid = "other_collectables"."owner_id") AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "other_collectables"."item_id" AND items.owner_id = (auth.user_id())::uuid
));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "other_collectables" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select (auth.user_id())::uuid = "other_collectables"."owner_id") AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "other_collectables"."item_id" AND items.owner_id = (auth.user_id())::uuid
)) WITH CHECK ((select (auth.user_id())::uuid = "other_collectables"."owner_id") AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "other_collectables"."item_id" AND items.owner_id = (auth.user_id())::uuid
));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "other_collectables" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select (auth.user_id())::uuid = "other_collectables"."owner_id") AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "other_collectables"."item_id" AND items.owner_id = (auth.user_id())::uuid
));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-select" ON "printed_materials" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select (auth.user_id())::uuid = "printed_materials"."owner_id") AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "printed_materials"."item_id" AND items.owner_id = (auth.user_id())::uuid
));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "printed_materials" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select (auth.user_id())::uuid = "printed_materials"."owner_id") AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "printed_materials"."item_id" AND items.owner_id = (auth.user_id())::uuid
));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "printed_materials" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select (auth.user_id())::uuid = "printed_materials"."owner_id") AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "printed_materials"."item_id" AND items.owner_id = (auth.user_id())::uuid
)) WITH CHECK ((select (auth.user_id())::uuid = "printed_materials"."owner_id") AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "printed_materials"."item_id" AND items.owner_id = (auth.user_id())::uuid
));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "printed_materials" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select (auth.user_id())::uuid = "printed_materials"."owner_id") AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "printed_materials"."item_id" AND items.owner_id = (auth.user_id())::uuid
));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-select" ON "rocket_motors" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select (auth.user_id())::uuid = "rocket_motors"."owner_id") AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "rocket_motors"."item_id" AND items.owner_id = (auth.user_id())::uuid
));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "rocket_motors" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select (auth.user_id())::uuid = "rocket_motors"."owner_id") AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "rocket_motors"."item_id" AND items.owner_id = (auth.user_id())::uuid
));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "rocket_motors" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select (auth.user_id())::uuid = "rocket_motors"."owner_id") AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "rocket_motors"."item_id" AND items.owner_id = (auth.user_id())::uuid
)) WITH CHECK ((select (auth.user_id())::uuid = "rocket_motors"."owner_id") AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "rocket_motors"."item_id" AND items.owner_id = (auth.user_id())::uuid
));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "rocket_motors" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select (auth.user_id())::uuid = "rocket_motors"."owner_id") AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "rocket_motors"."item_id" AND items.owner_id = (auth.user_id())::uuid
));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-select" ON "item_links" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select (auth.user_id())::uuid = "item_links"."owner_id") AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "item_links"."item_id" AND items.owner_id = (auth.user_id())::uuid
) AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "item_links"."related_item_id" AND items.owner_id = (auth.user_id())::uuid
));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "item_links" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select (auth.user_id())::uuid = "item_links"."owner_id") AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "item_links"."item_id" AND items.owner_id = (auth.user_id())::uuid
) AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "item_links"."related_item_id" AND items.owner_id = (auth.user_id())::uuid
));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "item_links" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select (auth.user_id())::uuid = "item_links"."owner_id") AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "item_links"."item_id" AND items.owner_id = (auth.user_id())::uuid
) AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "item_links"."related_item_id" AND items.owner_id = (auth.user_id())::uuid
)) WITH CHECK ((select (auth.user_id())::uuid = "item_links"."owner_id") AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "item_links"."item_id" AND items.owner_id = (auth.user_id())::uuid
) AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "item_links"."related_item_id" AND items.owner_id = (auth.user_id())::uuid
));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "item_links" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select (auth.user_id())::uuid = "item_links"."owner_id") AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "item_links"."item_id" AND items.owner_id = (auth.user_id())::uuid
) AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "item_links"."related_item_id" AND items.owner_id = (auth.user_id())::uuid
));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-select" ON "item_photos" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select (auth.user_id())::uuid = "item_photos"."owner_id") AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "item_photos"."item_id" AND items.owner_id = (auth.user_id())::uuid
));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "item_photos" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select (auth.user_id())::uuid = "item_photos"."owner_id") AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "item_photos"."item_id" AND items.owner_id = (auth.user_id())::uuid
));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "item_photos" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select (auth.user_id())::uuid = "item_photos"."owner_id") AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "item_photos"."item_id" AND items.owner_id = (auth.user_id())::uuid
)) WITH CHECK ((select (auth.user_id())::uuid = "item_photos"."owner_id") AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "item_photos"."item_id" AND items.owner_id = (auth.user_id())::uuid
));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "item_photos" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select (auth.user_id())::uuid = "item_photos"."owner_id") AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "item_photos"."item_id" AND items.owner_id = (auth.user_id())::uuid
));