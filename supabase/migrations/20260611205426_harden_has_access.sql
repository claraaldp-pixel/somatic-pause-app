-- Postgres grants EXECUTE on new functions to PUBLIC by default, which would
-- let the anon role call has_access() (and probe arbitrary emails against the
-- whitelist). Restrict it to authenticated users only.
revoke execute on function public.has_access(uuid, text) from public;
grant execute on function public.has_access(uuid, text) to authenticated;
