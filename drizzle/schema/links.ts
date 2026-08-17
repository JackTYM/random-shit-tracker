import { pgTable, uuid, text, integer, boolean, index } from 'drizzle-orm/pg-core';
import { crudPolicy, authenticatedRole } from 'drizzle-orm/neon';
import { sql } from 'drizzle-orm';
import { items } from './items';
import { ownerDefault, ownsItem, isOwner } from './_rls';

export const itemPhotos = pgTable('item_photos', {
  id: uuid('id').defaultRandom().primaryKey(),
  itemId: uuid('item_id').notNull().references(() => items.id, { onDelete: 'cascade' }),
  ownerId: uuid('owner_id').notNull().default(ownerDefault),
  r2Key: text('r2_key').notNull(),
  url: text('url').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  isPrimary: boolean('is_primary').notNull().default(false),
}, (table) => [
  index('item_photos_item_id_idx').on(table.itemId),
  crudPolicy({
    role: authenticatedRole,
    read: sql`${isOwner(table.ownerId)} AND ${ownsItem(table.itemId)}`,
    modify: sql`${isOwner(table.ownerId)} AND ${ownsItem(table.itemId)}`,
  }),
]);

export const itemLinks = pgTable('item_links', {
  id: uuid('id').defaultRandom().primaryKey(),
  itemId: uuid('item_id').notNull().references(() => items.id, { onDelete: 'cascade' }),
  ownerId: uuid('owner_id').notNull().default(ownerDefault),
  relatedItemId: uuid('related_item_id').notNull().references(() => items.id, { onDelete: 'cascade' }),
  relationshipLabel: text('relationship_label').notNull(),
}, (table) => [
  index('item_links_item_id_idx').on(table.itemId),
  index('item_links_related_item_id_idx').on(table.relatedItemId),
  crudPolicy({
    role: authenticatedRole,
    read: sql`${isOwner(table.ownerId)} AND ${ownsItem(table.itemId)} AND ${ownsItem(table.relatedItemId)}`,
    modify: sql`${isOwner(table.ownerId)} AND ${ownsItem(table.itemId)} AND ${ownsItem(table.relatedItemId)}`,
  }),
]);
