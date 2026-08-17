ALTER POLICY "crud-authenticated-policy-select" ON "model_airplanes" TO authenticated USING ((select auth.user_id() = "model_airplanes"."owner_id") AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "model_airplanes"."item_id" AND items.owner_id = auth.user_id()
));--> statement-breakpoint
ALTER POLICY "crud-authenticated-policy-insert" ON "model_airplanes" TO authenticated WITH CHECK ((select auth.user_id() = "model_airplanes"."owner_id") AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "model_airplanes"."item_id" AND items.owner_id = auth.user_id()
));--> statement-breakpoint
ALTER POLICY "crud-authenticated-policy-update" ON "model_airplanes" TO authenticated USING ((select auth.user_id() = "model_airplanes"."owner_id") AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "model_airplanes"."item_id" AND items.owner_id = auth.user_id()
)) WITH CHECK ((select auth.user_id() = "model_airplanes"."owner_id") AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "model_airplanes"."item_id" AND items.owner_id = auth.user_id()
));--> statement-breakpoint
ALTER POLICY "crud-authenticated-policy-delete" ON "model_airplanes" TO authenticated USING ((select auth.user_id() = "model_airplanes"."owner_id") AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "model_airplanes"."item_id" AND items.owner_id = auth.user_id()
));--> statement-breakpoint
ALTER POLICY "crud-authenticated-policy-select" ON "model_rocket_kits" TO authenticated USING ((select auth.user_id() = "model_rocket_kits"."owner_id") AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "model_rocket_kits"."item_id" AND items.owner_id = auth.user_id()
));--> statement-breakpoint
ALTER POLICY "crud-authenticated-policy-insert" ON "model_rocket_kits" TO authenticated WITH CHECK ((select auth.user_id() = "model_rocket_kits"."owner_id") AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "model_rocket_kits"."item_id" AND items.owner_id = auth.user_id()
));--> statement-breakpoint
ALTER POLICY "crud-authenticated-policy-update" ON "model_rocket_kits" TO authenticated USING ((select auth.user_id() = "model_rocket_kits"."owner_id") AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "model_rocket_kits"."item_id" AND items.owner_id = auth.user_id()
)) WITH CHECK ((select auth.user_id() = "model_rocket_kits"."owner_id") AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "model_rocket_kits"."item_id" AND items.owner_id = auth.user_id()
));--> statement-breakpoint
ALTER POLICY "crud-authenticated-policy-delete" ON "model_rocket_kits" TO authenticated USING ((select auth.user_id() = "model_rocket_kits"."owner_id") AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "model_rocket_kits"."item_id" AND items.owner_id = auth.user_id()
));--> statement-breakpoint
ALTER POLICY "crud-authenticated-policy-select" ON "model_rocket_parts" TO authenticated USING ((select auth.user_id() = "model_rocket_parts"."owner_id") AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "model_rocket_parts"."item_id" AND items.owner_id = auth.user_id()
));--> statement-breakpoint
ALTER POLICY "crud-authenticated-policy-insert" ON "model_rocket_parts" TO authenticated WITH CHECK ((select auth.user_id() = "model_rocket_parts"."owner_id") AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "model_rocket_parts"."item_id" AND items.owner_id = auth.user_id()
));--> statement-breakpoint
ALTER POLICY "crud-authenticated-policy-update" ON "model_rocket_parts" TO authenticated USING ((select auth.user_id() = "model_rocket_parts"."owner_id") AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "model_rocket_parts"."item_id" AND items.owner_id = auth.user_id()
)) WITH CHECK ((select auth.user_id() = "model_rocket_parts"."owner_id") AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "model_rocket_parts"."item_id" AND items.owner_id = auth.user_id()
));--> statement-breakpoint
ALTER POLICY "crud-authenticated-policy-delete" ON "model_rocket_parts" TO authenticated USING ((select auth.user_id() = "model_rocket_parts"."owner_id") AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "model_rocket_parts"."item_id" AND items.owner_id = auth.user_id()
));--> statement-breakpoint
ALTER POLICY "crud-authenticated-policy-select" ON "other_collectables" TO authenticated USING ((select auth.user_id() = "other_collectables"."owner_id") AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "other_collectables"."item_id" AND items.owner_id = auth.user_id()
));--> statement-breakpoint
ALTER POLICY "crud-authenticated-policy-insert" ON "other_collectables" TO authenticated WITH CHECK ((select auth.user_id() = "other_collectables"."owner_id") AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "other_collectables"."item_id" AND items.owner_id = auth.user_id()
));--> statement-breakpoint
ALTER POLICY "crud-authenticated-policy-update" ON "other_collectables" TO authenticated USING ((select auth.user_id() = "other_collectables"."owner_id") AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "other_collectables"."item_id" AND items.owner_id = auth.user_id()
)) WITH CHECK ((select auth.user_id() = "other_collectables"."owner_id") AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "other_collectables"."item_id" AND items.owner_id = auth.user_id()
));--> statement-breakpoint
ALTER POLICY "crud-authenticated-policy-delete" ON "other_collectables" TO authenticated USING ((select auth.user_id() = "other_collectables"."owner_id") AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "other_collectables"."item_id" AND items.owner_id = auth.user_id()
));--> statement-breakpoint
ALTER POLICY "crud-authenticated-policy-select" ON "printed_materials" TO authenticated USING ((select auth.user_id() = "printed_materials"."owner_id") AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "printed_materials"."item_id" AND items.owner_id = auth.user_id()
));--> statement-breakpoint
ALTER POLICY "crud-authenticated-policy-insert" ON "printed_materials" TO authenticated WITH CHECK ((select auth.user_id() = "printed_materials"."owner_id") AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "printed_materials"."item_id" AND items.owner_id = auth.user_id()
));--> statement-breakpoint
ALTER POLICY "crud-authenticated-policy-update" ON "printed_materials" TO authenticated USING ((select auth.user_id() = "printed_materials"."owner_id") AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "printed_materials"."item_id" AND items.owner_id = auth.user_id()
)) WITH CHECK ((select auth.user_id() = "printed_materials"."owner_id") AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "printed_materials"."item_id" AND items.owner_id = auth.user_id()
));--> statement-breakpoint
ALTER POLICY "crud-authenticated-policy-delete" ON "printed_materials" TO authenticated USING ((select auth.user_id() = "printed_materials"."owner_id") AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "printed_materials"."item_id" AND items.owner_id = auth.user_id()
));--> statement-breakpoint
ALTER POLICY "crud-authenticated-policy-select" ON "rocket_motors" TO authenticated USING ((select auth.user_id() = "rocket_motors"."owner_id") AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "rocket_motors"."item_id" AND items.owner_id = auth.user_id()
));--> statement-breakpoint
ALTER POLICY "crud-authenticated-policy-insert" ON "rocket_motors" TO authenticated WITH CHECK ((select auth.user_id() = "rocket_motors"."owner_id") AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "rocket_motors"."item_id" AND items.owner_id = auth.user_id()
));--> statement-breakpoint
ALTER POLICY "crud-authenticated-policy-update" ON "rocket_motors" TO authenticated USING ((select auth.user_id() = "rocket_motors"."owner_id") AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "rocket_motors"."item_id" AND items.owner_id = auth.user_id()
)) WITH CHECK ((select auth.user_id() = "rocket_motors"."owner_id") AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "rocket_motors"."item_id" AND items.owner_id = auth.user_id()
));--> statement-breakpoint
ALTER POLICY "crud-authenticated-policy-delete" ON "rocket_motors" TO authenticated USING ((select auth.user_id() = "rocket_motors"."owner_id") AND EXISTS (
  SELECT 1 FROM items WHERE items.id = "rocket_motors"."item_id" AND items.owner_id = auth.user_id()
));