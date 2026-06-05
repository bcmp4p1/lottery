import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DrawStatus } from '@lottery/shared';
import { TicketEntity } from './ticket.entity';

@Entity('draws')
export class DrawEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  title!: string;

  @Column({ type: 'text', default: '' })
  description!: string;

  /** Price in the smallest currency unit (e.g. cents). */
  @Column({ name: 'ticket_price', type: 'integer' })
  ticketPrice!: number;

  @Column({ name: 'draw_date', type: 'timestamptz' })
  drawDate!: Date;

  @Column({ type: 'text', default: DrawStatus.Draft })
  status!: DrawStatus;

  /** Size of the number pool and the hard cap on tickets sold. */
  @Column({ name: 'max_tickets', type: 'integer' })
  maxTickets!: number;

  /** If true, the winning number is drawn from sold tickets only (guarantees a winner). */
  @Column({ name: 'guaranteed_winner', type: 'boolean', default: true })
  guaranteedWinner!: boolean;

  /** Null until the draw is finished (and stays mismatched if a chance-based draw hits an unsold number). */
  @Column({ name: 'winning_number', type: 'integer', nullable: true })
  winningNumber!: number | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @OneToMany(() => TicketEntity, (ticket) => ticket.draw)
  tickets!: TicketEntity[];
}
