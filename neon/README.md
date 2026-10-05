# Neon migration

The migration deliberately keeps each Supabase user UUID so profiles, check-ins,
subscriptions, and favourites remain attached to the correct person.

## Order

1. Apply `migrations/001_initial_schema.sql`.
2. Import the backed-up Supabase users into `neon_auth.user` using their original IDs.
3. Import `.migration-backups/supabase-2026-10-05/public-data.sql`.
4. Apply `migrations/002_finalize_auth.sql`.
5. Verify row counts and foreign keys.

Supabase password hashes are bcrypt, while managed Neon Auth uses Better Auth's
managed password configuration. Existing users therefore keep their account and
history but must use **Forgot password** once to create a Neon-compatible password.

The `upload`, `audio`, and `image` video types remain temporarily valid so the
existing records work while their files are moved to YouTube. New entries in the
app should use YouTube or Vimeo URLs.
