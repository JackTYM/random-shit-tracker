-- Custom migration: replace model_rocket_parts.diameter (free text) with a typed
-- diameter_type/diameter_value/diameter_unit/diameter_code representation. Migrates the
-- 3 existing non-blank rows (checked against the live DB before writing this migration),
-- then redefines create_model_rocket_part_item to match the new column set.

CREATE TYPE "public"."part_diameter_type" AS ENUM('Measurement', 'Tube Code');
--> statement-breakpoint
CREATE TYPE "public"."part_diameter_unit" AS ENUM('mm', 'in');
--> statement-breakpoint
ALTER TABLE "model_rocket_parts" ADD COLUMN "diameter_type" "part_diameter_type";
--> statement-breakpoint
ALTER TABLE "model_rocket_parts" ADD COLUMN "diameter_value" numeric;
--> statement-breakpoint
ALTER TABLE "model_rocket_parts" ADD COLUMN "diameter_unit" "part_diameter_unit";
--> statement-breakpoint
ALTER TABLE "model_rocket_parts" ADD COLUMN "diameter_code" text;
--> statement-breakpoint
UPDATE "model_rocket_parts" SET "diameter_type" = 'Measurement', "diameter_value" = 1.325, "diameter_unit" = 'in' WHERE "item_id" = 'd37a196f-8fc5-4064-8c8a-ced119825527';
--> statement-breakpoint
UPDATE "model_rocket_parts" SET "diameter_type" = 'Tube Code', "diameter_code" = 'BT-50' WHERE "item_id" = '7f376f4a-0307-4c0c-a08f-4473f01729bc';
--> statement-breakpoint
UPDATE "model_rocket_parts" SET "diameter_type" = 'Measurement', "diameter_value" = 0.976, "diameter_unit" = 'in' WHERE "item_id" = 'a65dc408-3171-470e-b546-fe8bebbbef59';
--> statement-breakpoint
ALTER TABLE "model_rocket_parts" DROP COLUMN "diameter";
--> statement-breakpoint
DROP FUNCTION public.create_model_rocket_part_item(text, text, text, text, numeric, date, text, part_category, text, text, part_material, text, text, part_origin);
--> statement-breakpoint
CREATE FUNCTION public.create_model_rocket_part_item(
  p_name text,
  p_manufacturer_or_club text DEFAULT NULL::text,
  p_storage_location text DEFAULT NULL::text,
  p_storage_note text DEFAULT NULL::text,
  p_approx_value_usd numeric DEFAULT NULL::numeric,
  p_value_estimated_at date DEFAULT NULL::date,
  p_notes text DEFAULT NULL::text,
  p_part_category part_category DEFAULT NULL::part_category,
  p_part_category_other text DEFAULT NULL::text,
  p_part_number text DEFAULT NULL::text,
  p_material part_material DEFAULT NULL::part_material,
  p_material_other text DEFAULT NULL::text,
  p_diameter_type part_diameter_type DEFAULT NULL::part_diameter_type,
  p_diameter_value numeric DEFAULT NULL::numeric,
  p_diameter_unit part_diameter_unit DEFAULT NULL::part_diameter_unit,
  p_diameter_code text DEFAULT NULL::text,
  p_origin part_origin DEFAULT NULL::part_origin
)
RETURNS uuid
LANGUAGE plpgsql
AS $function$
DECLARE
  new_item_id uuid;
  next_seq integer;
  new_reference_code text;
BEGIN
  SELECT COALESCE(MAX(substring(reference_code from '\d+$')::int), 0) + 1 INTO next_seq
  FROM items WHERE category = 'part' AND owner_id = public.current_owner_id();
  new_reference_code := 'PRT-' || lpad(next_seq::text, 4, '0');

  INSERT INTO items (category, name, manufacturer_or_club, storage_location, storage_note, reference_code, approx_value_usd, value_estimated_at, notes)
  VALUES ('part', p_name, p_manufacturer_or_club, p_storage_location, p_storage_note, new_reference_code, p_approx_value_usd, p_value_estimated_at, p_notes)
  RETURNING id INTO new_item_id;

  INSERT INTO model_rocket_parts (item_id, part_category, part_category_other, part_number, material, material_other, diameter_type, diameter_value, diameter_unit, diameter_code, origin)
  VALUES (new_item_id, p_part_category, p_part_category_other, p_part_number, p_material, p_material_other, p_diameter_type, p_diameter_value, p_diameter_unit, p_diameter_code, p_origin);

  RETURN new_item_id;
END;
$function$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION public.create_model_rocket_part_item(text, text, text, text, numeric, date, text, part_category, text, text, part_material, text, part_diameter_type, numeric, part_diameter_unit, text, part_origin) FROM PUBLIC;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.create_model_rocket_part_item(text, text, text, text, numeric, date, text, part_category, text, text, part_material, text, part_diameter_type, numeric, part_diameter_unit, text, part_origin) TO authenticated;
