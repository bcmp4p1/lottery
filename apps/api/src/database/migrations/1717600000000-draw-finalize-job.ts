import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Helper invoked by a per-draw pg_cron job at the draw's date. It calls our API
 * (via pg_net) to finalize the draw, then unschedules its own one-off job.
 * Requires the `pg_cron` and `pg_net` extensions to be enabled.
 */
export class DrawFinalizeJob1717600000000 implements MigrationInterface {
  name = 'DrawFinalizeJob1717600000000';

  public async up(q: QueryRunner): Promise<void> {
    await q.query(`
      CREATE OR REPLACE FUNCTION public.fire_draw_finalize(
        p_draw_id uuid,
        p_url text,
        p_secret text
      )
      RETURNS void
      LANGUAGE plpgsql
      SECURITY DEFINER SET search_path = public
      AS $$
      BEGIN
        PERFORM net.http_post(
          url := p_url,
          headers := jsonb_build_object(
            'x-internal-secret', p_secret,
            'Content-Type', 'application/json'
          ),
          body := '{}'::jsonb
        );
        -- One-off job: remove itself so it doesn't re-fire.
        PERFORM cron.unschedule('finalize-draw-' || p_draw_id::text);
      END;
      $$;
    `);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP FUNCTION IF EXISTS public.fire_draw_finalize(uuid, text, text);`);
  }
}
