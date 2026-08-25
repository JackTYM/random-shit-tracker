# Category Schema Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:subagent-driven-development (recommended) or superpowers-extended-cc:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Item Name optional (with an auto-computed fallback) for Rocket Motor/Part/Other, add a reusable conditional-field-visibility mechanism and apply it to Books/Printed Material's Kit # field, and replace Model Rocket Part's free-text Diameter with a typed Measurement-or-Tube-Code field — per the approved design at `docs/superpowers/specs/2026-08-23-category-schema-alignment-design.md`.

**Architecture:** Item Name's fallback is computed once, at write time, inside `useCreateItem`/`useUpdateItem` — so every existing display path (Browse, Search, Item Detail, Motors, Storage, Dashboard) needs zero changes, and search keeps working since the real name is what's actually stored. Conditional visibility is a small `showWhen: {field, equals}` property on `CategoryFormField`, checked both when rendering fields and when building the save payload (so a hidden field's stale value is nulled out, not silently submitted). Part's Diameter migration is a single hand-written custom migration (add new columns → migrate the 3 known rows → drop the old column → redefine the create RPC), since it interleaves a schema change with a one-time, fully-enumerable data migration that `drizzle-kit generate`'s auto-diffing can't produce.

**Tech Stack:** Nuxt 4, Vue 3 `<script setup>`, Drizzle ORM + drizzle-kit migrations, Neon Postgres (RLS + RPC functions).

**User decisions (already made):**
- Item Name: optional (not removed) for Rocket Motor, Model Rocket Part, Other Collectable — still manually typeable; falls back to a computed name when blank.
- Approx Value + Date of Estimate: stays on all 6 categories — no change.
- Kit #: gets real conditional visibility (shown only when Printed Material's Category is "Model Plan").
- Model Plan relationships ("links to parts"/"links to catalog"): the existing generic item-linking feature already satisfies this — no changes to linking.
- Storage Note: stays on every category — no change.
- Manufacturer / Club: stays on Model Rocket Part — no change.
- Label wording, enum casing, field order/grouping: all stay exactly as currently implemented — no changes.
- Model Rocket Part's Diameter: becomes a typed Measurement (numeric + mm/in unit) or Tube Code (free text) field, matching the app's existing "Other [Freeform]" UX pattern.
- Diameter migration of the 3 existing non-blank rows: `"0.976 in"` → Measurement/0.976/in; `"1.325 in"` → Measurement/1.325/in; `"BT-50"` → Tube Code/BT-50.
- No sort/filter UI is being built for Part diameter in this phase — nothing in the app currently sorts/filters Parts by diameter, so there's nothing to wire up (confirmed: `app/data/categoryCardFields.ts`'s Part entry doesn't show diameter at all, and Browse's sort options are Newest/A-Z/Value only).

---

## Task 1: Conditional field visibility (`showWhen`) and apply it to Kit #

**Goal:** `CategoryFormField` gains a reusable `showWhen` property; `CategoryFieldsForm.vue` only renders fields whose condition is met; the Add Item and Item Detail save paths null out any field that's currently hidden (so a stale value from before a toggle never gets silently submitted); Kit # only appears when a Printed Material's Category is "Model Plan".

**Files:**
- Modify: `app/data/categoryFormFields.ts`
- Modify: `app/components/CategoryFieldsForm.vue`
- Modify: `app/pages/items/new.vue`
- Modify: `app/pages/items/[id].vue`

**Acceptance Criteria:**
- [ ] `CategoryFormField` has an optional `showWhen: { field: string; equals: string }` property
- [ ] `CategoryFieldsForm.vue` only renders a field when `showWhen` is absent, or when the referenced field's current value equals the required value
- [ ] Kit # (`p_kit_number`) has `showWhen: { field: 'p_print_category', equals: 'Model Plan' }`
- [ ] Add Item: creating/saving a Printed Material with Category ≠ "Model Plan" never submits a Kit # value, even if one was typed before switching category away from Model Plan
- [ ] Item Detail edit mode: the same holds when editing an existing Printed Material
- [ ] `npm run typecheck` passes

