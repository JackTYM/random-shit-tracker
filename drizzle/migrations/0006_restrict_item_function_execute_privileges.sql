-- Custom SQL migration file, put your code below! --

-- Migration 0004 replaced these functions via CREATE OR REPLACE with a changed parameter
-- signature (added p_storage_note), which caused Postgres to create new function objects
-- rather than updating the existing ones in place. New function objects receive Postgres's
-- default ACL (EXECUTE granted to PUBLIC), silently reverting the access restriction that
-- migration 0001 explicitly established. This re-applies that restriction to the current
-- (post-0004) function signatures.

REVOKE EXECUTE ON FUNCTION create_rocket_motor_item(text, text, text, text, numeric, date, text, text, text, numeric, motor_construction, motor_certification_status, integer, motor_propellant_type) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_rocket_motor_item(text, text, text, text, numeric, date, text, text, text, numeric, motor_construction, motor_certification_status, integer, motor_propellant_type) TO authenticated;

REVOKE EXECUTE ON FUNCTION create_model_rocket_kit_item(text, text, text, text, numeric, date, text, numeric, numeric, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_model_rocket_kit_item(text, text, text, text, numeric, date, text, numeric, numeric, numeric) TO authenticated;

REVOKE EXECUTE ON FUNCTION create_model_airplane_item(text, text, text, text, numeric, date, text, text, airplane_model_type, airplane_model_subtype, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_model_airplane_item(text, text, text, text, numeric, date, text, text, airplane_model_type, airplane_model_subtype, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION create_model_rocket_part_item(text, text, text, text, numeric, date, text, part_category, text, text, part_material, text, text, part_origin) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_model_rocket_part_item(text, text, text, text, numeric, date, text, part_category, text, text, part_material, text, text, part_origin) TO authenticated;

REVOKE EXECUTE ON FUNCTION create_printed_material_item(text, text, text, text, numeric, date, text, print_category, integer, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_printed_material_item(text, text, text, text, numeric, date, text, print_category, integer, text, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION create_other_collectable_item(text, text, text, text, numeric, date, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_other_collectable_item(text, text, text, text, numeric, date, text, text) TO authenticated;
