-- Custom SQL migration file, put your code below! --

-- Migration 0004 used CREATE OR REPLACE FUNCTION to add p_storage_note in the
-- middle of each create_*_item function's parameter list. Because the new
-- parameter list has a different type signature than the old one, Postgres
-- created new overloaded functions instead of replacing the old ones. This
-- leaves the old (pre-storage_note/reference_code) versions live, so any
-- caller that doesn't send p_storage_note as a named argument could silently
-- hit the stale function and create items with no reference code. Drop the
-- 6 stale old-signature overloads (matching 0002_default_null_item_function_params.sql).

DROP FUNCTION IF EXISTS create_rocket_motor_item(text, text, text, numeric, date, text, text, text, numeric, motor_construction, motor_certification_status, integer, motor_propellant_type);

DROP FUNCTION IF EXISTS create_model_rocket_kit_item(text, text, text, numeric, date, text, numeric, numeric, numeric);

DROP FUNCTION IF EXISTS create_model_airplane_item(text, text, text, numeric, date, text, text, airplane_model_type, airplane_model_subtype, text);

DROP FUNCTION IF EXISTS create_model_rocket_part_item(text, text, text, numeric, date, text, part_category, text, text, part_material, text, text, part_origin);

DROP FUNCTION IF EXISTS create_printed_material_item(text, text, text, numeric, date, text, print_category, integer, text, text);

DROP FUNCTION IF EXISTS create_other_collectable_item(text, text, text, numeric, date, text, text);
