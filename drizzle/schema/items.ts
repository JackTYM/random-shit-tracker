import { pgTable, pgEnum, uuid, text, numeric, date, timestamp } from 'drizzle-orm/pg-core';
import { crudPolicy, authenticatedRole } from 'drizzle-orm/neon';
import { ownerDefault, isOwner } from './_rls';

export const categoryEnum = pgEnum('category', ['motor', 'kit', 'plane', 'part', 'print', 'other']);

export const items = pgTable('items', {
  id: uuid('id').defaultRandom().primaryKey(),
  ownerId: uuid('owner_id').notNull().default(ownerDefault),
  category: categoryEnum('category').notNull(),
  name: text('name').notNull(),
  manufacturerOrClub: text('manufacturer_or_club'),
  storageLocation: text('storage_location'),
  approxValueUsd: numeric('approx_value_usd'),
  valueEstimatedAt: date('value_estimated_at'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  crudPolicy({
    role: authenticatedRole,
    read: isOwner(table.ownerId),
    modify: isOwner(table.ownerId),
  }),
]);
