-- Custom SQL migration file, put your code below! --

-- These 6 functions are SECURITY INVOKER and call auth.user_id() directly inside their
-- reference-code-generation WHERE clause, which fails under the `authenticated` role (see
-- migration 0008/0009's notes: authenticated has no USAGE on schema auth). Repoint that one
-- comparison at public.current_owner_id() (migration 0009), which resolves auth.user_id()
-- under neondb_owner's privileges via SECURITY DEFINER. No other logic changes.

CREATE OR REPLACE FUNCTION create_rocket_motor_item(
  p_name text,
  p_manufacturer_or_club text DEFAULT NULL,
  p_storage_location text DEFAULT NULL,
  p_storage_note text DEFAULT NULL,
  p_approx_value_usd numeric DEFAULT NULL,
  p_value_estimated_at date DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_impulse_class text DEFAULT NULL,
  p_designation text DEFAULT NULL,
  p_diameter_mm numeric DEFAULT NULL,
  p_construction motor_construction DEFAULT NULL,
  p_certification_status motor_certification_status DEFAULT NULL,
  p_quantity integer DEFAULT NULL,
  p_propellant_type motor_propellant_type DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  new_item_id uuid;
  next_seq integer;
  new_reference_code text;
BEGIN
  SELECT COALESCE(MAX(substring(reference_code from '\d+$')::int), 0) + 1 INTO next_seq
  FROM items WHERE category = 'motor' AND owner_id = public.current_owner_id();
  new_reference_code := 'MOT-' || lpad(next_seq::text, 4, '0');

  INSERT INTO items (category, name, manufacturer_or_club, storage_location, storage_note, reference_code, approx_value_usd, value_estimated_at, notes)
  VALUES ('motor', p_name, p_manufacturer_or_club, p_storage_location, p_storage_note, new_reference_code, p_approx_value_usd, p_value_estimated_at, p_notes)
  RETURNING id INTO new_item_id;

  INSERT INTO rocket_motors (item_id, impulse_class, designation, diameter_mm, construction, certification_status, quantity, propellant_type)
  VALUES (new_item_id, p_impulse_class, p_designation, p_diameter_mm, p_construction, p_certification_status, p_quantity, p_propellant_type);

  RETURN new_item_id;
END;
$$;

CREATE OR REPLACE FUNCTION create_model_rocket_kit_item(
  p_name text,
  p_manufacturer_or_club text DEFAULT NULL,
  p_storage_location text DEFAULT NULL,
  p_storage_note text DEFAULT NULL,
  p_approx_value_usd numeric DEFAULT NULL,
  p_value_estimated_at date DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_motor_diameter_mm numeric DEFAULT NULL,
  p_diameter_in numeric DEFAULT NULL,
  p_length_in numeric DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  new_item_id uuid;
  next_seq integer;
  new_reference_code text;
BEGIN
  SELECT COALESCE(MAX(substring(reference_code from '\d+$')::int), 0) + 1 INTO next_seq
  FROM items WHERE category = 'kit' AND owner_id = public.current_owner_id();
  new_reference_code := 'KIT-' || lpad(next_seq::text, 4, '0');

  INSERT INTO items (category, name, manufacturer_or_club, storage_location, storage_note, reference_code, approx_value_usd, value_estimated_at, notes)
  VALUES ('kit', p_name, p_manufacturer_or_club, p_storage_location, p_storage_note, new_reference_code, p_approx_value_usd, p_value_estimated_at, p_notes)
  RETURNING id INTO new_item_id;

  INSERT INTO model_rocket_kits (item_id, motor_diameter_mm, diameter_in, length_in)
  VALUES (new_item_id, p_motor_diameter_mm, p_diameter_in, p_length_in);

  RETURN new_item_id;
END;
$$;

CREATE OR REPLACE FUNCTION create_model_airplane_item(
  p_name text,
  p_manufacturer_or_club text DEFAULT NULL,
  p_storage_location text DEFAULT NULL,
  p_storage_note text DEFAULT NULL,
  p_approx_value_usd numeric DEFAULT NULL,
  p_value_estimated_at date DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_wingspan text DEFAULT NULL,
  p_model_type airplane_model_type DEFAULT NULL,
  p_model_subtype airplane_model_subtype DEFAULT NULL,
  p_model_subtype_other text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  new_item_id uuid;
  next_seq integer;
  new_reference_code text;
BEGIN
  SELECT COALESCE(MAX(substring(reference_code from '\d+$')::int), 0) + 1 INTO next_seq
  FROM items WHERE category = 'plane' AND owner_id = public.current_owner_id();
  new_reference_code := 'PLN-' || lpad(next_seq::text, 4, '0');

  INSERT INTO items (category, name, manufacturer_or_club, storage_location, storage_note, reference_code, approx_value_usd, value_estimated_at, notes)
  VALUES ('plane', p_name, p_manufacturer_or_club, p_storage_location, p_storage_note, new_reference_code, p_approx_value_usd, p_value_estimated_at, p_notes)
  RETURNING id INTO new_item_id;

  INSERT INTO model_airplanes (item_id, wingspan, model_type, model_subtype, model_subtype_other)
  VALUES (new_item_id, p_wingspan, p_model_type, p_model_subtype, p_model_subtype_other);

  RETURN new_item_id;
END;
$$;

CREATE OR REPLACE FUNCTION create_model_rocket_part_item(
  p_name text,
  p_manufacturer_or_club text DEFAULT NULL,
  p_storage_location text DEFAULT NULL,
  p_storage_note text DEFAULT NULL,
  p_approx_value_usd numeric DEFAULT NULL,
  p_value_estimated_at date DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_part_category part_category DEFAULT NULL,
  p_part_category_other text DEFAULT NULL,
  p_part_number text DEFAULT NULL,
  p_material part_material DEFAULT NULL,
  p_material_other text DEFAULT NULL,
  p_diameter text DEFAULT NULL,
  p_origin part_origin DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
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

  INSERT INTO model_rocket_parts (item_id, part_category, part_category_other, part_number, material, material_other, diameter, origin)
  VALUES (new_item_id, p_part_category, p_part_category_other, p_part_number, p_material, p_material_other, p_diameter, p_origin);

  RETURN new_item_id;
END;
$$;

CREATE OR REPLACE FUNCTION create_printed_material_item(
  p_name text,
  p_manufacturer_or_club text DEFAULT NULL,
  p_storage_location text DEFAULT NULL,
  p_storage_note text DEFAULT NULL,
  p_approx_value_usd numeric DEFAULT NULL,
  p_value_estimated_at date DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_print_category print_category DEFAULT NULL,
  p_year integer DEFAULT NULL,
  p_volume_or_issue text DEFAULT NULL,
  p_kit_number text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  new_item_id uuid;
  next_seq integer;
  new_reference_code text;
BEGIN
  SELECT COALESCE(MAX(substring(reference_code from '\d+$')::int), 0) + 1 INTO next_seq
  FROM items WHERE category = 'print' AND owner_id = public.current_owner_id();
  new_reference_code := 'PRN-' || lpad(next_seq::text, 4, '0');

  INSERT INTO items (category, name, manufacturer_or_club, storage_location, storage_note, reference_code, approx_value_usd, value_estimated_at, notes)
  VALUES ('print', p_name, p_manufacturer_or_club, p_storage_location, p_storage_note, new_reference_code, p_approx_value_usd, p_value_estimated_at, p_notes)
  RETURNING id INTO new_item_id;

  INSERT INTO printed_materials (item_id, print_category, year, volume_or_issue, kit_number)
  VALUES (new_item_id, p_print_category, p_year, p_volume_or_issue, p_kit_number);

  RETURN new_item_id;
END;
$$;

CREATE OR REPLACE FUNCTION create_other_collectable_item(
  p_name text,
  p_manufacturer_or_club text DEFAULT NULL,
  p_storage_location text DEFAULT NULL,
  p_storage_note text DEFAULT NULL,
  p_approx_value_usd numeric DEFAULT NULL,
  p_value_estimated_at date DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_type text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  new_item_id uuid;
  next_seq integer;
  new_reference_code text;
BEGIN
  SELECT COALESCE(MAX(substring(reference_code from '\d+$')::int), 0) + 1 INTO next_seq
  FROM items WHERE category = 'other' AND owner_id = public.current_owner_id();
  new_reference_code := 'OTH-' || lpad(next_seq::text, 4, '0');

  INSERT INTO items (category, name, manufacturer_or_club, storage_location, storage_note, reference_code, approx_value_usd, value_estimated_at, notes)
  VALUES ('other', p_name, p_manufacturer_or_club, p_storage_location, p_storage_note, new_reference_code, p_approx_value_usd, p_value_estimated_at, p_notes)
  RETURNING id INTO new_item_id;

  INSERT INTO other_collectables (item_id, type)
  VALUES (new_item_id, p_type);

  RETURN new_item_id;
END;
$$;
