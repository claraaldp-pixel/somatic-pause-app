export function getUserDisplayName(user) {
  return (
    user?.user_metadata?.displayName?.trim()
    || user?.user_metadata?.full_name?.trim()
    || user?.user_metadata?.name?.trim()
    || user?.email?.split('@')[0]
    || ''
  );
}
