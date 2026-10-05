BEGIN;

-- Managed Neon Auth JWTs guarantee the authenticated user ID through
-- auth.uid(), but do not guarantee a top-level email claim. Resolve the
-- verified email from Neon Auth instead of reading it from auth.jwt().
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
      AND (
        EXISTS (
          SELECT 1
          FROM public.whitelist AS allowed
          WHERE lower(allowed.email) = lower(app_user.email)
        )
        OR EXISTS (
          SELECT 1
          FROM public.subscriptions AS subscription
          WHERE subscription.user_id = app_user.id
            AND subscription.status IN ('active', 'trialing')
            AND (
              subscription.current_period_end IS NULL
              OR subscription.current_period_end > now()
            )
        )
      )
  );
$$;

REVOKE ALL ON FUNCTION public.has_access(uuid, text) FROM PUBLIC, anonymous;
GRANT EXECUTE ON FUNCTION public.has_access(uuid, text) TO authenticated;

COMMIT;
