# Item Quantity Field — Design

## Problem

Items are tracked one row per physical unit today. If you own 3 of the same
rocket kit, you either make 3 separate entries or track a single entry whose
`approx_value_usd` silently under- or over-states your actual holdings.
Rocket motors already have a category-specific `quantity` field, but it only
feeds a dashboard count — it does not affect the item's value anywhere.

## Goals

- Add a single `quantity` field, at the item level, that applies to every
  category (not just motors).
- Treat `approx_value_usd` as a per-unit price. Value shown/summed anywhere
  in the app becomes `approx_value_usd × quantity`.
- Consolidate the existing motor-specific `quantity` field into the new
  general field, migrating existing data — no duplicate "Quantity" inputs on
  the motor form, no data loss.

## Non-goals

- No inline breakdown display (e.g. "3 × $50 = $150"). Just show the
  computed total, same as today's single value display.
- No server-side/generated-column computation. Search and browse already
  sort/filter client-side after fetching all items; the multiplication stays
  client-side too.

## Design

### 1. Schema

- `drizzle/schema/items.ts`: add `quantity: integer('quantity').notNull().default(1)`.
- `drizzle/schema/categories.ts`: remove `quantity` from `rocketMotors`.
- Migration:
  1. Add `items.quantity` (not null, default 1).
  2. Backfill: for items whose category is `motor`, set `items.quantity` from
     the corresponding `rocket_motors.quantity`, falling back to 1 where that
     was null.
  3. Drop `rocket_motors.quantity`.

Existing non-motor items get `quantity = 1`, so their computed total value is
unchanged after migration. Existing motor items keep their prior count, but
their computed total value will now be `unit price × quantity` instead of a
bare unit price — this is the intended fix, but is a visible number change
for anyone already tracking multi-quantity motors.

### 2. Forms (`app/pages/items/new.vue`, `app/pages/items/[id].vue`)

- Add a "Quantity" number input at the item level (alongside "Approx. Value
  USD", not inside the category-specific fields block). Default `1`, `min=1`,
  integer.
- Remove the `p_quantity` entry from `CATEGORY_FORM_FIELDS.motor` in
  `app/data/categoryFormFields.ts` — quantity is no longer a category-specific
  field for motors.
- `useCreateItem` / `useUpdateItem`: add `quantity` to the shared item
  payload (alongside `approxValueUsd`), not to the category-specific `p_*`
  payload.

### 3. Value computation

Add a helper, `getItemTotalValue(item)`, in `app/composables/useItems.ts`:

```ts
function getItemTotalValue(item: { approx_value_usd: string | null; quantity: number }): number | null {
  if (item.approx_value_usd === null) return null;
  return Number(item.approx_value_usd) * (item.quantity ?? 1);
}
```

Returns `null` when there's no value set, so "missing value" filtering
(`browse.vue`'s `approx_value_usd === null` filter) keeps working unchanged.

Replace direct `approx_value_usd` reads with this helper at:

- `app/components/ItemCard.vue` — card price display.
- `app/pages/index.vue` — `totalValue` computed (dashboard "Est. total
  value" sum).
- `app/pages/items/[id].vue` — big value display box.
- `app/pages/search.vue` — value column.
- `app/pages/browse.vue` — sort-by-value comparator (the "missing value"
  filter itself stays keyed on raw `approx_value_usd === null`, not the
  helper's output).

Display format stays "just the total" (e.g. `$150`) — no inline
quantity × price breakdown anywhere value is shown.

### 4. Dashboard motor count (`app/pages/index.vue`)

`motorsOnHandCount` and the impulse-class breakdown currently read
`categoryDetail(it)?.quantity` (the old motor-specific field). Update both to
read `it.quantity` (the new item-level field) instead.

### 5. Types

`ItemRecord` (in `useItems.ts` and `useSearchItems.ts`) gains a `quantity:
number` field, matching the new column.

## Edge cases

- Quantity is required, defaults to 1, minimum 1 — no zero or negative
  quantities.
- Items with no `approx_value_usd` set: `getItemTotalValue` returns `null`,
  same as today's "no value" state (renders nothing / excluded from sums).

## Testing

- Create a kit item with quantity 3 and a per-unit value; verify the card,
  detail page, dashboard total, search, and browse all show the ×3 total.
- Edit an existing item's quantity; verify displayed/summed value updates.
- Verify a motor item's value now reflects its (migrated) quantity, and that
  the motor form no longer shows a separate category-specific Quantity
  field.
- Verify dashboard motor-on-hand counts still match pre-migration numbers
  after switching to `item.quantity`.
- Run the migration against a copy of existing data and confirm no rows lose
  their quantity value in the process.
