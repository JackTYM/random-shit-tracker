import { pgTable, pgEnum, uuid, text, integer, numeric } from 'drizzle-orm/pg-core';
import { crudPolicy, authenticatedRole, authUid } from 'drizzle-orm/neon';
import { sql } from 'drizzle-orm';
import { items } from './items';

const ownerDefault = sql`(auth.user_id())`;

// Verifies the referenced items row is owned by the caller. Postgres FK
// constraints only check existence (not ownership) and bypass RLS entirely,
// so this must be combined with the owner_id check in every policy below.
const ownsItem = (itemIdCol: any) => sql`EXISTS (
  SELECT 1 FROM items WHERE items.id = ${itemIdCol} AND items.owner_id = auth.user_id()
)`;

// --- Rocket Motor ---
export const motorConstructionEnum = pgEnum('motor_construction', ['Single-Use', 'Reloadable']);
export const motorCertificationEnum = pgEnum('motor_certification_status', ['Certified', 'Collectable', 'Out of Certification']);
export const motorPropellantEnum = pgEnum('motor_propellant_type', ['BP', 'Composite']);

export const rocketMotors = pgTable('rocket_motors', {
  itemId: uuid('item_id').primaryKey().references(() => items.id, { onDelete: 'cascade' }),
  ownerId: uuid('owner_id').notNull().default(ownerDefault),
  impulseClass: text('impulse_class'),
  designation: text('designation'),
  diameterMm: numeric('diameter_mm'),
  construction: motorConstructionEnum('construction'),
  certificationStatus: motorCertificationEnum('certification_status'),
  quantity: integer('quantity'),
  propellantType: motorPropellantEnum('propellant_type'),
}, (table) => [
  crudPolicy({
    role: authenticatedRole,
    read: sql`${authUid(table.ownerId)} AND ${ownsItem(table.itemId)}`,
    modify: sql`${authUid(table.ownerId)} AND ${ownsItem(table.itemId)}`,
  }),
]);

// --- Model Rocket Kit ---
export const modelRocketKits = pgTable('model_rocket_kits', {
  itemId: uuid('item_id').primaryKey().references(() => items.id, { onDelete: 'cascade' }),
  ownerId: uuid('owner_id').notNull().default(ownerDefault),
  motorDiameterMm: numeric('motor_diameter_mm'),
  diameterIn: numeric('diameter_in'),
  lengthIn: numeric('length_in'),
}, (table) => [
  crudPolicy({
    role: authenticatedRole,
    read: sql`${authUid(table.ownerId)} AND ${ownsItem(table.itemId)}`,
    modify: sql`${authUid(table.ownerId)} AND ${ownsItem(table.itemId)}`,
  }),
]);

// --- Model Airplane ---
export const airplaneModelTypeEnum = pgEnum('airplane_model_type', ['FF', 'CL', 'RC']);
export const airplaneModelSubtypeEnum = pgEnum('airplane_model_subtype', ['Rubber', 'Glider', 'Electric', 'Gas', 'Other']);

export const modelAirplanes = pgTable('model_airplanes', {
  itemId: uuid('item_id').primaryKey().references(() => items.id, { onDelete: 'cascade' }),
  ownerId: uuid('owner_id').notNull().default(ownerDefault),
  wingspan: text('wingspan'),
  modelType: airplaneModelTypeEnum('model_type'),
  modelSubtype: airplaneModelSubtypeEnum('model_subtype'),
  modelSubtypeOther: text('model_subtype_other'),
}, (table) => [
  crudPolicy({
    role: authenticatedRole,
    read: sql`${authUid(table.ownerId)} AND ${ownsItem(table.itemId)}`,
    modify: sql`${authUid(table.ownerId)} AND ${ownsItem(table.itemId)}`,
  }),
]);

// --- Model Rocket Part ---
export const partCategoryEnum = pgEnum('part_category', [
  'Nose Cone', 'Fin Unit', 'Transition', 'Coupler', 'Centering Ring', 'Nose Block', 'Body Tube', 'Parachute', 'Other',
]);
export const partMaterialEnum = pgEnum('part_material', ['Plastic', 'Balsa', 'Other']);
export const partOriginEnum = pgEnum('part_origin', ["Manufacturer's Part", 'Custom']);

export const modelRocketParts = pgTable('model_rocket_parts', {
  itemId: uuid('item_id').primaryKey().references(() => items.id, { onDelete: 'cascade' }),
  ownerId: uuid('owner_id').notNull().default(ownerDefault),
  partCategory: partCategoryEnum('part_category'),
  partCategoryOther: text('part_category_other'),
  partNumber: text('part_number'),
  material: partMaterialEnum('material'),
  materialOther: text('material_other'),
  diameter: text('diameter'),
  origin: partOriginEnum('origin'),
}, (table) => [
  crudPolicy({
    role: authenticatedRole,
    read: sql`${authUid(table.ownerId)} AND ${ownsItem(table.itemId)}`,
    modify: sql`${authUid(table.ownerId)} AND ${ownsItem(table.itemId)}`,
  }),
]);

// --- Books / Printed Material ---
export const printCategoryEnum = pgEnum('print_category', [
  'Book', 'Catalogue', 'Newsletter', 'Model Plan', 'Educational Material', 'Scale Data', 'Advertising Material',
]);

export const printedMaterials = pgTable('printed_materials', {
  itemId: uuid('item_id').primaryKey().references(() => items.id, { onDelete: 'cascade' }),
  ownerId: uuid('owner_id').notNull().default(ownerDefault),
  printCategory: printCategoryEnum('print_category'),
  year: integer('year'),
  volumeOrIssue: text('volume_or_issue'),
  kitNumber: text('kit_number'),
}, (table) => [
  crudPolicy({
    role: authenticatedRole,
    read: sql`${authUid(table.ownerId)} AND ${ownsItem(table.itemId)}`,
    modify: sql`${authUid(table.ownerId)} AND ${ownsItem(table.itemId)}`,
  }),
]);

// --- Other Collectable ---
export const otherCollectables = pgTable('other_collectables', {
  itemId: uuid('item_id').primaryKey().references(() => items.id, { onDelete: 'cascade' }),
  ownerId: uuid('owner_id').notNull().default(ownerDefault),
  type: text('type'),
}, (table) => [
  crudPolicy({
    role: authenticatedRole,
    read: sql`${authUid(table.ownerId)} AND ${ownsItem(table.itemId)}`,
    modify: sql`${authUid(table.ownerId)} AND ${ownsItem(table.itemId)}`,
  }),
]);
