import { sql } from 'drizzle-orm';

export const ownerDefault = sql`(auth.user_id())`;

// Verifies the referenced items row is owned by the caller. Postgres FK
// constraints only check existence (not ownership) and bypass RLS entirely,
// so this must be combined with the owner_id check in every policy below.
export const ownsItem = (itemIdCol: any) => sql`EXISTS (
  SELECT 1 FROM items WHERE items.id = ${itemIdCol} AND items.owner_id = auth.user_id()
)`;
