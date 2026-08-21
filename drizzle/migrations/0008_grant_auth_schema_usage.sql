-- Custom SQL migration file, put your code below! --

-- Neon's Data API auto-provisions default grants on the `public` schema only when the
-- Data API is enabled. The `auth` schema (Neon Auth's `auth.user_id()` etc., used by every
-- RLS policy and the create_*_item RPC functions in this project) was never granted USAGE
-- to the `authenticated` role -- apparently a gap in this project's initial setup, not
-- something any prior migration in this repo ever addressed. This has silently broken ALL
-- item creation (every create_*_item RPC call fails with "permission denied for schema
-- auth" since those functions call auth.user_id() internally) since before this migration.
--
-- NOTE (added after applying): this GRANT is INEFFECTIVE. The `auth` schema is owned by
-- Neon's internal `cloud_admin` role, not `neondb_owner` (the role this migration runs as),
-- and `neondb_owner` has no GRANT OPTION on it -- so this statement silently no-ops (no
-- error, but the ACL is unchanged, confirmed via before/after inspection of pg_namespace).
-- The actual fix does not require Neon-side privilege escalation at all -- see migration
-- 0009, which wraps auth.user_id() in a SECURITY DEFINER function instead.

GRANT USAGE ON SCHEMA auth TO authenticated;
