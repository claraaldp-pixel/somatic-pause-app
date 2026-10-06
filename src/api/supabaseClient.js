import { createClient, SupabaseAuthAdapter } from '@neondatabase/neon-js';
import { browserAuthUrl, configuredAuthUrl } from '@/api/neonConfig';

const dataApiUrl = import.meta.env.VITE_NEON_DATA_API_URL;

if (!configuredAuthUrl || !dataApiUrl) {
  throw new Error('Missing VITE_NEON_AUTH_URL or VITE_NEON_DATA_API_URL');
}

// Keep the existing export name while the app is migrated. The adapter retains
// the Supabase-shaped auth and database APIs used throughout the frontend.
export const supabase = createClient({
  auth: {
    adapter: SupabaseAuthAdapter(),
    url: browserAuthUrl,
  },
  dataApi: {
    url: dataApiUrl,
  },
});

// Better Auth methods that do not have a one-to-one Supabase equivalent.
export const neonAuth = supabase.auth.getBetterAuthInstance();
