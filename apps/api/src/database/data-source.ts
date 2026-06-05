import 'dotenv/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import { DrawEntity } from './entities/draw.entity';
import { ProfileEntity } from './entities/profile.entity';
import { TicketEntity } from './entities/ticket.entity';

export const entities = [ProfileEntity, DrawEntity, TicketEntity];

/** Builds TypeORM options for a given connection URL (Supabase requires SSL). */
export function buildDataSourceOptions(url: string): DataSourceOptions {
  return {
    type: 'postgres',
    url,
    entities,
    migrations: [__dirname + '/migrations/*.{ts,js}'],
    synchronize: false,
    ssl: { rejectUnauthorized: false },
  };
}

/**
 * DataSource used by the TypeORM CLI for migrations.
 * Uses DIRECT_URL (session pooler) which supports the session features DDL needs.
 */
const migrationUrl =
  process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? '';

export default new DataSource(buildDataSourceOptions(migrationUrl));
