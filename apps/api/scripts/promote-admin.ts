/**
 * Promote (or demote) a user by setting their role in the `profiles` table,
 * which is the source of truth for authorization. The change takes effect on
 * the user's next request — no re-login needed.
 *
 * You can also just edit the `role` cell directly in the Supabase Table Editor.
 *
 * Usage:
 *   pnpm --filter @lottery/api promote-admin user@example.com
 *   pnpm --filter @lottery/api promote-admin user@example.com user   # demote
 */
import 'dotenv/config';
import { Client } from 'pg';

async function main() {
  const email = process.argv[2];
  const role = (process.argv[3] ?? 'admin') as 'admin' | 'user';
  if (!email) throw new Error('Usage: promote-admin <email> [admin|user]');

  const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DIRECT_URL or DATABASE_URL must be set');

  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    // Update the profile if it exists.
    const updated = await client.query(
      `UPDATE profiles SET role = $2 WHERE lower(email) = lower($1) RETURNING id`,
      [email, role],
    );
    if (updated.rowCount && updated.rowCount > 0) {
      console.log(`✓ ${email} is now '${role}'.`);
      return;
    }

    // No profile yet — try to create one from the auth user.
    const authUser = await client.query(
      `SELECT id FROM auth.users WHERE lower(email) = lower($1)`,
      [email],
    );
    if (authUser.rowCount === 0) {
      throw new Error(`No user found with email ${email}. Have they signed up?`);
    }
    await client.query(
      `INSERT INTO profiles (id, email, role) VALUES ($1, $2, $3)
       ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role`,
      [authUser.rows[0].id, email, role],
    );
    console.log(`✓ ${email} is now '${role}' (profile created).`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
