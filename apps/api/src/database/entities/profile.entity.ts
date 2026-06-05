import { Column, CreateDateColumn, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { UserRole } from '@lottery/shared';
import { TicketEntity } from './ticket.entity';

/**
 * Mirrors a Supabase `auth.users` row. The primary key is the Supabase user id.
 * Created automatically by a DB trigger on signup (and lazily by the AuthGuard).
 *
 * `role` is the single source of truth for authorization. The AuthGuard reads it
 * from here on each authenticated request (the JWT only proves identity). To make
 * someone an admin, edit this column (Supabase Table Editor or the promote-admin
 * script) — the change takes effect on their next request, no re-login needed.
 */
@Entity('profiles')
export class ProfileEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  email!: string;

  @Column({ type: 'text', default: UserRole.User })
  role!: UserRole;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @OneToMany(() => TicketEntity, (ticket) => ticket.user)
  tickets!: TicketEntity[];
}