**Verify:** `npm run typecheck`. Live check: Add Item → Books/Printed Material — confirm Kit # is hidden by default, appears when Category is set to "Model Plan", and disappears again if Category is changed away from it (with its value cleared from the visible form, though the underlying ref may still hold stale text — the acceptance criterion is about what gets *submitted*, not the transient ref state). Save both with and without Kit # visible, confirm the DB row has `kit_number` populated only in the Model-Plan case.

**Steps:**

- [ ] **Step 1: Read the current files**

Read `app/data/categoryFormFields.ts`, `app/components/CategoryFieldsForm.vue`, `app/pages/items/new.vue`, and `app/pages/items/[id].vue` in full and confirm they match the versions currently on `master`. If any has drifted, stop and report before proceeding.

- [ ] **Step 2: Add `showWhen` to the type and to Kit #**

In `app/data/categoryFormFields.ts`, change:
```ts
export interface CategoryFormField {
  key: string;
  label: string;
  type: FormFieldType;
  options?: string[];
  otherKey?: string;
}
```
to:
```ts
export interface CategoryFormField {
  key: string;
  label: string;
  type: FormFieldType;
  options?: string[];
  otherKey?: string;
  showWhen?: { field: string; equals: string };
}
```

In the same file, find `{ key: 'p_kit_number', label: 'Kit #', type: 'text' },` (in the `print` category's field array) and change it to:
```ts
{ key: 'p_kit_number', label: 'Kit #', type: 'text', showWhen: { field: 'p_print_category', equals: 'Model Plan' } },
```

- [ ] **Step 3: Filter fields by `showWhen` in `CategoryFieldsForm.vue`**

In `app/components/CategoryFieldsForm.vue`, change:
```ts
const currentFields = computed(() => CATEGORY_FORM_FIELDS[props.category] ?? []);
```
to:
```ts
const currentFields = computed(() => {
  const fields = CATEGORY_FORM_FIELDS[props.category] ?? [];
  return fields.filter((f) => !f.showWhen || props.values[f.showWhen.field] === f.showWhen.equals);
});
```

- [ ] **Step 4: Null out hidden fields when building the Add Item save payload**

In `app/pages/items/new.vue`, change:
```ts
function buildCategoryFieldPayload(fields: { key: string; type: string; otherKey?: string }[]): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  for (const field of fields) {
    let value: unknown = categoryValues.value[field.key] ?? null;
    if (field.type === 'number') {
      value = value === '' || value === null || value === undefined ? null : Number(value);
    } else if (value === '') {
      value = null;
    }
    payload[field.key] = value;
    if (field.otherKey) {
      payload[field.otherKey] = value === 'Other' ? (otherValues.value[field.otherKey] || null) : null;
    }
  }
  return payload;
}
```
to:
```ts
function buildCategoryFieldPayload(fields: { key: string; type: string; otherKey?: string; showWhen?: { field: string; equals: string } }[]): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  for (const field of fields) {
    const hidden = !!field.showWhen && categoryValues.value[field.showWhen.field] !== field.showWhen.equals;
    let value: unknown = hidden ? null : (categoryValues.value[field.key] ?? null);
    if (field.type === 'number') {
      value = value === '' || value === null || value === undefined ? null : Number(value);
    } else if (value === '') {
      value = null;
    }
    payload[field.key] = value;
    if (field.otherKey) {
      payload[field.otherKey] = value === 'Other' ? (otherValues.value[field.otherKey] || null) : null;
    }
  }
  return payload;
}
```

- [ ] **Step 5: Null out hidden fields when building the Item Detail edit save payload**

In `app/pages/items/[id].vue`, apply the identical change to `buildEditCategoryPayload`, using `editCategoryValues` (its existing state ref) instead of `categoryValues`:

```ts
function buildEditCategoryPayload(): Record<string, unknown> {
  const config = CATEGORY_FORM_FIELDS[item.value.category] ?? [];
  const payload: Record<string, unknown> = {};
  for (const field of config) {
    const hidden = !!field.showWhen && editCategoryValues.value[field.showWhen.field] !== field.showWhen.equals;
    let value: unknown = hidden ? null : (editCategoryValues.value[field.key] ?? null);
    if (field.type === 'number') {
      value = value === '' || value === null || value === undefined ? null : Number(value);
    } else if (value === '') {
      value = null;
    }
    payload[field.key] = value;
    if (field.otherKey) {
      payload[field.otherKey] = value === 'Other' ? (editOtherValues.value[field.otherKey] || null) : null;
    }
  }
  return payload;
}
```
(This is the same file's existing `buildEditCategoryPayload` — only the new `hidden` line and the `value` line's ternary are added/changed; everything else in the function is unchanged.)

- [ ] **Step 6: Verify and commit**

```bash
npm run typecheck
```
Expected: `ok`.

Live check (dev server, dedicated test account): Add Item → Books/Printed Material. Confirm Kit # is not visible initially. Type something into another field, then set Category to "Model Plan" — confirm Kit # appears. Type a Kit # value, then change Category away from "Model Plan" — confirm Kit # disappears. Save the item — confirm (via a read-only DB check scoped to your test account) that `kit_number` is `NULL` on the saved row (since Category ended up not-Model-Plan). Repeat, this time leaving Category as "Model Plan" with a Kit # typed in — confirm it saves correctly. Repeat both cases in Item Detail's edit mode on an existing Printed Material item.

```bash
git add app/data/categoryFormFields.ts app/components/CategoryFieldsForm.vue app/pages/items/new.vue "app/pages/items/[id].vue"
git commit -m "Add conditional field visibility (showWhen) and apply it to Kit #"
```

---

## Task 2: Item Name optional for Rocket Motor, Model Rocket Part, Other Collectable

**Goal:** Item Name is no longer required for these 3 categories (still required for Model Airplane, Model Rocket Kit, Books/Printed Material). When left blank, a real, sensible name is computed and stored automatically at save time — no display-layer changes needed anywhere, since the actual `items.name` column ends up populated either way.

**Files:**
- Create: `app/data/computeFallbackName.ts`
- Modify: `app/composables/useCreateItem.ts`
- Modify: `app/composables/useUpdateItem.ts`
- Modify: `app/pages/items/new.vue`
- Modify: `app/pages/items/[id].vue`

**Acceptance Criteria:**
- [ ] Add Item: saving a Rocket Motor, Model Rocket Part, or Other Collectable with a blank Item Name succeeds (no "required" error) and the saved item has a sensible non-blank name
- [ ] Add Item: saving a Model Airplane, Model Rocket Kit, or Books/Printed Material with a blank Item Name still shows the "required" error and does not save
- [ ] Item Detail edit mode: the same rules apply when editing an existing item
- [ ] Typing an explicit Item Name (any category) always wins over the computed fallback
- [ ] The computed fallback name is genuinely searchable (via the header search box and the Search page) since it's the real stored `items.name`
- [ ] `npm run typecheck` passes

**Verify:** `npm run typecheck`. Live check: create one Rocket Motor, one Model Rocket Part, and one Other Collectable, each with Item Name left blank but their category-identifying fields filled in — confirm each saves successfully, shows a sensible computed name on Browse/Search/its own detail page/Storage, and is findable by searching for a word from that computed name. Confirm Model Airplane/Kit/Printed Material still block saving with a blank name.

**Steps:**

- [ ] **Step 1: Read the current files**

Read `app/composables/useCreateItem.ts`, `app/composables/useUpdateItem.ts`, `app/pages/items/new.vue`, and `app/pages/items/[id].vue` in full and confirm they match the versions currently on `master` (`app/pages/items/new.vue` and `app/pages/items/[id].vue` will already carry Task 1's changes if this task runs after it — check for those, not against a pre-Task-1 baseline). If anything is unexpected, stop and report before proceeding.

- [ ] **Step 2: Create the fallback-name helper**

Create `app/data/computeFallbackName.ts`:

```ts
import { CATEGORY_LABELS } from './categoryFormFields';

export function computeFallbackName(
  category: string,
  shared: { manufacturerOrClub: string | null },
  categoryFields: Record<string, unknown>,
): string {
  if (category === 'motor') {
    const designation = (categoryFields.p_designation as string) || (categoryFields.p_impulse_class as string) || '';
    const combined = [shared.manufacturerOrClub, designation].filter(Boolean).join(' ').trim();
    return combined || CATEGORY_LABELS.motor;
  }
  if (category === 'part') {
    const partCategory = (categoryFields.p_part_category as string) || '';
    const partNumber = (categoryFields.p_part_number as string) || '';
    if (partCategory && partNumber) return `${partCategory} — ${partNumber}`;
    return partCategory || partNumber || CATEGORY_LABELS.part;
  }
  if (category === 'other') {
    return (categoryFields.p_type as string) || CATEGORY_LABELS.other;
  }
  return CATEGORY_LABELS[category] ?? 'Untitled Item';
}
```

- [ ] **Step 3: Use the fallback in `createItem`**

In `app/composables/useCreateItem.ts`, add the import at the top:
```ts
import { computeFallbackName } from '~/data/computeFallbackName';
```

Change:
```ts
  async function createItem(
    category: string,
    shared: SharedItemFields,
    categoryFields: Record<string, unknown>,
    photos: StagedPhoto[] = [],
  ): Promise<string> {
    const fnName = RPC_BY_CATEGORY[category];
    if (!fnName) throw new Error(`Unknown category: ${category}`);

    const { data: itemId, error } = await client.rpc(fnName, {
      p_name: shared.name,
```
to:
```ts
  async function createItem(
    category: string,
    shared: SharedItemFields,
    categoryFields: Record<string, unknown>,
    photos: StagedPhoto[] = [],
  ): Promise<string> {
    const fnName = RPC_BY_CATEGORY[category];
    if (!fnName) throw new Error(`Unknown category: ${category}`);

    const name = shared.name.trim() || computeFallbackName(category, shared, categoryFields);

    const { data: itemId, error } = await client.rpc(fnName, {
      p_name: name,
```
(Everything else in `createItem` — the rest of the RPC params object, the photo-insert block, the return — is unchanged.)

- [ ] **Step 4: Use the fallback in `updateItem`**

In `app/composables/useUpdateItem.ts`, add the import at the top:
```ts
import { computeFallbackName } from '~/data/computeFallbackName';
```

Change:
```ts
  async function updateItem(
    itemId: string,
    category: string,
    shared: UpdateSharedFields,
    categoryFields: Record<string, unknown>,
  ): Promise<void> {
    const table = CATEGORY_TABLE[category];
    if (!table) throw new Error(`Unknown category: ${category}`);

    const { error: itemsError } = await client
      .from('items')
      .update({
        name: shared.name,
```
to:
```ts
  async function updateItem(
    itemId: string,
    category: string,
    shared: UpdateSharedFields,
    categoryFields: Record<string, unknown>,
  ): Promise<void> {
    const table = CATEGORY_TABLE[category];
    if (!table) throw new Error(`Unknown category: ${category}`);

    const name = shared.name.trim() || computeFallbackName(category, shared, categoryFields);

    const { error: itemsError } = await client
      .from('items')
      .update({
        name,
```
(Everything else in `updateItem` — the rest of the update payload, the category-table update block — is unchanged. Note `categoryFields` here still has its `p_`-prefixed keys at the point this runs, since the prefix-stripping into `columnValues` happens afterward in this same function — `computeFallbackName` expects the `p_`-prefixed keys, matching `createItem`'s usage.)

- [ ] **Step 5: Relax the "required" check in Add Item**

In `app/pages/items/new.vue`, add a constant near the top of `<script setup>` (after the existing imports):
```ts
const NAME_REQUIRED_CATEGORIES = new Set(['plane', 'kit', 'print']);
```

Change `save()`'s validation order and logic from:
```ts
async function save(andAddAnother: boolean) {
  error.value = '';
  if (!name.value.trim()) {
    error.value = 'Item name is required.';
    return;
  }
  if (!selectedCategory.value) {
    error.value = 'Pick a category.';
    return;
  }
  saving.value = true;
```
to:
```ts
async function save(andAddAnother: boolean) {
  error.value = '';
  if (!selectedCategory.value) {
    error.value = 'Pick a category.';
    return;
  }
  if (NAME_REQUIRED_CATEGORIES.has(selectedCategory.value) && !name.value.trim()) {
    error.value = 'Item name is required.';
    return;
  }
  saving.value = true;
```
(The category check now runs first since the name-required check now depends on knowing the category. Everything after `saving.value = true;` is unchanged.)

- [ ] **Step 6: Relax the "required" check in Item Detail's edit mode**

In `app/pages/items/[id].vue`, add the same constant near the top of `<script setup>`:
```ts
const NAME_REQUIRED_CATEGORIES = new Set(['plane', 'kit', 'print']);
```

Change `saveEdit()` from:
```ts
async function saveEdit() {
  if (!item.value) return;
  if (!editName.value.trim()) {
    saveError.value = 'Item name is required.';
    return;
  }
  saving.value = true;
```
to:
```ts
async function saveEdit() {
  if (!item.value) return;
  if (NAME_REQUIRED_CATEGORIES.has(item.value.category) && !editName.value.trim()) {
    saveError.value = 'Item name is required.';
    return;
  }
  saving.value = true;
```

- [ ] **Step 7: Verify and commit**

```bash
npm run typecheck
```
Expected: `ok`.

Live check (dev server, dedicated test account):
1. Add Item → Rocket Motor, fill Manufacturer "Estes" and Designation "E9-6", leave Item Name blank → save. Confirm it saves and shows as "Estes E9-6" on Browse, on its own detail page, and in the Motors table. Search for "E9-6" in the header search box and on the Search page — confirm it's found.
2. Add Item → Model Rocket Part, fill Part Category "Nose Cone" and Part Number "NC-20", leave Item Name blank → save. Confirm it shows as "Nose Cone — NC-20".
3. Add Item → Other Collectable, fill Type "Patch", leave Item Name blank → save. Confirm it shows as "Patch".
4. Add Item → Model Airplane, leave Item Name blank → confirm "Item name is required" still blocks saving.
5. Repeat the blank-name-blocked check for Model Rocket Kit and Books/Printed Material.
6. Open one of the auto-named items in Item Detail, enter edit mode, confirm Item Name is not force-required there either, save with it still blank, confirm the name is recomputed and unchanged (or updated if you changed a category field it depends on).

```bash
git add app/data/computeFallbackName.ts app/composables/useCreateItem.ts app/composables/useUpdateItem.ts app/pages/items/new.vue "app/pages/items/[id].vue"
git commit -m "Make Item Name optional for Rocket Motor, Model Rocket Part, Other Collectable"
```

---

## Task 3: Model Rocket Part — typed Diameter (Measurement or Tube Code)

**Goal:** Model Rocket Part's Diameter becomes a typed field — Measurement (numeric value + mm/in unit) or Tube Code (free text) — replacing the old single free-text column, with the 3 existing non-blank rows migrated to their correct typed values.

**Files:**
- Modify: `drizzle/schema/categories.ts`
- Create: `drizzle/migrations/0013_part_diameter_type.sql` (hand-written custom migration)
- Modify: `app/data/categoryFormFields.ts`
- Modify: `app/pages/items/[id].vue`

**Acceptance Criteria:**
- [ ] `model_rocket_parts` has new columns `diameter_type` (`'Measurement' | 'Tube Code'`), `diameter_value` (numeric), `diameter_unit` (`'mm' | 'in'`), `diameter_code` (text); the old `diameter` text column is gone
- [ ] The 3 pre-existing non-blank rows are migrated exactly: item `d37a196f-8fc5-4064-8c8a-ced119825527` → Measurement/1.325/in; item `7f376f4a-0307-4c0c-a08f-4473f01729bc` → Tube Code/BT-50; item `a65dc408-3171-470e-b546-fe8bebbbef59` → Measurement/0.976/in
- [ ] `create_model_rocket_part_item` RPC accepts the 4 new params instead of the old `p_diameter`, with `authenticated` (not `PUBLIC`) granted EXECUTE
- [ ] Add Item → Model Rocket Part shows a Diameter Type selector (Measurement / Tube Code); selecting Measurement shows a numeric value input + mm/in unit selector; selecting Tube Code shows a plain text input; only the relevant fields are ever submitted (Task 1's `showWhen` nulling covers this automatically)
- [ ] Item Detail's Specifications panel shows a single "Diameter" row (e.g. "18mm" or "BT-60"), not 3-4 separate raw rows
- [ ] `npm run typecheck && npm run build` both pass

**Verify:** `npm run typecheck && npm run build`. Read-only DB check confirming the 3 migrated rows exactly match the values above. Live check: create a new Rocket Part with a Measurement diameter, another with a Tube Code diameter — confirm both save, and confirm their Specifications panel shows one clean "Diameter" line each. Open one of the 3 pre-existing migrated Part items and confirm its Diameter still displays correctly.

**Steps:**

- [ ] **Step 1: Read the current files**

Read `drizzle/schema/categories.ts`, `app/data/categoryFormFields.ts`, and `app/pages/items/[id].vue` in full (the latter will already carry Tasks 1 and 2's changes if this runs after them). Confirm `drizzle/migrations/` currently ends at `0012_add_item_documents.sql` (so `0013` is the next available number) — if a `0013` migration already exists, stop and report before proceeding.

- [ ] **Step 2: Update the Drizzle schema**

In `drizzle/schema/categories.ts`, change:
```ts
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
```
to:
```ts
export const partOriginEnum = pgEnum('part_origin', ["Manufacturer's Part", 'Custom']);
export const partDiameterTypeEnum = pgEnum('part_diameter_type', ['Measurement', 'Tube Code']);
export const partDiameterUnitEnum = pgEnum('part_diameter_unit', ['mm', 'in']);

export const modelRocketParts = pgTable('model_rocket_parts', {
  itemId: uuid('item_id').primaryKey().references(() => items.id, { onDelete: 'cascade' }),
  ownerId: uuid('owner_id').notNull().default(ownerDefault),
  partCategory: partCategoryEnum('part_category'),
  partCategoryOther: text('part_category_other'),
  partNumber: text('part_number'),
  material: partMaterialEnum('material'),
  materialOther: text('material_other'),
  diameterType: partDiameterTypeEnum('diameter_type'),
  diameterValue: numeric('diameter_value'),
  diameterUnit: partDiameterUnitEnum('diameter_unit'),
  diameterCode: text('diameter_code'),
  origin: partOriginEnum('origin'),
}, (table) => [
```

- [ ] **Step 3: Write the custom migration**

Run:
```bash
npx drizzle-kit generate --custom --name part_diameter_type
```
This creates an empty `drizzle/migrations/0013_part_diameter_type.sql` and updates the journal. Replace its contents with:

```sql
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
```

Then run:
```bash
npx drizzle-kit migrate
```

- [ ] **Step 4: Update the Part form fields**

In `app/data/categoryFormFields.ts`, find the `part` category's field array and replace:
```ts
{ key: 'p_diameter', label: 'Diameter', type: 'text' },
```
with:
```ts
{ key: 'p_diameter_type', label: 'Diameter Type', type: 'select', options: ['Measurement', 'Tube Code'] },
{ key: 'p_diameter_value', label: 'Diameter Value', type: 'number', showWhen: { field: 'p_diameter_type', equals: 'Measurement' } },
{ key: 'p_diameter_unit', label: 'Unit', type: 'select', options: ['mm', 'in'], showWhen: { field: 'p_diameter_type', equals: 'Measurement' } },
{ key: 'p_diameter_code', label: 'Tube Code', type: 'text', showWhen: { field: 'p_diameter_type', equals: 'Tube Code' } },
```
(Leave the array's other 4 fields — `p_part_category`, `p_part_number`, `p_material`, `p_origin` — exactly where they are; this just replaces the single diameter entry with 4 entries in the same position.)

- [ ] **Step 5: Combine the diameter fields into one Specifications row**

In `app/pages/items/[id].vue`, add a constant near the top of `<script setup>` (after the existing imports):
```ts
const DIAMETER_AUX_KEYS = new Set(['p_diameter_type', 'p_diameter_unit', 'p_diameter_code']);
```

Change `detailFields` from:
```ts
const detailFields = computed(() => {
  if (!item.value) return [];
  const detail = categoryDetail(item.value);
  if (!detail) return [];
  const config = CATEGORY_FORM_FIELDS[item.value.category] ?? [];
  return config
    .map((f) => {
      const columnKey = f.key.replace(/^p_/, '');
      let value = detail[columnKey];
      if (value === 'Other' && f.otherKey) {
        const otherColumnKey = f.otherKey.replace(/^p_/, '');
        value = detail[otherColumnKey] || 'Other';
      }
      return { label: f.label, value };
    })
    .filter((f) => f.value !== null && f.value !== undefined && f.value !== '');
});
```
to:
```ts
const detailFields = computed(() => {
  if (!item.value) return [];
  const detail = categoryDetail(item.value);
  if (!detail) return [];
  const config = CATEGORY_FORM_FIELDS[item.value.category] ?? [];
  return config
    .filter((f) => !DIAMETER_AUX_KEYS.has(f.key))
    .map((f) => {
      if (f.key === 'p_diameter_value') {
        const value = detail.diameter_type === 'Tube Code'
          ? detail.diameter_code
          : detail.diameter_value != null ? `${detail.diameter_value}${detail.diameter_unit ?? ''}` : null;
        return { label: 'Diameter', value };
      }
      const columnKey = f.key.replace(/^p_/, '');
      let value = detail[columnKey];
      if (value === 'Other' && f.otherKey) {
        const otherColumnKey = f.otherKey.replace(/^p_/, '');
        value = detail[otherColumnKey] || 'Other';
      }
      return { label: f.label, value };
    })
    .filter((f) => f.value !== null && f.value !== undefined && f.value !== '');
});
```

Note: `startEdit()`, `buildEditCategoryPayload()`, and `duplicateItem()` all loop over `CATEGORY_FORM_FIELDS[category]` generically by field key and need no special-casing for the new diameter fields — they already handle arbitrary fields correctly (confirmed by reading them during Tasks 1-2).

- [ ] **Step 6: Verify and commit**

```bash
npm run typecheck && npm run build
```
Expected: both pass with 0 errors.

Read-only DB check (scoped, no writes):
```sql
SELECT item_id, diameter_type, diameter_value, diameter_unit, diameter_code FROM model_rocket_parts WHERE item_id IN ('d37a196f-8fc5-4064-8c8a-ced119825527', '7f376f4a-0307-4c0c-a08f-4473f01729bc', 'a65dc408-3171-470e-b546-fe8bebbbef59');
```
Expected: exactly the 3 rows, with values matching the acceptance criteria above.

Live check (dev server, dedicated test account): Add Item → Model Rocket Part. Confirm "Diameter Type" shows Measurement/Tube Code options. Select Measurement — confirm a numeric value input and mm/in unit selector appear. Enter 18/mm, save — confirm the item's Specifications panel shows "Diameter: 18mm". Create a second Part, select Tube Code, enter "BT-60", save — confirm Specifications shows "Diameter: BT-60". Open one of the 3 pre-migrated Part items and confirm its Specifications panel shows the correct migrated Diameter value.

```bash
git add drizzle/schema/categories.ts drizzle/migrations/0013_part_diameter_type.sql drizzle/migrations/meta app/data/categoryFormFields.ts "app/pages/items/[id].vue"
git commit -m "Replace Model Rocket Part's free-text Diameter with typed Measurement/Tube Code fields"
```

---

## Task 4: End-to-end live verification

**USER-ORDERED GATE — NON-SKIPPABLE.** This project requires live verification of every shipped feature before merge, established across every prior phase without exception. Close only after an actual browser walkthrough has been run, with real captured output — not a code-only review.

**Goal:** Prove the full set of category-schema changes work correctly end-to-end against live infrastructure, with no regressions to any category not touched by this phase (Model Airplane, Model Rocket Kit), and no regression to search, Browse, Storage, or the Motors table.

**Files:** none (verification only)

**Acceptance Criteria:**
- [ ] Rocket Motor, Model Rocket Part, and Other Collectable can each be created with a blank Item Name and end up with a correct, sensible computed name
- [ ] Model Airplane, Model Rocket Kit, and Books/Printed Material still require Item Name and correctly block saving without one
- [ ] A computed fallback name is genuinely findable via both the header search box and the Search page
- [ ] Kit # is hidden by default on Printed Material, appears only for Category = "Model Plan", and its value is correctly nulled when submitted for a non-Model-Plan item
- [ ] Model Rocket Part's Diameter Type/Value/Unit/Code fields work correctly for both Measurement and Tube Code entries, and the Item Detail Specifications panel shows one clean "Diameter" row for each
- [ ] The 3 pre-existing migrated Part rows display their correct Diameter after migration
- [ ] No regression to Model Airplane or Model Rocket Kit (untouched categories) — create one of each, confirm nothing changed
- [ ] No regression to Browse, Storage, the Motors table, or Dashboard
- [ ] `npm run typecheck && npm run build` both pass

**Verify:** manual UI walkthrough covering every acceptance criterion above, using a dedicated test account; `npm run typecheck && npm run build`.

```json:metadata
{"files": [], "verifyCommand": "manual UI walkthrough; npm run typecheck && npm run build", "acceptanceCriteria": ["motor/part/other create with blank name works and computes a sensible name", "plane/kit/print still require a name", "computed fallback name is searchable", "kit # conditional visibility works and nulls correctly when hidden", "part diameter type/value/unit/code works for both Measurement and Tube Code", "specifications panel shows one clean Diameter row", "3 pre-existing migrated rows display correctly", "no regression to airplane/kit categories", "no regression to browse/storage/motors/dashboard", "typecheck and build pass"], "modelTier": "standard", "userGate": true, "tags": ["user-gate"]}
```

**Steps:**

- [ ] **Step 1: Static verification**

```bash
npm run typecheck && npm run build
```
Expected: both pass with 0 errors.

- [ ] **Step 2: Live walkthrough**

Using a dedicated test account (this is a REAL production Neon database with real users — never touch any existing real account's data), walk through:

1. Add Item → Rocket Motor with blank Item Name, Manufacturer + Designation filled in → save → confirm computed name shown correctly everywhere (Browse, its detail page, Motors table) and searchable.
2. Add Item → Model Rocket Part with blank Item Name, Part Category + Part Number filled in, Diameter Type = Measurement with a value/unit → save → confirm computed name and "Diameter: Xmm/in" both correct.
3. Add Item → Other Collectable with blank Item Name, Type filled in → save → confirm computed name correct.
4. Add Item → Model Airplane with blank Item Name → confirm blocked with "Item name is required."
5. Add Item → Model Rocket Kit with blank Item Name → confirm blocked.
6. Add Item → Books/Printed Material with blank Item Name → confirm blocked. Then fill in a name, set Category to "Model Plan", confirm Kit # appears, fill it in, save → confirm it's stored. Create a second Printed Material with Category NOT "Model Plan" but Kit # was typed before switching away → confirm the saved row has no Kit # value.
7. Create a Rocket Part with Diameter Type = Tube Code, value "BT-60" → confirm it saves and Specifications shows "Diameter: BT-60".
8. Open the 3 pre-existing migrated Part items (item_ids `d37a196f-8fc5-4064-8c8a-ced119825527`, `7f376f4a-0307-4c0c-a08f-4473f01729bc`, `a65dc408-3171-470e-b546-fe8bebbbef59`) — confirm each shows its correct migrated Diameter.
9. Spot-check Browse, Storage, Motors table, and Dashboard for any regression.

- [ ] **Step 3: Report and close**

Record the actual observed result for each acceptance criterion above. If anything fails, do not close this task — fix it and re-verify before closing.

---

## Plan self-review

**Spec coverage:** Every in-scope item from `docs/superpowers/specs/2026-08-23-category-schema-alignment-design.md` maps to a task — conditional visibility + Kit # (Task 1), Item Name optional with write-time fallback (Task 2), Part Diameter typed migration (Task 3), verification (Task 4). Every explicitly-out-of-scope item (Approx Value on Motor/Print, Storage Note, Manufacturer on Part, label wording, enum casing, field order, item linking, a dedicated diameter sort/filter UI) has no corresponding task, matching the approved spec's "keep as-is" list.

**Placeholder scan:** No TBD/TODO; every step has complete, literal code and SQL.

**Type consistency:** `showWhen: { field, equals }` is defined identically in Task 1 and reused identically in Task 3's new diameter fields. `computeFallbackName`'s signature (`category, shared, categoryFields`) matches exactly how it's called from both `useCreateItem.ts` and `useUpdateItem.ts` in Task 2. `NAME_REQUIRED_CATEGORIES` is defined identically (same 3 values) in both `new.vue` and `[id].vue`. The 3 migrated item_ids in Task 3's migration and its verification query match exactly (confirmed against the live DB before writing this plan).
