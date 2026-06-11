-- Supabase grants EXECUTE on new public-schema functions to anon by default
-- (in addition to PUBLIC, handled in the previous migration). Revoke it here
-- so only authenticated users can call has_access().
revoke execute on function public.has_access(uuid, text) from anon;
