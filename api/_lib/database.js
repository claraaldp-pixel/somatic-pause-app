import { neon } from '@neondatabase/serverless';

let sqlClient;

export function getSql() {
  if (sqlClient) return sqlClient;

  const databaseUrl = process.env.NEON_DATABASE_URL;
  if (!databaseUrl) throw new Error('NEON_DATABASE_URL is not configured.');

  sqlClient = neon(databaseUrl);
  return sqlClient;
}
