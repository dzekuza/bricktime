-- =============================================================================
-- Lock down evaluate_achievements() (2026-08-27)
-- The function is SECURITY DEFINER and takes the subscriber id as an argument,
-- but sits in the exposed `public` schema with the default PUBLIC execute
-- grant -- so anyone, signed in or not, could POST
-- /rest/v1/rpc/evaluate_achievements with an arbitrary uuid and force-evaluate
-- another member's achievements. refresh_my_achievements() (20260826235922) is
-- now the only caller-facing entry point and scopes itself to auth.uid(), so
-- the raw function no longer needs to be reachable over the API. The
-- feed_items / feed_likes triggers are SECURITY DEFINER and owned by postgres,
-- so they keep working.
-- =============================================================================

revoke execute on function evaluate_achievements(uuid) from public;
revoke execute on function evaluate_achievements(uuid) from anon;
revoke execute on function evaluate_achievements(uuid) from authenticated;
