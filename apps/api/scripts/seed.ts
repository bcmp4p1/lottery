/**
 * Idempotent demo seed: creates a demo admin and a demo buyer so the app can be
 * tested immediately. Safe to run multiple times.
 *
 * Users are created via the Supabase Auth Admin API (email pre-confirmed, so no
 * email is sent — avoids the shared-SMTP rate limit). Roles live in the
 * `profiles` table (the source of truth), so the admin role is set there.
 *
 * Credentials are read from env (no hardcoded defaults — never commit secrets):
 *   SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD / SEED_USER_EMAIL / SEED_USER_PASSWORD
 *
 * Usage: pnpm --filter @lottery/api seed
 */
import 'dotenv/config';
import { Client } from 'pg';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SECRET_KEY = process.env.SUPABASE_SECRET_KEY;
const DB_URL = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}. Set the SEED_* env vars before seeding.`);
  }
  return value;
}

function headers() {
  return {
    apikey: SECRET_KEY as string,
    Authorization: `Bearer ${SECRET_KEY}`,
    'Content-Type': 'application/json',
  };
}

/** Create an email-confirmed user; no-op if it already exists. */
async function ensureUser(email: string, password: string): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ email, password, email_confirm: true }),
  });
  if (res.ok) {
    console.log(`  created auth user: ${email}`);
    return;
  }
  const body = await res.text();
  if (/already.*(registered|exists)|email_exists/i.test(body)) {
    console.log(`  auth user already exists: ${email}`);
    return;
  }
  throw new Error(`Failed to create ${email}: ${res.status} ${body}`);
}

/** Set the role in `profiles` (source of truth), creating the row if needed. */
async function setRole(client: Client, email: string, role: 'admin' | 'user'): Promise<void> {
  const updated = await client.query(
    `UPDATE profiles SET role = $2 WHERE lower(email) = lower($1) RETURNING id`,
    [email, role],
  );
  if (updated.rowCount && updated.rowCount > 0) return;

  // Profile not created yet (e.g. trigger absent) — create it from auth.users.
  const authUser = await client.query(
    `SELECT id FROM auth.users WHERE lower(email) = lower($1)`,
    [email],
  );
  if (authUser.rowCount) {
    await client.query(
      `INSERT INTO profiles (id, email, role) VALUES ($1, $2, $3)
       ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role`,
      [authUser.rows[0].id, email, role],
    );
  }
}

async function main() {
  if (!SUPABASE_URL || !SECRET_KEY || !DB_URL) {
    throw new Error('SUPABASE_URL, SUPABASE_SECRET_KEY and DIRECT_URL/DATABASE_URL must be set');
  }

  const admin = {
    email: requireEnv('SEED_ADMIN_EMAIL'),
    password: requireEnv('SEED_ADMIN_PASSWORD'),
  };
  const buyer = {
    email: requireEnv('SEED_USER_EMAIL'),
    password: requireEnv('SEED_USER_PASSWORD'),
  };

  console.log('Seeding demo users…');
  await ensureUser(admin.email, admin.password);
  await ensureUser(buyer.email, buyer.password);

  const client = new Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await setRole(client, admin.email, 'admin');
    await setRole(client, buyer.email, 'user');
  } finally {
    await client.end();
  }

  // Don't echo passwords — the operator already set them via env.
  console.log('\n✓ Seed complete:');
  console.log(`  admin → ${admin.email}`);
  console.log(`  buyer → ${buyer.email}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
