-- Custom SQL migration file, put your code below! --

-- RLS policies (isOwner/ownsItem in drizzle/schema/_rls.ts) already work fine calling
-- auth.user_id() directly, because policy expressions are resolved once at CREATE POLICY
-- time by neondb_owner (who has USAGE on schema auth) and don't re-check schema USAGE at
-- query time. But anything that evaluates auth.user_id() fresh under the `authenticated`
-- role's own privileges at execution time -- column DEFAULT expressions, and direct calls
-- inside SECURITY INVOKER functions -- fails, because `authenticated` was never granted
-- USAGE on schema auth (see migration 0008's note). This wrapper works around that gap:
-- SECURITY DEFINER functions execute their body with the OWNER's privileges (neondb_owner,
-- which has schema-auth USAGE), so `authenticated` only needs EXECUTE on this wrapper, not
-- USAGE on auth itself.

CREATE OR REPLACE FUNCTION public.current_owner_id() RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT (auth.user_id())::uuid;
$$;

REVOKE EXECUTE ON FUNCTION public.current_owner_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_owner_id() TO authenticated;
