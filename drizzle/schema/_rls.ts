import { sql } from 'drizzle-orm';

export const ownerDefault = sql`public.current_owner_id()`;

// auth.user_id() returns text; owner_id columns are uuid. Postgres does not
// implicitly cast text to uuid for equality, so the cast must be explicit
// here rather than relying on drizzle-orm/neon's authUid() helper, which
// does not cast.
export const isOwner = (col: any) => sql`(select (auth.user_id())::uuid = ${col})`;

// Verifies the referenced items row is owned by the caller. Postgres FK
// constraints only check existence (not ownership) and bypass RLS entirely,
// so this must be combined with the owner_id check in every policy below.
export const ownsItem = (itemIdCol: any) => sql`EXISTS (
  SELECT 1 FROM items WHERE items.id = ${itemIdCol} AND items.owner_id = (auth.user_id())::uuid
)`;
