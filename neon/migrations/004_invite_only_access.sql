BEGIN;

-- Somatic Pause is invite-only. Subscription records are retained as history,
-- but they no longer grant application access.
CREATE OR REPLACE FUNCTION public.has_access(check_user_id uuid, check_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, neon_auth
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM neon_auth."user" AS app_user
    WHERE app_user.id = auth.uid()
      AND app_user.id = check_user_id
      AND lower(app_user.email) = lower(check_email)
      AND COALESCE(app_user.banned, false) = false
      AND EXISTS (
        SELECT 1
        FROM public.whitelist AS allowed
        WHERE lower(allowed.email) = lower(app_user.email)
      )
  );
$$;

REVOKE ALL ON FUNCTION public.has_access(uuid, text) FROM PUBLIC, anonymous;
GRANT EXECUTE ON FUNCTION public.has_access(uuid, text) TO authenticated;

COMMIT;
