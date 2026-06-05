import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { DrawEntity } from './draw.entity';
import { ProfileEntity } from './profile.entity';

@Entity('tickets')
@Unique('uq_ticket_draw_number', ['drawId', 'ticketNumber'])
export class TicketEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'draw_id', type: 'uuid' })
  drawId!: string;

  @ManyToOne(() => DrawEntity, (draw) => draw.tickets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'draw_id' })
  draw!: DrawEntity;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => ProfileEntity, (profile) => profile.tickets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: ProfileEntity;

  /** Unique sequential number within the draw. */
  @Column({ name: 'ticket_number', type: 'integer' })
  ticketNumber!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
