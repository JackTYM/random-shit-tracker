import { pgTable, uuid, text, integer, boolean } from 'drizzle-orm/pg-core';
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

export const itemPhotos = pgTable('item_photos', {
  id: uuid('id').defaultRandom().primaryKey(),
  itemId: uuid('item_id').notNull().references(() => items.id, { onDelete: 'cascade' }),
  ownerId: uuid('owner_id').notNull().default(ownerDefault),
  r2Key: text('r2_key').notNull(),
  url: text('url').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  isPrimary: boolean('is_primary').notNull().default(false),
}, (table) => [
  crudPolicy({
    role: authenticatedRole,
    read: sql`${authUid(table.ownerId)} AND ${ownsItem(table.itemId)}`,
    modify: sql`${authUid(table.ownerId)} AND ${ownsItem(table.itemId)}`,
  }),
]);

export const itemLinks = pgTable('item_links', {
  id: uuid('id').defaultRandom().primaryKey(),
  ownerId: uuid('owner_id').notNull().default(ownerDefault),
  itemId: uuid('item_id').notNull().references(() => items.id, { onDelete: 'cascade' }),
  relatedItemId: uuid('related_item_id').notNull().references(() => items.id, { onDelete: 'cascade' }),
  relationshipLabel: text('relationship_label').notNull(),
}, (table) => [
  crudPolicy({
    role: authenticatedRole,
    read: sql`${authUid(table.ownerId)} AND ${ownsItem(table.itemId)} AND ${ownsItem(table.relatedItemId)}`,
    modify: sql`${authUid(table.ownerId)} AND ${ownsItem(table.itemId)} AND ${ownsItem(table.relatedItemId)}`,
  }),
]);
