import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { DrawStatus, Ticket, TicketWithResult } from '@lottery/shared';
import { DrawEntity } from '../database/entities/draw.entity';
import { TicketEntity } from '../database/entities/ticket.entity';

@Injectable()
export class TicketsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(TicketEntity)
    private readonly tickets: Repository<TicketEntity>,
  ) {}

  /**
   * Buy one ticket for a draw. Runs in a transaction that takes a write lock on
   * the draw row, so concurrent buyers are serialized and ticket numbers stay
   * unique and gap-free. The UNIQUE(draw_id, ticket_number) constraint is the
   * final safety net.
   */
  async purchase(drawId: string, userId: string): Promise<Ticket> {
    return this.dataSource.transaction(async (manager) => {
      const draw = await manager.findOne(DrawEntity, {
        where: { id: drawId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!draw) throw new NotFoundException('Draw not found');
      if (draw.status !== DrawStatus.Open) {
        throw new ConflictException('Draw is not open for purchase');
      }
      if (draw.drawDate.getTime() <= Date.now()) {
        throw new ConflictException('Draw has closed');
      }

      const sold = await manager.count(TicketEntity, { where: { drawId } });
      if (sold >= draw.maxTickets) {
        throw new ConflictException('Draw is sold out');
      }

      // The buyer's profile is guaranteed to exist: every authenticated request
      // passes through AuthGuard, which ensures the profile row (see AuthService).
      const ticket = manager.create(TicketEntity, {
        drawId,
        userId,
        ticketNumber: sold + 1,
      });
      const saved = await manager.save(ticket);
      return this.toTicketDto(saved);
    });
  }

  async listForUser(userId: string): Promise<TicketWithResult[]> {
    const rows = await this.tickets.find({
      where: { userId },
      relations: { draw: true },
      order: { createdAt: 'DESC' },
    });

    return rows.map((t) => ({
      ...this.toTicketDto(t),
      isWinner:
        t.draw.status === DrawStatus.Finished &&
        t.draw.winningNumber === t.ticketNumber,
      draw: {
        id: t.draw.id,
        title: t.draw.title,
        status: t.draw.status,
        winningNumber: t.draw.winningNumber,
        drawDate: t.draw.drawDate.toISOString(),
      },
    }));
  }

  private toTicketDto(t: TicketEntity): Ticket {
    return {
      id: t.id,
      drawId: t.drawId,
      userId: t.userId,
      ticketNumber: t.ticketNumber,
      createdAt: t.createdAt.toISOString(),
    };
  }
}
