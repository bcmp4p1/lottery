import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1717500000000 implements MigrationInterface {
  name = 'Init1717500000000';

  public async up(q: QueryRunner): Promise<void> {
    // gen_random_uuid()
    await q.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);

    await q.query(`
      CREATE TABLE IF NOT EXISTS profiles (
        id uuid PRIMARY KEY,
        email text NOT NULL,
        role text NOT NULL DEFAULT 'user',
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    await q.query(`
      CREATE TABLE IF NOT EXISTS draws (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        title text NOT NULL,
        description text NOT NULL DEFAULT '',
        ticket_price integer NOT NULL,
        draw_date timestamptz NOT NULL,
        status text NOT NULL DEFAULT 'draft',
        max_tickets integer NOT NULL,
        guaranteed_winner boolean NOT NULL DEFAULT true,
        winning_number integer,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    await q.query(`
      CREATE TABLE IF NOT EXISTS tickets (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        draw_id uuid NOT NULL REFERENCES draws(id) ON DELETE CASCADE,
        user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        ticket_number integer NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT uq_ticket_draw_number UNIQUE (draw_id, ticket_number)
      );
    `);

    await q.query(`CREATE INDEX IF NOT EXISTS idx_tickets_user ON tickets(user_id);`);
    await q.query(`CREATE INDEX IF NOT EXISTS idx_tickets_draw ON tickets(draw_id);`);

    // Auto-create a profile when a new Supabase auth user is created.
    await q.query(`
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS trigger
      LANGUAGE plpgsql
      SECURITY DEFINER SET search_path = public
      AS $$
      BEGIN
        INSERT INTO public.profiles (id, email)
        VALUES (NEW.id, NEW.email)
        ON CONFLICT (id) DO NOTHING;
        RETURN NEW;
      END;
      $$;
    `);

    await q.query(`DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;`);
    await q.query(`
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    `);

    // Backfill profiles for any users that already exist.
    await q.query(`
      INSERT INTO public.profiles (id, email)
      SELECT id, email
      FROM auth.users
      ON CONFLICT (id) DO NOTHING;
    `);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;`);
    await q.query(`DROP FUNCTION IF EXISTS public.handle_new_user();`);
    await q.query(`DROP TABLE IF EXISTS tickets;`);
    await q.query(`DROP TABLE IF EXISTS draws;`);
    await q.query(`DROP TABLE IF EXISTS profiles;`);
  }
}
