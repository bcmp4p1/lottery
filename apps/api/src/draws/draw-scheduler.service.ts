import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';

/**
 * Schedules a one-off pg_cron job that fires at a draw's date and calls our
 * internal finalize endpoint (see the `fire_draw_finalize` DB function).
 *
 * No-ops if PUBLIC_API_URL / INTERNAL_FINALIZE_SECRET aren't configured, so
 * local dev works without the cron wiring. pg_cron evaluates schedules in UTC.
 */
@Injectable()
export class DrawScheduler {
  private readonly logger = new Logger(DrawScheduler.name);
  private readonly apiUrl?: string;
  private readonly secret?: string;

  constructor(
    private readonly dataSource: DataSource,
    config: ConfigService,
  ) {
    this.apiUrl = config.get<string>('PUBLIC_API_URL');
    this.secret = config.get<string>('INTERNAL_FINALIZE_SECRET');
  }

  async scheduleFinalize(drawId: string, drawDate: Date): Promise<void> {
    if (!this.apiUrl || !this.secret) {
      this.logger.warn('PUBLIC_API_URL/INTERNAL_FINALIZE_SECRET not set — skipping auto-finalize scheduling');
      return;
    }
    const jobName = this.jobName(drawId);
    const schedule = toCronExpression(drawDate);
    const url = `${this.apiUrl}/internal/draws/${drawId}/finalize`;
    const command = `SELECT public.fire_draw_finalize('${drawId}'::uuid, '${url}', '${this.secret}')`;

    try {
      await this.dataSource.query(`SELECT cron.schedule($1, $2, $3)`, [
        jobName,
        schedule,
        command,
      ]);
    } catch (err) {
      // Don't fail the publish if scheduling is unavailable (e.g. extension off).
      this.logger.error(`Failed to schedule ${jobName}: ${(err as Error).message}`);
    }
  }

  async cancelFinalize(drawId: string): Promise<void> {
    try {
      await this.dataSource.query(
        `SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = $1`,
        [this.jobName(drawId)],
      );
    } catch (err) {
      this.logger.error(`Failed to unschedule for ${drawId}: ${(err as Error).message}`);
    }
  }

  private jobName(drawId: string): string {
    return `finalize-draw-${drawId}`;
  }
}

/** Builds a 5-field cron expression that fires once at the given instant (UTC). */
function toCronExpression(date: Date): string {
  return [
    date.getUTCMinutes(),
    date.getUTCHours(),
    date.getUTCDate(),
    date.getUTCMonth() + 1,
    '*',
  ].join(' ');
}
