BEGIN;

-- Run after the existing users and application data have been imported.
UPDATE public.profiles AS profile
SET email = auth_user.email
FROM neon_auth."user" AS auth_user
WHERE profile.id = auth_user.id
  AND profile.email IS DISTINCT FROM auth_user.email;

DROP TRIGGER IF EXISTS create_profile_after_neon_user ON neon_auth."user";

CREATE TRIGGER create_profile_after_neon_user
AFTER INSERT ON neon_auth."user"
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_neon_user();

COMMIT;
